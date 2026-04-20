const feedbackService = require("../services/feedback.service");
const db = require("../config/db");
/**
 * Lưu feedback về chẩn đoán
 * POST /api/feedback/diagnosis
 */
exports.saveDiagnosisFeedback = async (req, res) => {
  try {
    const { symptoms, suggestedSpecialties, actualSpecialties, accuracy } =
      req.body;
    const userId = req.user?.id_u || req.body.userId;

    // Validate input
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        error: "Triệu chứng là bắt buộc và phải là mảng",
      });
    }

    if (!suggestedSpecialties || !Array.isArray(suggestedSpecialties)) {
      return res.status(400).json({
        error: "Chuyên khoa được đề xuất là bắt buộc và phải là mảng",
      });
    }

    if (accuracy < 1 || accuracy > 5) {
      return res.status(400).json({
        error: "Độ chính xác phải từ 1-5",
      });
    }

    const feedback = await feedbackService.saveDiagnosisFeedback(
      userId,
      symptoms,
      suggestedSpecialties,
      actualSpecialties || [],
      accuracy
    );

    res.json({
      success: true,
      message: "Feedback đã được lưu thành công",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Save diagnosis feedback error:", error);
    res.status(500).json({
      error: "Không thể lưu feedback. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lưu feedback về bác sĩ
 * POST /api/feedback/doctor
 */
exports.saveDoctorFeedback = async (req, res) => {
  try {
    const { suggestedDoctors, selectedDoctor, satisfaction } = req.body;
    const userId = req.user?.id_u || req.body.userId;

    // Validate input
    if (!suggestedDoctors || !Array.isArray(suggestedDoctors)) {
      return res.status(400).json({
        error: "Danh sách bác sĩ được đề xuất là bắt buộc",
      });
    }

    if (!selectedDoctor) {
      return res.status(400).json({
        error: "Bác sĩ được chọn là bắt buộc",
      });
    }

    if (satisfaction < 1 || satisfaction > 5) {
      return res.status(400).json({
        error: "Mức độ hài lòng phải từ 1-5",
      });
    }

    const feedback = await feedbackService.saveDoctorFeedback(
      userId,
      suggestedDoctors,
      selectedDoctor,
      satisfaction
    );

    res.json({
      success: true,
      message: "Feedback về bác sĩ đã được lưu thành công",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Save doctor feedback error:", error);
    res.status(500).json({
      error: "Không thể lưu feedback. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lưu lịch sử tìm kiếm
 * POST /api/feedback/search
 */
exports.saveSearchQuery = async (req, res) => {
  try {
    const { query, results } = req.body;
    const userId = req.user?.id_u || req.body.userId;

    // Validate input
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        error: "Kết quả tìm kiếm phải là mảng",
      });
    }

    const searchData = await feedbackService.saveSearchQuery(
      query,
      results,
      userId
    );

    res.json({
      success: true,
      message: "Lịch sử tìm kiếm đã được lưu",
      data: searchData,
    });
  } catch (error) {
    console.error("❌ Save search query error:", error);
    res.status(500).json({
      error: "Không thể lưu lịch sử tìm kiếm. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Phân tích feedback
 * GET /api/feedback/analysis
 */
exports.getFeedbackAnalysis = async (req, res) => {
  try {
    const analysis = await feedbackService.analyzeFeedback();
    const stats = feedbackService.getOverallStats();

    res.json({
      success: true,
      data: {
        analysis,
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Get feedback analysis error:", error);
    res.status(500).json({
      error: "Không thể phân tích feedback. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lấy thống kê tổng quan
 * GET /api/feedback/stats
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = feedbackService.getOverallStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Get feedback stats error:", error);
    res.status(500).json({
      error: "Không thể lấy thống kê. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lưu feedback về bác sĩ cụ thể
 * POST /api/feedback/doctor-rating
 */
exports.saveDoctorRating = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;
    const userId = req.user?.id_u || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Bạn cần đăng nhập để đánh giá",
      });
    }

    // Validate input
    if (!doctorId) {
      return res.status(400).json({
        error: "ID bác sĩ là bắt buộc",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Đánh giá phải từ 1-5 sao",
      });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        error: "Bình luận phải có ít nhất 10 ký tự",
      });
    }

    const feedback = await feedbackService.saveDoctorRating(
      userId,
      doctorId,
      rating,
      comment.trim()
    );

    res.json({
      success: true,
      message: "Đánh giá bác sĩ đã được lưu thành công",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Save doctor rating error:", error);
    res.status(500).json({
      error: "Không thể lưu đánh giá. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lưu feedback về bệnh viện
 * POST /api/feedback/hospital-rating
 */
exports.saveHospitalRating = async (req, res) => {
  try {
    const { hospitalId, rating, comment } = req.body;
    const userId = req.user?.id_u || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Bạn cần đăng nhập để đánh giá",
      });
    }

    // Validate input
    if (!hospitalId) {
      return res.status(400).json({
        error: "ID bệnh viện là bắt buộc",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Đánh giá phải từ 1-5 sao",
      });
    }

    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        error: "Bình luận phải có ít nhất 10 ký tự",
      });
    }

    const feedback = await feedbackService.saveHospitalRating(
      userId,
      hospitalId,
      rating,
      comment.trim()
    );

    res.json({
      success: true,
      message: "Đánh giá bệnh viện đã được lưu thành công",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Save hospital rating error:", error);
    res.status(500).json({
      error: "Không thể lưu đánh giá. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Cập nhật đánh giá bác sĩ của chính người dùng
 * PUT /api/feedback/doctor-rating/:id
 */
exports.updateDoctorRating = async (req, res) => {
  try {
    const ratingId = req.params.id_fb;
    const { rating, comment } = req.body;
    const userId = req.user?.id_u;

    if (!userId) return res.status(401).json({ error: "Bạn cần đăng nhập" });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Đánh giá phải từ 1-5 sao" });
    }
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: "Bình luận phải có ít nhất 10 ký tự" });
    }

    const updated = await feedbackService.updateDoctorRating(userId, ratingId, rating, comment.trim());
    return res.json({ success: true, message: "Đã cập nhật đánh giá", data: updated });
  } catch (error) {
    console.error("❌ Update doctor rating error:", error);
    return res.status(500).json({ error: "Không thể cập nhật đánh giá" });
  }
};

/**
 * Xóa đánh giá bác sĩ của chính người dùng
 * DELETE /api/feedback/doctor-rating/:id
 */
// 🟥 Xóa đánh giá bác sĩ
exports.deleteDoctorRating = async (req, res) => {
  try {
    const ratingId = req.params.id_fb;
    const userId = req.user?.id_u; // middleware auth gán vào

    console.log("🧩 DELETE doctor rating:", { ratingId, userId });

    if (!userId) {
      return res.status(401).json({ error: "Bạn cần đăng nhập" });
    }

    // 🔍 Kiểm tra xem có tồn tại rating đó của user không
    const [rows] = await db.execute(
      "SELECT * FROM doctor_ratings WHERE id_fb = ? AND id_u = ?",
      [ratingId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy đánh giá này hoặc bạn không có quyền xóa" });
    }

    // 🗑 Xóa đánh giá
    await db.execute("DELETE FROM doctor_ratings WHERE id_fb = ?", [ratingId]);

    console.log("✅ Đã xóa rating id =", ratingId);

    return res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    console.error("❌ Delete doctor rating error:", error);
    return res.status(500).json({ error: "Không thể xóa đánh giá", details: error.message });
  }
};


/**
 * Cập nhật đánh giá bệnh viện của chính người dùng
 * PUT /api/feedback/hospital-rating/:id
 */
exports.updateHospitalRating = async (req, res) => {
  try {
    console.log('🟦 UPDATE Hospital Rating - Debug Info:');
    console.log('- Rating ID:', req.params.id_fb_hos);
    console.log('- User ID:', req.user?.id_u);
    console.log('- Body:', req.body);
    
    const ratingId = req.params.id_fb_hos;
    const { rating, comment } = req.body;
    const userId = req.user?.id_u;

    if (!userId) return res.status(401).json({ error: "Bạn cần đăng nhập" });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Đánh giá phải từ 1-5 sao" });
    }
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: "Bình luận phải có ít nhất 10 ký tự" });
    }

    const updated = await feedbackService.updateHospitalRating(userId, ratingId, rating, comment.trim());
    return res.json({ success: true, message: "Đã cập nhật đánh giá", data: updated });
  } catch (error) {
    console.error("❌ Update hospital rating error:", error);
    return res.status(500).json({ error: "Không thể cập nhật đánh giá" });
  }
};

/**
 * Xóa đánh giá bệnh viện của chính người dùng
 * DELETE /api/feedback/hospital-rating/:id
 */
exports.deleteHospitalRating = async (req, res) => {
  try {
    const ratingId = req.params.id_fb_hos;
    const userId = req.user?.id_u;
    if (!userId) return res.status(401).json({ error: "Bạn cần đăng nhập" });

    await feedbackService.deleteOwnHospitalRating(userId, ratingId);
    return res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    console.error("❌ Delete hospital rating error:", error);
    return res.status(500).json({ error: "Không thể xóa đánh giá" });
  }
};


/**
 * Lấy danh sách feedback của bác sĩ
 * GET /api/feedback/doctor/:doctorId
 */
exports.getDoctorFeedbacks = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const feedbacks = await feedbackService.getDoctorFeedbacks(
      doctorId,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    // Đánh dấu đánh giá thuộc về người dùng hiện tại
    const currentUserId = req.user?.id_u || null;
    const ratingsWithOwner = feedbacks.ratings.map((r) => ({
      ...r,
      isOwner: currentUserId ? r.id_u === currentUserId : false,
    }));
    const myRating = currentUserId
      ? ratingsWithOwner.find((r) => r.isOwner) || null
      : null;

    res.json({
      success: true,
      data: {
        ratings: ratingsWithOwner,
        pagination: feedbacks.pagination,
        averageRating: feedbacks.averageRating,
        currentUserId,
        myRating,
        myRatingId: myRating ? myRating.id_fb : null,
      },
    });
  } catch (error) {
    console.error("❌ Get doctor feedbacks error:", error);
    res.status(500).json({
      error: "Không thể lấy đánh giá bác sĩ. Vui lòng thử lại sau.",
    });
  }
};

/**
 * Lấy danh sách feedback của bệnh viện
 * GET /api/feedback/hospital/:hospitalId
 */
exports.getHospitalFeedbacks = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const feedbacks = await feedbackService.getHospitalFeedbacks(
      hospitalId,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    // Đánh dấu đánh giá thuộc về người dùng hiện tại
    const currentUserId = req.user?.id_u || null;
    const ratingsWithOwner = feedbacks.ratings.map((r) => ({
      ...r,
      isOwner: currentUserId ? r.id_u === currentUserId : false,
    }));
    const myRating = currentUserId
      ? ratingsWithOwner.find((r) => r.isOwner) || null
      : null;

    res.json({
      success: true,
      data: {
        ratings: ratingsWithOwner,
        pagination: feedbacks.pagination,
        averageRating: feedbacks.averageRating,
        currentUserId,
        myRating,
        myRatingId: myRating ? myRating.id_fb_hos : null,
      },
    });
  } catch (error) {
    console.error("❌ Get hospital feedbacks error:", error);
    res.status(500).json({
      error: "Không thể lấy đánh giá bệnh viện. Vui lòng thử lại sau.",
    });
  }
};