// Advanced Fuzzy Matching và Vector Similarity Service
class AdvancedFuzzyVectorService {
  constructor() {
    // Fuzzy matching configuration
    this.fuzzyThreshold = 0.7;
    this.editDistanceThreshold = 3;
    
    // Vector dimensions for embeddings
    this.vectorDimension = 300;
    
    // Medical term embeddings cache
    this.medicalEmbeddings = new Map();
    this.initializeMedicalEmbeddings();
    
    // N-gram configuration for fuzzy matching
    this.ngramSize = 3;
    
    // Character-based similarity weights
    this.charWeights = {
      exact: 1.0,
      substitute: 0.8,
      insert: 0.7,
      delete: 0.7,
      transpose: 0.9
    };
  }

  // Initialize medical term embeddings
  initializeMedicalEmbeddings() {
    // Simple word embedding initialization (in production, use pre-trained embeddings)
    const medicalTerms = [
      // Symptoms
      'đau', 'ngực', 'thở', 'khó', 'sốt', 'ho', 'mệt', 'chóng', 'mặt', 'nôn',
      'bụng', 'đầu', 'lưng', 'chân', 'tay', 'mắt', 'tai', 'họng', 'cổ', 'vai',
      
      // Body parts  
      'tim', 'phổi', 'gan', 'thận', 'dạ', 'dày', 'ruột', 'xương', 'khớp', 'cơ',
      'da', 'tóc', 'móng', 'mũi', 'miệng', 'răng', 'lưỡi', 'não', 'tủy',
      
      // Conditions
      'viêm', 'nhiễm', 'trùng', 'ung', 'thư', 'loét', 'gãy', 'nứt', 'bong',
      'thoái', 'hóa', 'suy', 'tăng', 'giảm', 'rối', 'loạn', 'dị', 'ứng',
      
      // Modifiers
      'cấp', 'mãn', 'tính', 'nhẹ', 'nặng', 'dữ', 'dội', 'đột', 'ngột',
      'liên', 'tục', 'thường', 'xuyên', 'thỉnh', 'thoảng', 'kéo', 'dài'
    ];

    // Generate simple embeddings (in production, use Word2Vec/FastText)
    medicalTerms.forEach(term => {
      this.medicalEmbeddings.set(term, this.generateSimpleEmbedding(term));
    });
  }

