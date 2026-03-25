const revenueTargetService = require('../services/revenueTarget.service');

const revenueTargetController = {
  // Tạo hoặc cập nhật mục tiêu doanh thu
  createOrUpdateTarget: async (req, res) => {
    try {
      const targetData = req.body;
      
      // Validate input data
      const validation = revenueTargetService.validateTargetData(targetData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Dữ liệu không hợp lệ',
          details: validation.errors
        });
      }

      // Create or update target using service
      const result = await revenueTargetService.createOrUpdateTarget(targetData);
      
      res.json(result);
    } catch (error) {
      console.error('Controller error in createOrUpdateTarget:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi lưu mục tiêu',
        message: error.message 
      });
    }
  },

  // Lấy danh sách mục tiêu
  getTargets: async (req, res) => {
    try {
      const filters = req.query;
      const targets = await revenueTargetService.getTargets(filters);
      
      res.json({ 
        targets,
        total: targets.length
      });
    } catch (error) {
      console.error('Controller error in getTargets:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi lấy mục tiêu',
        message: error.message 
      });
    }
  },

  // Xóa mục tiêu
  deleteTarget: async (req, res) => {
    try {
      const { id } = req.params;
      const { type, targetMonth } = req.query;
      
      console.log('Delete target request:', { id, type, targetMonth });
      
      if (!id || !type) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết (ID và type)' });
      }

      const result = await revenueTargetService.deleteTarget(id, type, targetMonth);
      
      console.log('Delete result:', result);
      
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Controller error in deleteTarget:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi xóa mục tiêu',
        message: error.message 
      });
    }
  },

  // Lấy mục tiêu của một item cụ thể
  getTargetByItem: async (req, res) => {
    try {
      const { itemId, itemType, targetMonth } = req.query;
      
      if (!itemId || !itemType) {
        return res.status(400).json({ error: 'Thiếu thông tin item (itemId và itemType)' });
      }

      let target;
      if (targetMonth) {
        target = await revenueTargetService.getTargetByItemAndMonth(itemId, itemType, targetMonth);
      } else {
        target = await revenueTargetService.getCurrentTarget(itemId, itemType);
      }
      
      res.json({ 
        target: target || null 
      });
    } catch (error) {
      console.error('Controller error in getTargetByItem:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi lấy mục tiêu',
        message: error.message 
      });
    }
  },

  // Lấy tiến độ hoàn thành mục tiêu
  getTargetProgress: async (req, res) => {
    try {
      const { itemId, itemType, currentRevenue, targetMonth } = req.query;
      
      if (!itemId || !itemType || currentRevenue === undefined) {
        return res.status(400).json({ error: 'Thiếu thông tin cần thiết' });
      }

      const progress = await revenueTargetService.getTargetProgress(
        itemId, 
        itemType, 
        parseFloat(currentRevenue), 
        targetMonth
      );
      
      res.json(progress);
    } catch (error) {
      console.error('Controller error in getTargetProgress:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi tính tiến độ mục tiêu',
        message: error.message 
      });
    }
  },

  // Lấy thống kê mục tiêu
  getTargetStatistics: async (req, res) => {
    try {
      const { itemType, targetMonth } = req.query;
      const stats = await revenueTargetService.getTargetStatistics(itemType, targetMonth);
      
      res.json({ 
        statistics: stats,
        month: targetMonth || new Date().toISOString().slice(0, 7)
      });
    } catch (error) {
      console.error('Controller error in getTargetStatistics:', error);
      res.status(500).json({ 
        error: 'Lỗi server khi lấy thống kê mục tiêu',
        message: error.message 
      });
    }
  }
};

module.exports = revenueTargetController;