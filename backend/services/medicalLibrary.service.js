const fs = require("fs");
const path = require("path");

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_SPECIALTY_MAP = new Map([
  ["hô hấp", ["Hô hấp", "Tai Mũi Họng"]],
  ["tai mũi họng", ["Tai Mũi Họng"]],
  ["tim mạch", ["Tim mạch", "Nội khoa"]],
  ["tiêu hóa", ["Tiêu hóa", "Nội soi"]],
  ["tiêu hóa - gan mật", ["Tiêu hóa - Gan mật", "Truyền nhiễm"]],
  ["thần kinh", ["Thần kinh"]],
  ["cơ xương khớp", ["Cơ Xương Khớp", "Vật lý trị liệu"]],
  ["da liễu", ["Da liễu"]],
  ["truyền nhiễm", ["Truyền nhiễm"]],
  ["truyền nhiễm/hô hấp", ["Truyền nhiễm", "Hô hấp"]],
  ["nội tiết", ["Nội tiết"]],
  ["nội tiết - chuyển hóa", ["Nội tiết", "Dinh dưỡng"]],
  ["tiết niệu", ["Tiết niệu"]],
  ["mắt", ["Mắt"]],
  ["răng hàm mặt", ["Răng Hàm Mặt"]],
  ["tâm thần", ["Tâm thần", "Tâm lý"]],
  ["huyết học", ["Huyết học"]],
  ["nhi khoa", ["Nhi khoa"]],
  ["dị ứng", ["Dị ứng miễn dịch"]],
  ["cấp cứu", ["Cấp cứu"]],
  ["cấp cứu/da liễu", ["Cấp cứu", "Da liễu"]],
]);

const URGENCY_KEYWORDS = [
  { level: "khẩn cấp", terms: ["khó thở", "hôn mê", "co giật", "đau ngực", "ngưng thở", "mạch"] },
  { level: "cần khám sớm", terms: ["sốt cao", "ho ra máu", "ngất", "mất ý thức", "bất thường"] },
];

class MedicalLibraryService {
  constructor() {
    this.filePath = path.join(__dirname, "..", "data", "enhanced_medical_library.json");
    this.entries = [];
    this.docVectors = [];
    this.idf = new Map();
    this.totalDocs = 0;
    this.loadLibrary();
    this.registerWatcher();
  }

  registerWatcher() {
    try {
      fs.watchFile(this.filePath, { interval: 5000 }, () => {
        console.log("♻️  medical_library.json changed -> reloading cache");
        this.loadLibrary();
      });
    } catch (error) {
      console.warn("⚠️  Cannot watch medical_library.json:", error.message);
    }
  }

  loadLibrary() {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("medical_library.json phải là một mảng");
      }

      this.entries = parsed
        .map((entry, index) => this.normalizeEntry(entry, index))
        .filter(Boolean);

