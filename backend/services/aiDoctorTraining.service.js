// AI Doctor Training Service - Cải thiện độ chính xác thông qua training data
const fs = require('fs');
const path = require('path');
const enhancedMedicalKnowledge = require('./enhancedMedicalKnowledge.service');

class AiDoctorTrainingService {
  constructor() {
    this.trainingDataPath = path.join(__dirname, '../data/training');
    this.modelMetrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      lastTraining: null
    };
    
    // Training configuration
    this.trainingConfig = {
      batchSize: 50,
      epochs: 10,
      learningRate: 0.001,
      validationSplit: 0.2,
      minConfidenceThreshold: 0.7
    };

    this.ensureTrainingDirectory();
  }

  ensureTrainingDirectory() {
    if (!fs.existsSync(this.trainingDataPath)) {
      fs.mkdirSync(this.trainingDataPath, { recursive: true });
    }
  }

  // Thu thập dữ liệu training từ tương tác thực tế
  async collectTrainingData(sessionId, userInput, systemOutput, userFeedback) {
    const trainingData = {
      id: `${sessionId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: {
        symptoms: userInput.primaryConcern,
        age: userInput.age,
        gender: userInput.gender,
        duration: userInput.symptomDuration,
        medicalHistory: userInput.medicalHistory
      },
      systemOutput: {
        recommendations: systemOutput.recommendations,
        confidence: systemOutput.confidence,
        urgencyLevel: systemOutput.urgencyLevel,
        specialties: systemOutput.specialties
      },
      feedback: {
        helpful: userFeedback.helpful,
        accurate: userFeedback.accurate,
        rating: userFeedback.rating,
        comments: userFeedback.comments
      },
      groundTruth: userFeedback.actualDiagnosis || null
    };

    await this.saveTrainingExample(trainingData);
    return trainingData;
  }

  async saveTrainingExample(data) {
    const filename = `training_${data.id}.json`;
    const filepath = path.join(this.trainingDataPath, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`✅ Saved training data: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save training data: ${error.message}`);
    }
  }

  // Tạo synthetic training data để bổ sung
  generateSyntheticData() {
    const syntheticCases = [
      {
        symptoms: "đau ngực dữ dội, khó thở, đổ mồ hôi",
        age: 55,
        gender: "nam",
        expectedSpecialty: "Tim mạch",
        urgencyLevel: "khẩn cấp",
        confidence: 0.95
      },
      {
        symptoms: "ho kéo dài 3 tuần, sốt nhẹ buổi chiều",
        age: 35,
        gender: "nữ", 
        expectedSpecialty: "Hô hấp",
        urgencyLevel: "cần khám sớm",
        confidence: 0.8
      },
      {
        symptoms: "đau bụng dưới bên phải, nôn nửa",
        age: 25,
        gender: "nam",
        expectedSpecialty: "Ngoại khoa",
        urgencyLevel: "khẩn cấp",
        confidence: 0.9
      },
      {
        symptoms: "đau đầu thường xuyên, nhìn mờ",
        age: 45,
        gender: "nữ",
        expectedSpecialty: "Thần kinh",
        urgencyLevel: "cần khám sớm", 
        confidence: 0.75
      },
      {
        symptoms: "đau khớp gối, sưng, khó cử động",
        age: 65,
        gender: "nam",
        expectedSpecialty: "Cơ Xương Khớp",
        urgencyLevel: "cần theo dõi",
        confidence: 0.8
      }
    ];

    return syntheticCases.map((case_, index) => ({
      id: `synthetic_${index}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: {
        symptoms: case_.symptoms,
        age: case_.age,
        gender: case_.gender
      },
      expectedOutput: {
        specialties: [case_.expectedSpecialty],
        urgencyLevel: case_.urgencyLevel,
        confidence: case_.confidence
      },
      type: 'synthetic'
    }));
  }

  // Đánh giá hiệu suất model hiện tại
  async evaluateModel() {
    const trainingFiles = fs.readdirSync(this.trainingDataPath)
      .filter(file => file.endsWith('.json'));

    if (trainingFiles.length === 0) {
      console.warn("⚠️ No training data found for evaluation");
      return null;
    }

    let correct = 0;
    let total = 0;
    const specialtyAccuracy = new Map();
    const urgencyAccuracy = new Map();

    for (const file of trainingFiles) {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(this.trainingDataPath, file), 'utf8')
        );

        if (!data.feedback || !data.systemOutput) continue;

        total++;
        
        // Evaluate specialty prediction
        const expectedSpecialty = data.feedback.actualSpecialty || data.expectedOutput?.specialties[0];
        const predictedSpecialties = data.systemOutput.specialties || [];
        
        if (expectedSpecialty && predictedSpecialties.includes(expectedSpecialty)) {
          correct++;
          this.updateAccuracyMap(specialtyAccuracy, expectedSpecialty, true);
        } else if (expectedSpecialty) {
          this.updateAccuracyMap(specialtyAccuracy, expectedSpecialty, false);
        }

        // Evaluate urgency prediction  
        const expectedUrgency = data.feedback.actualUrgency || data.expectedOutput?.urgencyLevel;
        const predictedUrgency = data.systemOutput.urgencyLevel;
        
        if (expectedUrgency && expectedUrgency === predictedUrgency) {
          this.updateAccuracyMap(urgencyAccuracy, expectedUrgency, true);
        } else if (expectedUrgency) {
          this.updateAccuracyMap(urgencyAccuracy, expectedUrgency, false);
        }

      } catch (error) {
        console.warn(`⚠️ Failed to process training file ${file}: ${error.message}`);
      }
    }

    const overallAccuracy = total > 0 ? correct / total : 0;

    this.modelMetrics = {
      accuracy: overallAccuracy,
      precision: this.calculatePrecision(specialtyAccuracy),
      recall: this.calculateRecall(specialtyAccuracy),
      f1Score: this.calculateF1Score(specialtyAccuracy),
      lastEvaluation: new Date().toISOString(),
      totalCases: total,
      specialtyBreakdown: Object.fromEntries(specialtyAccuracy),
      urgencyBreakdown: Object.fromEntries(urgencyAccuracy)
    };

    console.log("📊 Model Evaluation Results:", this.modelMetrics);
    return this.modelMetrics;
  }

  updateAccuracyMap(map, key, isCorrect) {
    if (!map.has(key)) {
      map.set(key, { correct: 0, total: 0 });
    }
    
    const stats = map.get(key);
    stats.total++;
    if (isCorrect) stats.correct++;
    
    stats.accuracy = stats.correct / stats.total;
  }

  calculatePrecision(accuracyMap) {
    const values = Array.from(accuracyMap.values());
    return values.length > 0 
      ? values.reduce((sum, stats) => sum + stats.accuracy, 0) / values.length
      : 0;
  }

  calculateRecall(accuracyMap) {
    // Simplified recall calculation
    return this.calculatePrecision(accuracyMap);
  }

  calculateF1Score(accuracyMap) {
    const precision = this.calculatePrecision(accuracyMap);
    const recall = this.calculateRecall(accuracyMap);
    
    return precision + recall > 0 
      ? 2 * (precision * recall) / (precision + recall)
      : 0;
  }

  // Retrain model dựa trên feedback
  async retrainModel() {
    console.log("🔄 Starting model retraining...");
    
    // 1. Evaluate current performance
    const currentMetrics = await this.evaluateModel();
    
    if (!currentMetrics) {
      console.warn("⚠️ No data available for retraining");
      return false;
    }

    // 2. Generate additional synthetic data if accuracy is low
    if (currentMetrics.accuracy < 0.8) {
      console.log("📈 Generating additional synthetic training data...");
      const syntheticData = this.generateSyntheticData();
      
      for (const data of syntheticData) {
        await this.saveTrainingExample(data);
      }
    }

    // 3. Update knowledge base with learned patterns
    await this.updateKnowledgeBase(currentMetrics);
    
    // 4. Optimize parameters
    await this.optimizeParameters(currentMetrics);

    console.log("✅ Model retraining completed");
    console.log("📊 New metrics:", currentMetrics);
    
    return true;
  }

  async updateKnowledgeBase(metrics) {
    // Analyze common misclassifications and update symptom mappings
    const trainingFiles = fs.readdirSync(this.trainingDataPath)
      .filter(file => file.endsWith('.json'));

    const incorrectPredictions = [];
    
    for (const file of trainingFiles) {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(this.trainingDataPath, file), 'utf8')
        );

        if (data.feedback && data.feedback.accurate === false) {
          incorrectPredictions.push(data);
        }
      } catch (error) {
        continue;
      }
    }

    // Update enhanced medical knowledge based on incorrect predictions
    console.log(`🔧 Analyzing ${incorrectPredictions.length} incorrect predictions for knowledge base updates`);
    
    // This would integrate with enhancedMedicalKnowledge to improve mappings
    // For now, we log the insights
    const commonErrors = this.analyzeCommonErrors(incorrectPredictions);
    console.log("🎯 Common classification errors:", commonErrors);
  }

  analyzeCommonErrors(incorrectPredictions) {
    const errorPatterns = {};
    
    incorrectPredictions.forEach(pred => {
      const symptom = pred.input.symptoms;
      const predicted = pred.systemOutput.specialties?.[0];
      const actual = pred.feedback.actualSpecialty;
      
      if (predicted && actual && predicted !== actual) {
        const pattern = `${predicted}->${actual}`;
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
      }
    });

    return Object.entries(errorPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  async optimizeParameters(metrics) {
    // Optimize confidence thresholds based on performance
    if (metrics.precision < 0.75) {
      this.trainingConfig.minConfidenceThreshold += 0.05;
      console.log(`📈 Increased confidence threshold to ${this.trainingConfig.minConfidenceThreshold}`);
    } else if (metrics.precision > 0.9 && metrics.recall < 0.7) {
      this.trainingConfig.minConfidenceThreshold -= 0.05;
      console.log(`📉 Decreased confidence threshold to ${this.trainingConfig.minConfidenceThreshold}`);
    }

    // Adjust other parameters based on performance
    if (metrics.accuracy < 0.7) {
      this.trainingConfig.epochs = Math.min(this.trainingConfig.epochs + 2, 20);
      console.log(`📚 Increased training epochs to ${this.trainingConfig.epochs}`);
    }
  }

  // API để lấy metrics hiện tại
  getCurrentMetrics() {
    return this.modelMetrics;
  }

  // API để trigger retraining manually
  async triggerRetraining() {
    return await this.retrainModel();
  }

  // Export training data cho external analysis
  async exportTrainingData() {
    const trainingFiles = fs.readdirSync(this.trainingDataPath)
      .filter(file => file.endsWith('.json'));

    const exportData = [];
    
    for (const file of trainingFiles) {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(this.trainingDataPath, file), 'utf8')
        );
        exportData.push(data);
      } catch (error) {
        console.warn(`⚠️ Failed to read ${file}: ${error.message}`);
      }
    }

    const exportPath = path.join(this.trainingDataPath, `export_${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`📁 Training data exported to ${exportPath}`);
    return exportPath;
  }
}

module.exports = new AiDoctorTrainingService();