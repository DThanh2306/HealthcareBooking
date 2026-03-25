const doctorService = require("./doctor.service");
const hospitalService = require("./hospital.service");
const medicalKnowledge = require("./medicalKnowledge.service");

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

class AiDoctorKnowledgeService {
  constructor() {
    this.documents = [];
    this.docVectors = [];
    this.idf = new Map();
    this.totalDocs = 0;
    this.hospitalMap = new Map();
    this.initialized = false;
    this.initializingPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      await this.loadData();
      this.initialized = true;
      this.initializingPromise = null;
    })();

    return this.initializingPromise;
  }

  async loadData() {
    try {
      const [doctors, hospitals] = await Promise.all([
        doctorService.getAllDoctors(),
        hospitalService.getAllHospitals(),
      ]);

      this.hospitalMap = new Map(
        hospitals.map((hospital) => [hospital.h_id, hospital])
      );

      this.documents = [
        ...doctors.map((doctor) =>
          this.buildDoctorDocument(doctor, this.hospitalMap.get(doctor.h_id))
        ),
        ...hospitals.map((hospital) => this.buildHospitalDocument(hospital)),
      ].filter(Boolean);

      this.buildIndex();
      console.log(
        `✅ AI Doctor knowledge base loaded with ${this.documents.length} documents.`
      );
    } catch (error) {
      console.error("❌ Failed to initialize AI Doctor knowledge base:", error);
      throw error;
    }
  }

  buildDoctorDocument(doctor, hospital) {
    if (!doctor) return null;

    const hospitalName = doctor.dr_h_name || hospital?.h_name || "";
    const hospitalAddress = hospital?.h_address || "";
    const description = doctor.dr_description || "";
    const specialty = doctor.specialty || "";

    // Enhanced search text with medical context
    const medicalTerms = this.extractMedicalTerms(specialty, description);
    const searchText = normalizeText(
      [
        `bac si ${doctor.dr_name}`,
        `chuyen khoa ${specialty}`,
        hospitalName ? `benh vien ${hospitalName}` : "",
        hospitalAddress ? `dia chi ${hospitalAddress}` : "",
        description,
        medicalTerms.join(" "), // Add extracted medical terms
      ]
        .filter(Boolean)
        .join(". ")
    );

    if (!searchText) return null;

    return {
      id: `doctor:${doctor.dr_id}`,
      type: "doctor",
      name: doctor.dr_name,
      specialty,
      hospitalId: doctor.h_id,
      hospitalName,
      hospitalAddress,
      description,
      image: doctor.image,
      price: doctor.dr_price,
      raw: doctor,
      searchText,
      medicalTerms, // Store for enhanced matching
      specialtyNormalized: normalizeText(specialty),
    };
  }

  buildHospitalDocument(hospital) {
    if (!hospital) return null;

    const searchText = normalizeText(
      [
        `benh vien ${hospital.h_name}`,
        hospital.h_address || "",
        hospital.h_description || "",
      ]
        .filter(Boolean)
        .join(". ")
    );

    if (!searchText) return null;

    return {
      id: `hospital:${hospital.h_id}`,
      type: "hospital",
      name: hospital.h_name,
      hospitalAddress: hospital.h_address,
      description: hospital.h_description,
      raw: hospital,
      searchText,
    };
  }

  buildIndex() {
    const df = new Map();
    this.docVectors = [];
    this.totalDocs = this.documents.length;

    this.documents.forEach((doc, index) => {
      const tokens = doc.searchText.split(" ").filter(Boolean);
      const termCounts = new Map();

      tokens.forEach((token) => {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      });

      doc.termCounts = termCounts;
      doc.totalTerms = tokens.length;

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

    this.docVectors = this.documents.map((doc) => {
      const vector = new Map();

      doc.termCounts.forEach((count, token) => {
        const tf = count / doc.totalTerms;
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
        doc,
        vector,
        norm: norm || 1,
      };
    });
  }

  createQueryVector(text) {
    const normalized = normalizeText(text);
    if (!normalized) return { vector: new Map(), norm: 0 };

    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length === 0) return { vector: new Map(), norm: 0 };

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

  async query(text, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!text) return [];

    const { limit = 5, type, location } = options;
    const { vector: queryVector, norm: queryNorm } =
      this.createQueryVector(text);

    if (queryNorm === 0) return [];

    const locationNormalized = normalizeText(location || "");

    const scored = this.docVectors
      .map(({ doc, vector, norm }) => {
        if (type && doc.type !== type) return null;

        let score = this.cosineSimilarity(queryVector, vector, queryNorm, norm);

        if (
          locationNormalized &&
          doc.hospitalAddress &&
          normalizeText(doc.hospitalAddress).includes(locationNormalized)
        ) {
          score += 0.1;
        }

        return { doc, score };
      })
      .filter(Boolean)
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  getHospitalById(hospitalId) {
    if (!hospitalId) return null;
    return this.hospitalMap.get(hospitalId) || null;
  }

  // Extract medical terms for enhanced matching
  extractMedicalTerms(specialty, description) {
    const medicalTermsMap = {
      'tim mạch': ['tim', 'mạch máu', 'huyết áp', 'nhồi máu', 'đau ngực', 'khó thở', 'đánh trống ngực'],
      'thần kinh': ['đau đầu', 'chóng mặt', 'co giật', 'liệt', 'đột quỵ', 'động kinh', 'mất trí nhớ'],
      'tiêu hóa': ['dạ dày', 'ruột', 'gan', 'đau bụng', 'nôn', 'tiêu chảy', 'táo bón', 'viêm gan'],
      'hô hấp': ['phổi', 'ho', 'khò khè', 'hen suyễn', 'viêm phổi', 'lao', 'khó thở'],
      'cơ xương khớp': ['xương', 'khớp', 'cột sống', 'gãy xương', 'thoái hóa', 'viêm khớp', 'đau lưng'],
      'da liễu': ['da', 'mụn', 'viêm da', 'nổi mẩn', 'ngứa', 'zona', 'nám'],
      'sản phụ khoa': ['phụ nữ', 'kinh nguyệt', 'thai', 'sinh đẻ', 'tử cung', 'buồng trứng'],
      'nhi khoa': ['trẻ em', 'em bé', 'sơ sinh', 'tiêm chủng', 'phát triển'],
      'mắt': ['mắt', 'thị lực', 'cận thị', 'viễn thị', 'đục thủy tinh thể', 'tăng nhãn áp'],
      'tai mũi họng': ['tai', 'mũi', 'họng', 'amidan', 'viêm tai', 'nghẹt mũi', 'ù tai'],
      'niệu khoa': ['thận', 'bàng quang', 'tiểu tiện', 'sỏi thận', 'viêm đường tiết niệu'],
      'nội tiết': ['tiểu đường', 'tuyến giáp', 'nội tiết tố', 'béo phì', 'rối loạn chuyển hóa'],
      'tâm thần': ['trầm cảm', 'lo âu', 'stress', 'mất ngủ', 'tâm lý'],
      'cấp cứu': ['khẩn cấp', 'cấp cứu', 'nguy hiểm', 'nặng']
    };

    const specialtyNorm = normalizeText(specialty);
    const descNorm = normalizeText(description);
    const terms = new Set();

    // Find matching medical terms based on specialty
    for (const [key, values] of Object.entries(medicalTermsMap)) {
      if (specialtyNorm.includes(normalizeText(key))) {
        values.forEach(term => terms.add(term));
      }
    }

    // Extract terms from description
    for (const [key, values] of Object.entries(medicalTermsMap)) {
      values.forEach(term => {
        if (descNorm.includes(normalizeText(term))) {
          terms.add(term);
        }
      });
    }

    return Array.from(terms);
  }
}

module.exports = new AiDoctorKnowledgeService();





