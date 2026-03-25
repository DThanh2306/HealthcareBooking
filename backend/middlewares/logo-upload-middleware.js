/* eslint-disable no-undef */
const multer = require('multer');
const path = require('path');
const ApiError = require('../api-error');

// ✅ Cải thiện storage với validation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniquePrefix + ext);
  },
});

// ✅ Thêm file filter để validation
const fileFilter = (req, file, cb) => {
  // Kiểm tra MIME type
  const mime = (file.mimetype || '').toLowerCase();
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp'];

  // Kiểm tra extension (một số môi trường đặt extension lạ như .jfif, viết HOA...)
  const ext = (path.extname(file.originalname) || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'];

  // Chấp nhận nếu mime hợp lệ hoặc extension hợp lệ
  if (!allowedMimes.includes(mime) && !allowedExts.includes(ext)) {
    return cb(new ApiError(400, 'Định dạng ảnh không được hỗ trợ (hỗ trợ: jpg, jpeg, png, gif, webp, jfif)!'), false);
  }

  cb(null, true);
};

function avatarUpload(req, res, next) {
  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }).single('avatarFile');

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Kích thước file không được vượt quá 5MB!'));
      }
      return next(new ApiError(400, 'Lỗi khi upload file: ' + err.message));
    } else if (err) {
      return next(new ApiError(500, err.message || 'Lỗi không xác định khi upload file'));
    }
    next();
  });
}

module.exports = avatarUpload;
