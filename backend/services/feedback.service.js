/**
 * Service xử lý feedback từ người dùng để cải thiện độ chính xác
 */

class FeedbackService {
  constructor() {
    this.feedbackData = {
      symptomFeedback: new Map(), // Lưu feedback về triệu chứng
      specialtyFeedback: new Map(), // Lưu feedback về chuyên khoa
      doctorFeedback: new Map(), // Lưu feedback về bác sĩ
      searchQueries: [], // Lưu lịch sử tìm kiếm
    };
  }

  /**
   * Lưu feedback về kết quả chẩn đoán
   * @param {string} userId - ID người dùng
   * @param {string} symptoms - Triệu chứng
   * @param {Array} suggestedSpecialties - Chuyên khoa được đề xuất
   * @param {Array} actualSpecialties - Chuyên khoa thực tế (từ feedback)
   * @param {number} accuracy - Độ chính xác (1-5)
   */
  async saveDiagnosisFeedback(
    userId,
    symptoms,
    suggestedSpecialties,
    actualSpecialties,
    accuracy
  ) {
    try {
      const feedback = {
        userId,
        symptoms,
        suggestedSpecialties,
        actualSpecialties,
        accuracy,
        timestamp: new Date(),
        helpful: accuracy >= 3,
      };

      // Lưu feedback cho từng triệu chứng
      symptoms.forEach((symptom) => {
        if (!this.feedbackData.symptomFeedback.has(symptom)) {
          this.feedbackData.symptomFeedback.set(symptom, []);
        }
        this.feedbackData.symptomFeedback.get(symptom).push(feedback);
      });

      // Lưu feedback cho từng chuyên khoa
      suggestedSpecialties.forEach((specialty) => {
        if (!this.feedbackData.specialtyFeedback.has(specialty)) {
          this.feedbackData.specialtyFeedback.set(specialty, []);
        }
        this.feedbackData.specialtyFeedback.get(specialty).push(feedback);
      });

      console.log("💾 Saved diagnosis feedback:", {
        userId,
        symptoms: symptoms.length,
        accuracy,
        helpful: feedback.helpful,
      });

      return feedback;
    } catch (error) {
      console.error("❌ Save feedback error:", error);
      throw error;
    }
  }

  /**
   * Lưu feedback về bác sĩ được đề xuất
   * @param {string} userId - ID người dùng
   * @param {Array} suggestedDoctors - Bác sĩ được đề xuất
   * @param {string} selectedDoctor - Bác sĩ được chọn
   * @param {number} satisfaction - Mức độ hài lòng (1-5)
   */
  async saveDoctorFeedback(
    userId,
    suggestedDoctors,
    selectedDoctor,
    satisfaction
  ) {
    try {
      const feedback = {
        userId,
        suggestedDoctors,
        selectedDoctor,
        satisfaction,
        timestamp: new Date(),
        helpful: satisfaction >= 3,
      };

      // Lưu feedback cho bác sĩ được chọn
      if (!this.feedbackData.doctorFeedback.has(selectedDoctor)) {
        this.feedbackData.doctorFeedback.set(selectedDoctor, []);
      }
      this.feedbackData.doctorFeedback.get(selectedDoctor).push(feedback);

      console.log("💾 Saved doctor feedback:", {
        userId,
        selectedDoctor,
        satisfaction,
        helpful: feedback.helpful,
      });

      return feedback;
    } catch (error) {
      console.error("❌ Save doctor feedback error:", error);
      throw error;
    }
  }

  /**
   * Lưu lịch sử tìm kiếm để phân tích
   * @param {string} query - Từ khóa tìm kiếm
   * @param {Array} results - Kết quả tìm kiếm
   * @param {string} userId - ID người dùng (optional)
   */
  async saveSearchQuery(query, results, userId = null) {
    try {
      const searchData = {
        query,
        results: results.length,
        userId,
        timestamp: new Date(),
        topResults: results.slice(0, 3).map((r) => ({
          type: r.type || "symptom",
          name: r.name || r.title,
          score: r.score || 0,
        })),
      };

      this.feedbackData.searchQueries.push(searchData);

      // Giới hạn lưu trữ 1000 queries gần nhất
      if (this.feedbackData.searchQueries.length > 1000) {
        this.feedbackData.searchQueries =
          this.feedbackData.searchQueries.slice(-1000);
      }

      console.log("💾 Saved search query:", {
        query,
        results: results.length,
        userId,
      });

      return searchData;
    } catch (error) {
      console.error("❌ Save search query error:", error);
      throw error;
    }
  }

