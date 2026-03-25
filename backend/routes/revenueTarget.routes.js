const express = require('express');
const router = express.Router();

// Import auth middleware
const authMiddleware = require('../middlewares/auth.middleware');

// Import controller
const revenueTargetController = require('../controllers/revenueTarget.controller');

// Routes cho revenue targets
// Dùng verifyToken + requireAdmin (đã có sẵn trong auth.middleware)
router.post('/', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.createOrUpdateTarget
);

router.get('/', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.getTargets
);

router.get('/item', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.getTargetByItem
);

router.get('/progress', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.getTargetProgress
);

router.get('/statistics', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.getTargetStatistics
);

router.delete('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.requireAdmin, 
  revenueTargetController.deleteTarget
);

module.exports = router;