      this.buildIndex();
      console.log(`✅ Medical library indexed (${this.entries.length} entries)`);
    } catch (error) {
      console.error("❌ Failed to load medical library:", error.message);
      this.entries = [];
      this.docVectors = [];
      this.idf = new Map();
      this.totalDocs = 0;
    }
  }

  normalizeEntry(entry, fallbackIndex) {
    if (!entry || typeof entry !== "object") return null;

    const name = entry.name?.trim();
    const category = entry.category?.trim() || "Khác";
    const summary = entry.summary?.trim() || "";
    if (!name && !summary) return null;

    const safeId =
      entry.id?.toString() ||
      normalizeText(name || category || `entry-${fallbackIndex + 1}`);

    const symptomKeywords = this.normalizeStringArray(entry.symptomKeywords);
    const careTips = this.normalizeStringArray(entry.careTips);
    const warningSigns = this.normalizeStringArray(entry.warningSigns);

    const recommendedSpecialties = this.buildSpecialtyList(
      entry.recommendedSpecialties,
      category
    );

    const urgencyLevel =
      entry.urgencyLevel ||
      this.inferUrgencyLevel(warningSigns, entry.symptomKeywords);

    const evidenceLevel = entry.evidenceLevel || "thực hành";

    const searchText = normalizeText(
      [
        name,
        category,
        summary,
        symptomKeywords.join(" "),
        careTips.join(" "),
        warningSigns.join(" "),
        recommendedSpecialties.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (!searchText) return null;

    return {
      id: safeId,
      name: name || entry.category || `Thông tin #${fallbackIndex + 1}`,
      category,
      summary,
      symptomKeywords,
      careTips,
      warningSigns,
      recommendedSpecialties,
      urgencyLevel,
      evidenceLevel,
      source: entry.source || "internal",
      lastUpdated: entry.lastUpdated || null,
      searchText,
    };
  }

  normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return Array.from(
      new Set(
        value
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      )
    );
  }

  buildSpecialtyList(list, category) {
    const normalizedList = this.normalizeStringArray(list);
    if (normalizedList.length) return normalizedList;

    const categoryKey = normalizeText(category);
    return CATEGORY_SPECIALTY_MAP.get(categoryKey) || ["Đa khoa"];
  }

  inferUrgencyLevel(warningSigns, symptomKeywords = []) {
    const combined = normalizeText(
      [...warningSigns, ...symptomKeywords].join(" ")
    );

    for (const { level, terms } of URGENCY_KEYWORDS) {
      if (terms.some((term) => combined.includes(normalizeText(term)))) {
        return level;
      }
    }

    return "bình thường";
  }

  buildIndex() {
    const df = new Map();
    this.docVectors = [];
    this.totalDocs = this.entries.length;

    this.entries.forEach((entry, index) => {
      const tokens = entry.searchText.split(" ").filter(Boolean);
      const termCounts = new Map();

      tokens.forEach((token) => {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      });

      entry.termCounts = termCounts;
      entry.totalTerms = tokens.length;

      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach((token) => {
        df.set(token, (df.get(token) || 0) + 1);
      });
    });

    this.idf = new Map();
    df.forEach((count, token) => {
      const value = Math.log((1 + this.totalDocs) / (1 + count)) + 1;
      this.idf.set(token, value);
    });

    this.docVectors = this.entries.map((entry) => {
      const vector = new Map();
      entry.termCounts.forEach((count, token) => {
        const tf = count / entry.totalTerms;
        const idf = this.idf.get(token) || 0;
        vector.set(token, tf * idf);
      });

      const norm = Math.sqrt(
        Array.from(vector.values()).reduce(
          (sum, weight) => sum + weight * weight,
          0
        )
      );

      return {
        entry,
        vector,
        norm: norm || 1,
      };
    });
  }

  createQueryVector(text) {
    const normalized = normalizeText(text);
    if (!normalized) return { vector: new Map(), norm: 0 };

    const tokens = normalized.split(" ").filter(Boolean);
    if (!tokens.length) return { vector: new Map(), norm: 0 };

    const termCounts = new Map();
    tokens.forEach((token) => {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    });

    const totalTerms = tokens.length;
    const vector = new Map();
    termCounts.forEach((count, token) => {
      const tf = count / totalTerms;
      const idf = this.idf.get(token) || 0;
      vector.set(token, tf * idf);
    });

    const norm = Math.sqrt(
      Array.from(vector.values()).reduce(
        (sum, weight) => sum + weight * weight,
        0
      )
    );

    return { vector, norm: norm || 1 };
  }

  cosineSimilarity(queryVector, docVector, queryNorm, docNorm) {
    if (queryNorm === 0 || docNorm === 0) return 0;

    let dotProduct = 0;
    const [smaller, larger] =
      queryVector.size < docVector.size
        ? [queryVector, docVector]
        : [docVector, queryVector];

    smaller.forEach((weight, token) => {
      const otherWeight = larger.get(token);
      if (otherWeight) {
        dotProduct += weight * otherWeight;
      }
    });

    return dotProduct / (queryNorm * docNorm);
  }

  searchBySymptoms(symptomText, options = {}) {
    const { limit = 3, minScore = 0.05 } = options;
    if (!symptomText) return [];

    const { vector: queryVector, norm: queryNorm } =
      this.createQueryVector(symptomText);
    if (queryNorm === 0) return [];

    const normalizedInput = normalizeText(symptomText);

    const scored = this.docVectors
      .map(({ entry, vector, norm }) => {
        let score = this.cosineSimilarity(queryVector, vector, queryNorm, norm);

        // Boost urgency and specialty richness
        if (entry.urgencyLevel === "khẩn cấp") score += 0.15;
        if (entry.urgencyLevel === "cần khám sớm") score += 0.05;
        if ((entry.recommendedSpecialties || []).length >= 3) score += 0.03;

        return { entry, score };
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ entry, score }) => ({
        ...entry,
        matchScore: Number(score.toFixed(3)),
        matchedKeywords: entry.symptomKeywords.filter((keyword) =>
          normalizedInput.includes(normalizeText(keyword))
        ),
      }));

    return scored;
  }

  getLibraryStats() {
    const byCategory = {};
    this.entries.forEach((entry) => {
      const key = entry.category || "Khác";
      byCategory[key] = (byCategory[key] || 0) + 1;
    });

    return {
      totalEntries: this.entries.length,
      categories: byCategory,
    };
  }
}

module.exports = new MedicalLibraryService();