  /**
   * Phân tích feedback để cải thiện thuật toán
   * @returns {Object} - Thống kê và đề xuất cải thiện
   */
  async analyzeFeedback() {
    try {
      const analysis = {
        symptomAccuracy: this.calculateSymptomAccuracy(),
        specialtyAccuracy: this.calculateSpecialtyAccuracy(),
        doctorSatisfaction: this.calculateDoctorSatisfaction(),
        popularQueries: this.getPopularQueries(),
        improvementSuggestions: this.generateImprovementSuggestions(),
      };

      console.log("📊 Feedback analysis:", analysis);
      return analysis;
    } catch (error) {
      console.error("❌ Analyze feedback error:", error);
      throw error;
    }
  }

  /**
   * Tính độ chính xác của triệu chứng
   */
  calculateSymptomAccuracy() {
    const symptoms = Array.from(this.feedbackData.symptomFeedback.keys());
    const accuracy = {};

    symptoms.forEach((symptom) => {
      const feedbacks = this.feedbackData.symptomFeedback.get(symptom);
      const avgAccuracy =
        feedbacks.reduce((sum, f) => sum + f.accuracy, 0) / feedbacks.length;
      const helpfulRate =
        feedbacks.filter((f) => f.helpful).length / feedbacks.length;

      accuracy[symptom] = {
        avgAccuracy: avgAccuracy.toFixed(2),
        helpfulRate: (helpfulRate * 100).toFixed(1) + "%",
        totalFeedbacks: feedbacks.length,
      };
    });

    return accuracy;
  }

  /**
   * Tính độ chính xác của chuyên khoa
   */
  calculateSpecialtyAccuracy() {
    const specialties = Array.from(this.feedbackData.specialtyFeedback.keys());
    const accuracy = {};

    specialties.forEach((specialty) => {
      const feedbacks = this.feedbackData.specialtyFeedback.get(specialty);
      const avgAccuracy =
        feedbacks.reduce((sum, f) => sum + f.accuracy, 0) / feedbacks.length;
      const helpfulRate =
        feedbacks.filter((f) => f.helpful).length / feedbacks.length;

      accuracy[specialty] = {
        avgAccuracy: avgAccuracy.toFixed(2),
        helpfulRate: (helpfulRate * 100).toFixed(1) + "%",
        totalFeedbacks: feedbacks.length,
      };
    });

    return accuracy;
  }

  /**
   * Tính mức độ hài lòng với bác sĩ
   */
  calculateDoctorSatisfaction() {
    const doctors = Array.from(this.feedbackData.doctorFeedback.keys());
    const satisfaction = {};

    doctors.forEach((doctor) => {
      const feedbacks = this.feedbackData.doctorFeedback.get(doctor);
      const avgSatisfaction =
        feedbacks.reduce((sum, f) => sum + f.satisfaction, 0) /
        feedbacks.length;
      const helpfulRate =
        feedbacks.filter((f) => f.helpful).length / feedbacks.length;

      satisfaction[doctor] = {
        avgSatisfaction: avgSatisfaction.toFixed(2),
        helpfulRate: (helpfulRate * 100).toFixed(1) + "%",
        totalFeedbacks: feedbacks.length,
      };
    });

    return satisfaction;
  }