  // Generate simple embedding for medical terms
  generateSimpleEmbedding(term) {
    const vector = new Array(this.vectorDimension).fill(0);
    
    // Character-based features
    for (let i = 0; i < term.length && i < 50; i++) {
      const charCode = term.charCodeAt(i);
      vector[i % this.vectorDimension] += charCode / 1000;
    }
    
    // Length feature
    vector[this.vectorDimension - 1] = term.length / 20;
    
    // N-gram features
    const ngrams = this.generateNgrams(term, this.ngramSize);
    ngrams.forEach((ngram, index) => {
      if (index < this.vectorDimension - 10) {
        vector[index] += this.hashString(ngram) / 10000;
      }
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  // Generate n-grams for text
  generateNgrams(text, n) {
    const ngrams = [];
    const paddedText = '#'.repeat(n - 1) + text + '#'.repeat(n - 1);
    
    for (let i = 0; i <= paddedText.length - n; i++) {
      ngrams.push(paddedText.substring(i, i + n));
    }
    
    return ngrams;
  }

  // Simple string hashing
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Advanced Levenshtein distance with weighted operations
  advancedEditDistance(s1, s2) {
    const matrix = Array(s2.length + 1).fill(null).map(() => 
      Array(s1.length + 1).fill(null)
    );

    // Initialize first row and column
    for (let i = 0; i <= s1.length; i++) {
      matrix[0][i] = i * this.charWeights.insert;
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[j][0] = j * this.charWeights.delete;
    }

    // Fill the matrix
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1]; // No operation needed
        } else {
          const substitution = matrix[j - 1][i - 1] + this.charWeights.substitute;
          const insertion = matrix[j][i - 1] + this.charWeights.insert;
          const deletion = matrix[j - 1][i] + this.charWeights.delete;
          
          matrix[j][i] = Math.min(substitution, insertion, deletion);
          
          // Damerau-Levenshtein: consider transposition
          if (i > 1 && j > 1 && 
              s1[i - 1] === s2[j - 2] && 
              s1[i - 2] === s2[j - 1]) {
            const transposition = matrix[j - 2][i - 2] + this.charWeights.transpose;
            matrix[j][i] = Math.min(matrix[j][i], transposition);
          }
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  // Calculate fuzzy similarity score
  calculateFuzzySimilarity(term1, term2) {
    if (term1 === term2) return 1.0;
    
    const maxLength = Math.max(term1.length, term2.length);
    if (maxLength === 0) return 1.0;
    
    const editDistance = this.advancedEditDistance(term1, term2);
    const similarity = 1 - (editDistance / maxLength);
    
    return Math.max(0, similarity);
  }

  // N-gram based similarity
  calculateNgramSimilarity(term1, term2) {
    const ngrams1 = new Set(this.generateNgrams(term1, this.ngramSize));
    const ngrams2 = new Set(this.generateNgrams(term2, this.ngramSize));
    
    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Vector cosine similarity
  calculateVectorSimilarity(term1, term2) {
    const vector1 = this.medicalEmbeddings.get(term1) || this.generateSimpleEmbedding(term1);
    const vector2 = this.medicalEmbeddings.get(term2) || this.generateSimpleEmbedding(term2);
    
    return this.cosineSimilarity(vector1, vector2);
  }

  // Cosine similarity between vectors
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Combined similarity score
  calculateCombinedSimilarity(term1, term2, weights = null) {
    const defaultWeights = {
      fuzzy: 0.4,
      ngram: 0.3,
      vector: 0.3
    };
    
    const w = weights || defaultWeights;
    
    const fuzzySim = this.calculateFuzzySimilarity(term1, term2);
    const ngramSim = this.calculateNgramSimilarity(term1, term2);
    const vectorSim = this.calculateVectorSimilarity(term1, term2);
    
    return w.fuzzy * fuzzySim + w.ngram * ngramSim + w.vector * vectorSim;
  }

  // Advanced fuzzy matching for medical symptoms
  fuzzyMatchSymptoms(inputSymptom, symptomDatabase, threshold = null) {
    const effectiveThreshold = threshold || this.fuzzyThreshold;
    const matches = [];
    
    for (const [dbSymptom, specialties] of symptomDatabase) {
      const similarity = this.calculateCombinedSimilarity(inputSymptom, dbSymptom);
      
      if (similarity >= effectiveThreshold) {
        matches.push({
          symptom: dbSymptom,
          specialties,
          similarity,
          matchType: 'fuzzy'
        });
      }
    }
    
    // Sort by similarity descending
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  // Phrase-level fuzzy matching for complex symptoms
  fuzzyMatchPhrase(inputPhrase, symptomDatabase) {
    const inputWords = inputPhrase.toLowerCase().split(/\s+/);
    const matches = [];
    
    for (const [dbSymptom, specialties] of symptomDatabase) {
      const dbWords = dbSymptom.toLowerCase().split(/\s+/);
      
      let totalSimilarity = 0;
      let matchCount = 0;
      
      // Find best match for each input word
      for (const inputWord of inputWords) {
        let bestSimilarity = 0;
        
        for (const dbWord of dbWords) {
          const similarity = this.calculateCombinedSimilarity(inputWord, dbWord);
          bestSimilarity = Math.max(bestSimilarity, similarity);
        }
        
        if (bestSimilarity > 0.5) {
          totalSimilarity += bestSimilarity;
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const avgSimilarity = totalSimilarity / inputWords.length;
        const coverage = matchCount / inputWords.length;
        const finalScore = avgSimilarity * coverage;
        
        if (finalScore >= this.fuzzyThreshold) {
          matches.push({
            symptom: dbSymptom,
            specialties,
            similarity: finalScore,
            matchType: 'phrase_fuzzy',
            coverage: coverage,
            wordMatches: matchCount
          });
        }
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  // Semantic vector search using medical embeddings
  semanticVectorSearch(query, documentVectors, topK = 5) {
    const queryVector = this.generateQueryVector(query);
    const similarities = [];
    
    for (const [docId, docVector] of documentVectors) {
      const similarity = this.cosineSimilarity(queryVector, docVector);
      similarities.push({ docId, similarity });
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Generate query vector from text
  generateQueryVector(query) {
    const words = query.toLowerCase().split(/\s+/);
    const vectors = words.map(word => 
      this.medicalEmbeddings.get(word) || this.generateSimpleEmbedding(word)
    );
    
    // Average word vectors
    const avgVector = new Array(this.vectorDimension).fill(0);
    for (const vector of vectors) {
      for (let i = 0; i < this.vectorDimension; i++) {
        avgVector[i] += vector[i];
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(avgVector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? avgVector.map(val => val / magnitude) : avgVector;
  }

  // Vietnamese-specific fuzzy matching
  vietnameseFuzzyMatch(term1, term2) {
    // Handle Vietnamese diacritics normalization
    const normalized1 = this.normalizeVietnamese(term1);
    const normalized2 = this.normalizeVietnamese(term2);
    
    // Standard similarity on normalized text
    const standardSim = this.calculateCombinedSimilarity(normalized1, normalized2);
    
    // Original text similarity (with diacritics)
    const diacriticSim = this.calculateCombinedSimilarity(term1, term2);
    
    // Weight towards normalized similarity for Vietnamese
    return 0.7 * standardSim + 0.3 * diacriticSim;
  }

  // Vietnamese diacritics normalization
  normalizeVietnamese(text) {
    if (!text) return '';
    
    return text.toLowerCase()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Multi-strategy matching for enhanced accuracy
  multiStrategyMatch(query, symptomDatabase, options = {}) {
    const strategies = options.strategies || ['exact', 'fuzzy', 'ngram', 'vector', 'vietnamese'];
    const weights = options.weights || {
      exact: 1.0,
      fuzzy: 0.8,
      ngram: 0.6,
      vector: 0.7,
      vietnamese: 0.9
    };
    
    const allMatches = new Map();
    
    for (const strategy of strategies) {
      let matches = [];
      
      switch (strategy) {
        case 'exact':
          matches = this.exactMatch(query, symptomDatabase);
          break;
        case 'fuzzy':
          matches = this.fuzzyMatchSymptoms(query, symptomDatabase, 0.6);
          break;
        case 'ngram':
          matches = this.ngramOnlyMatch(query, symptomDatabase);
          break;
        case 'vector':
          matches = this.vectorOnlyMatch(query, symptomDatabase);
          break;
        case 'vietnamese':
          matches = this.vietnameseSpecificMatch(query, symptomDatabase);
          break;
      }
      
      // Apply strategy weight and merge results
      for (const match of matches) {
        const key = match.symptom;
        const weightedScore = match.similarity * weights[strategy];
        
        if (allMatches.has(key)) {
          const existing = allMatches.get(key);
          existing.similarity = Math.max(existing.similarity, weightedScore);
          existing.strategies.push(strategy);
        } else {
          allMatches.set(key, {
            ...match,
            similarity: weightedScore,
            strategies: [strategy]
          });
        }
      }
    }
    
    return Array.from(allMatches.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  // Helper methods for multi-strategy matching
  exactMatch(query, symptomDatabase) {
    const matches = [];
    for (const [symptom, specialties] of symptomDatabase) {
      if (symptom.toLowerCase() === query.toLowerCase()) {
        matches.push({
          symptom,
          specialties,
          similarity: 1.0,
          matchType: 'exact'
        });
      }
    }
    return matches;
  }

  ngramOnlyMatch(query, symptomDatabase) {
    const matches = [];
    for (const [symptom, specialties] of symptomDatabase) {
      const similarity = this.calculateNgramSimilarity(query, symptom);
      if (similarity > 0.5) {
        matches.push({
          symptom,
          specialties,
          similarity,
          matchType: 'ngram'
        });
      }
    }
    return matches;
  }

  vectorOnlyMatch(query, symptomDatabase) {
    const matches = [];
    for (const [symptom, specialties] of symptomDatabase) {
      const similarity = this.calculateVectorSimilarity(query, symptom);
      if (similarity > 0.4) {
        matches.push({
          symptom,
          specialties,
          similarity,
          matchType: 'vector'
        });
      }
    }
    return matches;
  }

  vietnameseSpecificMatch(query, symptomDatabase) {
    const matches = [];
    for (const [symptom, specialties] of symptomDatabase) {
      const similarity = this.vietnameseFuzzyMatch(query, symptom);
      if (similarity > 0.6) {
        matches.push({
          symptom,
          specialties,
          similarity,
          matchType: 'vietnamese'
        });
      }
    }
    return matches;
  }
}

module.exports = new AdvancedFuzzyVectorService();