  /**
   * Lấy các truy vấn phổ biến
   */
  getPopularQueries() {
    const queryCounts = {};

    this.feedbackData.searchQueries.forEach((query) => {
      const normalizedQuery = query.query.toLowerCase().trim();
      queryCounts[normalizedQuery] = (queryCounts[normalizedQuery] || 0) + 1;
    });

    return Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Tạo đề xuất cải thiện
   */
  generateImprovementSuggestions() {
    const suggestions = [];

    // Phân tích triệu chứng có độ chính xác thấp
    const symptomAccuracy = this.calculateSymptomAccuracy();
    const lowAccuracySymptoms = Object.entries(symptomAccuracy)
      .filter(([, data]) => parseFloat(data.avgAccuracy) < 3)
      .map(([symptom, data]) => ({ symptom, accuracy: data.avgAccuracy }));

    if (lowAccuracySymptoms.length > 0) {
      suggestions.push({
        type: "symptom_improvement",
        message: "Cần cải thiện độ chính xác cho các triệu chứng:",
        details: lowAccuracySymptoms,
        action: "Thêm từ khóa và synonyms cho các triệu chứng này",
      });
    }

    // Phân tích chuyên khoa có độ chính xác thấp
    const specialtyAccuracy = this.calculateSpecialtyAccuracy();
    const lowAccuracySpecialties = Object.entries(specialtyAccuracy)
      .filter(([, data]) => parseFloat(data.avgAccuracy) < 3)
      .map(([specialty, data]) => ({ specialty, accuracy: data.avgAccuracy }));

    if (lowAccuracySpecialties.length > 0) {
      suggestions.push({
        type: "specialty_improvement",
        message: "Cần cải thiện độ chính xác cho các chuyên khoa:",
        details: lowAccuracySpecialties,
        action: "Điều chỉnh thuật toán matching cho các chuyên khoa này",
      });
    }

    return suggestions;
  }

  /**
   * Lấy thống kê tổng quan
   */
  getOverallStats() {
    const totalSymptomFeedbacks = Array.from(
      this.feedbackData.symptomFeedback.values()
    ).reduce((sum, feedbacks) => sum + feedbacks.length, 0);

    const totalSpecialtyFeedbacks = Array.from(
      this.feedbackData.specialtyFeedback.values()
    ).reduce((sum, feedbacks) => sum + feedbacks.length, 0);

    const totalDoctorFeedbacks = Array.from(
      this.feedbackData.doctorFeedback.values()
    ).reduce((sum, feedbacks) => sum + feedbacks.length, 0);

    return {
      totalSymptomFeedbacks,
      totalSpecialtyFeedbacks,
      totalDoctorFeedbacks,
      totalSearchQueries: this.feedbackData.searchQueries.length,
      uniqueSymptoms: this.feedbackData.symptomFeedback.size,
      uniqueSpecialties: this.feedbackData.specialtyFeedback.size,
      uniqueDoctors: this.feedbackData.doctorFeedback.size,
    };
  }

  /**
   * Lưu đánh giá bác sĩ
   * @param {string} userId - ID người dùng
   * @param {string} doctorId - ID bác sĩ
   * @param {number} rating - Đánh giá (1-5)
   * @param {string} comment - Bình luận
   */
  async saveDoctorRating(userId, doctorId, rating, comment) {
    try {
      const db = require("../config/db");

      // 🩺 Kiểm tra bác sĩ có tồn tại không
      const [doctorRows] = await db.execute("SELECT dr_id, dr_name FROM doctors WHERE dr_id = ?", [
          doctorId,
        ]);
      if (doctorRows.length === 0) {
        throw new Error("Bác sĩ không tồn tại");
      }

      // 🔍 Kiểm tra xem user đã có rating cho bác sĩ này chưa
      const [existingRating] = await db.execute(
          "SELECT id_fb FROM doctor_ratings WHERE id_u = ? AND dr_id = ?",
          [userId, doctorId]
        );

      if (existingRating.length > 0) {
        // 🧩 Nếu đã tồn tại → cập nhật lại
        await db.execute(
          `UPDATE doctor_ratings 
           SET rating = ?, comment = ?, updated_at = NOW() 
           WHERE id_u = ? AND dr_id = ?`,
          [rating, comment, userId, doctorId]
        );

        console.log("🔁 Updated existing doctor rating:", {
          userId,
          doctorId,
          rating,
        });

        return {
          message: "Cập nhật đánh giá thành công",
          updated: true,
        };
      } else {
        // 🆕 Nếu chưa có → thêm mới
        const [result] = await db.execute(
            "INSERT INTO doctor_ratings (id_u, dr_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
            [userId, doctorId, rating, comment]
          );

        console.log("💾 Saved new doctor rating:", {
          userId,
          doctorId,
          rating,
        });

        return {
          id_fb: result.insertId,
          userId,
          doctorId,
          rating,
          comment,
          createdAt: new Date(),
          message: "Thêm đánh giá thành công",
          updated: false,
        };
      }
    } catch (error) {
      console.error("❌ Save doctor rating error:", error);
      throw error;
    }
  }

  /**
   * Lưu đánh giá bệnh viện
   * @param {string} userId - ID người dùng
   * @param {string} hospitalId - ID bệnh viện
   * @param {number} rating - Đánh giá (1-5)
   * @param {string} comment - Bình luận
   */
  async saveHospitalRating(userId, hospitalId, rating, comment) {
    try {
      const db = require("../config/db");

      // Kiểm tra xem bệnh viện có tồn tại không
      const [hospitalRows] = await db.execute("SELECT h_id, h_name FROM hospitals WHERE h_id = ?", [
          hospitalId,
        ]);

      if (hospitalRows.length === 0) {
        throw new Error("Bệnh viện không tồn tại");
      }

      // Kiểm tra xem người dùng đã đánh giá bệnh viện này chưa
      const [existingRating] = await db.execute(
          "SELECT id_fb_hos FROM hospital_ratings WHERE id_u = ? AND h_id = ?",
          [userId, hospitalId]
        );

      if (existingRating.length > 0) {
        throw new Error("Bạn đã đánh giá bệnh viện này rồi");
      }

      // Lưu đánh giá vào database
      const [result] = await db.execute(
          "INSERT INTO hospital_ratings (id_u, h_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
          [userId, hospitalId, rating, comment]
        );

      const feedback = {
        id_fb_hos: result.insertId,
        userId,
        hospitalId,
        hospitalName: hospitalRows[0].h_name,
        rating,
        comment,
        createdAt: new Date(),
      };

      console.log("💾 Saved hospital rating:", {
        userId,
        hospitalId,
        rating,
        commentLength: comment.length,
      });

      return feedback;
    } catch (error) {
      console.error("❌ Save hospital rating error:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đánh giá của bác sĩ
   * @param {string} doctorId - ID bác sĩ
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng mỗi trang
   */
  async getDoctorFeedbacks(doctorId, page = 1, limit = 10) {
    try {
      const db = require("../config/db");
      const offset = (page - 1) * limit;

      // Lấy danh sách đánh giá
      const [ratings] = await db.execute(
        `SELECT 
           dr.id_fb   AS id_fb,
           dr.id_u    AS id_u,
           dr.rating  AS rating,
           dr.comment AS comment,
           dr.created_at,
           u.name_u   AS name_u,
           u.email_u  AS email_u
         FROM doctor_ratings dr 
         LEFT JOIN users u ON dr.id_u = u.id_u 
         WHERE dr.dr_id = ? 
         ORDER BY dr.created_at DESC 
         LIMIT ? OFFSET ?`,
        [doctorId, limit, offset]
      );

      // Lấy tổng số đánh giá
      const [countResult] = await db.execute(
          "SELECT COUNT(*) as total FROM doctor_ratings WHERE dr_id = ?",
          [doctorId]
        );

      // Tính điểm trung bình
      const [avgResult] = await db.execute(
          "SELECT AVG(rating) as average_rating FROM doctor_ratings WHERE dr_id = ?",
          [doctorId]
        );

      return {
        ratings,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
        averageRating: avgResult[0].average_rating
          ? parseFloat(avgResult[0].average_rating).toFixed(1)
          : 0,
      };
    } catch (error) {
      console.error("❌ Get doctor feedbacks error:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách đánh giá của bệnh viện
   * @param {string} hospitalId - ID bệnh viện
   * @param {number} page - Trang hiện tại
   * @param {number} limit - Số lượng mỗi trang
   */
  async getHospitalFeedbacks(hospitalId, page = 1, limit = 10) {
    try {
      const db = require("../config/db");
      const offset = (page - 1) * limit;

      // Lấy danh sách đánh giá
      const [ratings] = await db.execute(
        `SELECT 
           hr.id_fb_hos AS id_fb_hos,
           hr.id_u      AS id_u,
           hr.rating    AS rating,
           hr.comment   AS comment,
           hr.created_at,
           u.name_u     AS name_u,
           u.email_u    AS email_u
         FROM hospital_ratings hr 
         LEFT JOIN users u ON hr.id_u = u.id_u 
         WHERE hr.h_id = ? 
         ORDER BY hr.created_at DESC 
         LIMIT ? OFFSET ?`,
        [hospitalId, limit, offset]
      );

      // Lấy tổng số đánh giá
      const [countResult] = await db.execute(
          "SELECT COUNT(*) as total FROM hospital_ratings WHERE h_id = ?",
          [hospitalId]
        );

      // Tính điểm trung bình
      const [avgResult] = await db.execute(
          "SELECT AVG(rating) as average_rating FROM hospital_ratings WHERE h_id = ?",
          [hospitalId]
        );

      return {
        ratings,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
        averageRating: avgResult[0].average_rating
          ? parseFloat(avgResult[0].average_rating).toFixed(1)
          : 0,
      };
    } catch (error) {
      console.error("❌ Get hospital feedbacks error:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả feedback cho admin
   * @param {Object} options - Tùy chọn lọc và phân trang
   */
  async getAllFeedbacksForAdmin(options = {}) {
    try {
      const db = require("../config/db");
      const { page = 1, limit = 20, type, rating, search } = options;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];

      // Filter by type
      if (type === "doctor") {
        whereConditions.push("dr.id_fb IS NOT NULL");
      } else if (type === "hospital") {
        whereConditions.push("hr.id_fb_hos IS NOT NULL");
      }

      // Filter by rating
      if (rating && rating !== "all") {
        // <-- thêm điều kiện loại trừ 'all'
        whereConditions.push("COALESCE(dr.rating, hr.rating) = ?");
        queryParams.push(rating);
      }

      // Filter by search
      if (search) {
        whereConditions.push(`(
          COALESCE(d.dr_name, h.h_name) LIKE ? OR 
          COALESCE(dr.comment, hr.comment) LIKE ? OR
          name_u LIKE ?
        )`);
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get doctor ratings
      const [doctorRatings] = await db.execute(
        `SELECT 
          dr.id_fb,
          dr.dr_id,
          'doctor' as type,
          d.dr_name AS name,
          sp.sp_name as subtitle,
          dr.rating,
          dr.comment,
          u.name_u as name_u,
          u.email_u as email_u,
          dr.created_at
         FROM doctor_ratings dr
         LEFT JOIN doctors d ON dr.dr_id = d.dr_id
         LEFT JOIN specialties sp ON sp.sp_id = d.sp_id
         LEFT JOIN users u ON dr.id_u = u.id_u
         ${whereClause.replace("dr.id_fb IS NOT NULL", "1=1").replace("hr.id_fb_hos IS NOT NULL", "1=0")}
         ORDER BY dr.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );
      console.log("doctorRatings:", doctorRatings);

      // Get hospital ratings
      const [hospitalRatings] = await db.execute(
        `SELECT 
          hr.id_fb_hos,
          hr.h_id,
          'hospital' as type,
          h.h_name AS name,
          h.h_address as subtitle,
          hr.rating,
          hr.comment,
          u.name_u as name_u,
          u.email_u as email_u,
          hr.created_at
         FROM hospital_ratings hr
         LEFT JOIN hospitals h ON hr.h_id = h.h_id
         LEFT JOIN users u ON hr.id_u = u.id_u
         ${whereClause.replace("hr.id_fb_hos IS NOT NULL", "1=1").replace("dr.id_fb IS NOT NULL", "1=0")}
         ORDER BY hr.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // Combine and sort results
      const allFeedbacks = [...doctorRatings, ...hospitalRatings]
        .map((fb) => ({
          ...fb,
          id: fb.id_fb || fb.id_fb_hos,
          // name đã được set đúng trong query, không cần override
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Get total count
      const [countResult] = await db.execute(
        `SELECT 
          (SELECT COUNT(*) FROM doctor_ratings dr ${whereClause.replace("hr.id_fb IS NOT NULL", "1=0")}) +
          (SELECT COUNT(*) FROM hospital_ratings hr ${whereClause.replace("dr.id_fb_hos IS NOT NULL", "1=0")}) as total`,
        queryParams
      );

      return {
        feedbacks: allFeedbacks,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Get all feedbacks for admin error:", error);
      throw error;
    }
  }

  /**
   * Lấy thống kê feedback cho admin
   */
  async getAdminFeedbackStats() {
    try {
      const db = require("../config/db");

      // Get doctor ratings stats
      const [doctorStats] = await db.execute(
          "SELECT COUNT(*) as total, AVG(rating) as average FROM doctor_ratings"
        );

      // Get hospital ratings stats
      const [hospitalStats] = await db.execute(
          "SELECT COUNT(*) as total, AVG(rating) as average FROM hospital_ratings"
        );

      const totalDoctorRatings = doctorStats[0].total;
      const totalHospitalRatings = hospitalStats[0].total;
      const totalFeedbacks = totalDoctorRatings + totalHospitalRatings;

      // Calculate overall average
      const overallAverage =
        totalFeedbacks > 0
          ? (doctorStats[0].average * totalDoctorRatings +
              hospitalStats[0].average * totalHospitalRatings) /
            totalFeedbacks
          : 0;

      return {
        totalDoctorRatings,
        totalHospitalRatings,
        totalFeedbacks,
        averageRating: overallAverage
          ? parseFloat(overallAverage).toFixed(1)
          : 0,
      };
    } catch (error) {
      console.error("❌ Get admin feedback stats error:", error);
      throw error;
    }
  }

  /**
   * Xóa đánh giá bác sĩ
   * @param {string} ratingId - ID đánh giá
   */
  async deleteDoctorRating(ratingId) {
    try {
      const db = require("../config/db");

      await db.execute("DELETE FROM doctor_ratings WHERE id_fb = ?", [ratingId]);

      console.log("🗑️ Deleted doctor rating:", ratingId);
    } catch (error) {
      console.error("❌ Delete doctor rating error:", error);
      throw error;
    }
  }

  /**
   * Xóa đánh giá bệnh viện
   * @param {string} ratingId - ID đánh giá
   */
  async deleteHospitalRating(ratingId) {
    try {
      const db = require("../config/db");

      await db.execute("DELETE FROM hospital_ratings WHERE id_fb_hos = ?", [
          ratingId,
        ]);

      console.log("🗑️ Deleted hospital rating:", ratingId);
    } catch (error) {
      console.error("❌ Delete hospital rating error:", error);
      throw error;
    }
  }

  /**
   * Cập nhật đánh giá bệnh viện của user
   * @param {string} userId - ID user
   * @param {string} ratingId - ID đánh giá
   * @param {number} rating - Đánh giá mới (1-5)
   * @param {string} comment - Bình luận mới
   */
  async updateHospitalRating(userId, ratingId, rating, comment) {
    try {
      const db = require("../config/db");

      // Kiểm tra xem rating có thuộc về user không
      const [rows] = await db.promise().execute(
        "SELECT * FROM hospital_ratings WHERE id_fb_hos = ? AND id_u = ?",
        [ratingId, userId]
      );

      if (rows.length === 0) {
        throw new Error("Không tìm thấy đánh giá hoặc bạn không có quyền sửa");
      }

      // Cập nhật đánh giá
      await db.execute(
        "UPDATE hospital_ratings SET rating = ?, comment = ?, updated_at = NOW() WHERE id_fb_hos = ? AND id_u = ?",
        [rating, comment, ratingId, userId]
      );

      console.log("✅ Updated hospital rating:", { ratingId, userId, rating });
      
      return {
        id_fb_hos: ratingId,
        rating,
        comment,
        updated: true,
        message: "Đánh giá đã được cập nhật thành công"
      };
    } catch (error) {
      console.error("❌ Update hospital rating error:", error);
      throw error;
    }
  }

  /**
   * Xóa đánh giá bệnh viện của user
   * @param {string} userId - ID user
   * @param {string} ratingId - ID đánh giá
   */
  async deleteOwnHospitalRating(userId, ratingId) {
    try {
      const db = require("../config/db");

      // Kiểm tra xem rating có thuộc về user không
      const [rows] = await db.promise().execute(
        "SELECT * FROM hospital_ratings WHERE id_fb_hos = ? AND id_u = ?",
        [ratingId, userId]
      );

      if (rows.length === 0) {
        throw new Error("Không tìm thấy đánh giá hoặc bạn không có quyền xóa");
      }

      await db.execute(
        "DELETE FROM hospital_ratings WHERE id_fb_hos = ?",
        [ratingId]
      );

      console.log("🗑️ Deleted own hospital rating:", ratingId);
    } catch (error) {
      console.error("❌ Delete own hospital rating error:", error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();
