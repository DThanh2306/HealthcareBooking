const db = require('../config/db');

class RevenueTargetService {
  // Tạo hoặc cập nhật mục tiêu doanh thu
  async createOrUpdateTarget(targetData) {
    const { itemId, itemType, monthlyTarget, targetMonth, note } = targetData;
    
    try {
      // Kiểm tra xem mục tiêu đã tồn tại chưa
      const existingTarget = await this.getTargetByItemAndMonth(itemId, itemType, targetMonth);
      
      if (existingTarget) {
        // Cập nhật mục tiêu hiện có
        const result = await db.execute(
          'UPDATE revenue_targets SET monthly_target = ?, note = ?, updated_at = NOW() WHERE id = ?',
          [monthlyTarget, note || null, existingTarget.id]
        );
        
        return {
          success: true,
          targetId: existingTarget.id,
          isUpdate: true,
          message: 'Đã cập nhật mục tiêu thành công'
        };
      } else {
        // Tạo mục tiêu mới
        const result = await db.execute(
          'INSERT INTO revenue_targets (item_id, item_type, monthly_target, target_month, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [itemId, itemType, monthlyTarget, targetMonth, note || null]
        );
        const insertResult = Array.isArray(result) ? result[0] : result;
        
        return {
          success: true,
          targetId: insertResult.insertId,
          isUpdate: false,
          message: 'Đã tạo mục tiêu thành công'
        };
      }
    } catch (error) {
      console.error('Service error in createOrUpdateTarget:', error);
      throw new Error('Lỗi khi lưu mục tiêu vào database');
    }
  }

  // Lấy mục tiêu theo item và tháng
  async getTargetByItemAndMonth(itemId, itemType, targetMonth) {
    try {
      const result = await db.execute(
        'SELECT * FROM revenue_targets WHERE item_id = ? AND item_type = ? AND target_month = ?',
        [itemId, itemType, targetMonth]
      );
      
      // Handle mysql2 result format
      const targets = Array.isArray(result) ? result[0] : result.rows || [];
      return targets.length > 0 ? targets[0] : null;
    } catch (error) {
      console.error('Service error in getTargetByItemAndMonth:', error);
      console.error('Error details:', error.message);
      throw new Error('Lỗi khi tìm mục tiêu');
    }
  }

  // Lấy danh sách mục tiêu với filters
  async getTargets(filters = {}) {
    const { itemType, targetMonth, itemId } = filters;
    
    try {
      let query = 'SELECT * FROM revenue_targets WHERE 1=1';
      const params = [];
      
      if (itemType) {
        query += ' AND item_type = ?';
        params.push(itemType);
      }
      
      if (targetMonth) {
        query += ' AND target_month = ?';
        params.push(targetMonth);
      }
      
      if (itemId) {
        query += ' AND item_id = ?';
        params.push(itemId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.execute(query, params);
      const targets = Array.isArray(result) ? result[0] : result.rows || [];
      return targets;
    } catch (error) {
      console.error('Service error in getTargets:', error);
      console.error('Error details:', error.message);
      throw new Error('Lỗi khi lấy danh sách mục tiêu');
    }
  }

  // Xóa mục tiêu
  async deleteTarget(itemId, itemType, targetMonth = null) {
    try {
      console.log('Service deleteTarget called with:', { itemId, itemType, targetMonth });
      
      // First check if target exists
      const existing = await this.getTargets({ itemId, itemType, targetMonth });
      console.log('Existing targets found:', existing);
      
      if (existing.length === 0) {
        return {
          success: false,
          deletedCount: 0,
          message: 'Không tìm thấy mục tiêu để xóa'
        };
      }
      
      let query = 'DELETE FROM revenue_targets WHERE item_id = ? AND item_type = ?';
      const params = [itemId, itemType];
      
      if (targetMonth) {
        query += ' AND target_month = ?';
        params.push(targetMonth);
      }
      
      console.log('Delete query:', query, params);
      
      const result = await db.execute(query, params);
      const deleteResult = Array.isArray(result) ? result[0] : result;
      
      console.log('Delete result:', deleteResult);
      
      return {
        success: deleteResult.affectedRows > 0,
        deletedCount: deleteResult.affectedRows,
        message: deleteResult.affectedRows > 0 ? 'Đã xóa mục tiêu thành công' : 'Không tìm thấy mục tiêu để xóa'
      };
    } catch (error) {
      console.error('Service error in deleteTarget:', error);
      console.error('Error details:', error.message);
      throw new Error('Lỗi khi xóa mục tiêu: ' + error.message);
    }
  }

  // Lấy mục tiêu hiện tại cho một item
  async getCurrentTarget(itemId, itemType) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return await this.getTargetByItemAndMonth(itemId, itemType, currentMonth);
  }

  // Lấy tiến độ hoàn thành mục tiêu
  async getTargetProgress(itemId, itemType, currentRevenue, targetMonth = null) {
    try {
      const month = targetMonth || new Date().toISOString().slice(0, 7);
      const target = await this.getTargetByItemAndMonth(itemId, itemType, month);
      
      if (!target) {
        return {
          hasTarget: false,
          progress: 0,
          remaining: 0,
          target: null
        };
      }
      
      const progress = target.monthly_target > 0 ? 
        Math.min(100, (currentRevenue / target.monthly_target) * 100) : 0;
      
      const remaining = Math.max(0, target.monthly_target - currentRevenue);
      
      return {
        hasTarget: true,
        progress: progress,
        remaining: remaining,
        target: target,
        isAchieved: progress >= 100
      };
    } catch (error) {
      console.error('Service error in getTargetProgress:', error);
      throw new Error('Lỗi khi tính toán tiến độ mục tiêu');
    }
  }

  // Lấy thống kê mục tiêu tổng quan
  async getTargetStatistics(itemType = null, targetMonth = null) {
    try {
      const month = targetMonth || new Date().toISOString().slice(0, 7);
      
      let query = `
        SELECT 
          item_type,
          COUNT(*) as total_targets,
          AVG(monthly_target) as avg_target,
          SUM(monthly_target) as total_target_amount
        FROM revenue_targets 
        WHERE target_month = ?
      `;
      const params = [month];
      
      if (itemType) {
        query += ' AND item_type = ?';
        params.push(itemType);
      }
      
      query += ' GROUP BY item_type';
      
      const result = await db.execute(query, params);
      const stats = Array.isArray(result) ? result[0] : result.rows || [];
      return stats;
    } catch (error) {
      console.error('Service error in getTargetStatistics:', error);
      throw new Error('Lỗi khi lấy thống kê mục tiêu');
    }
  }

  // Lấy top performers dựa trên % hoàn thành mục tiêu
  async getTopPerformers(itemType, targetMonth = null, limit = 10) {
    try {
      const month = targetMonth || new Date().toISOString().slice(0, 7);
      
      // This would need to be implemented with actual revenue data
      // For now, return structure for future implementation
      const result = await db.execute(
        'SELECT * FROM revenue_targets WHERE item_type = ? AND target_month = ? ORDER BY monthly_target DESC LIMIT ?',
        [itemType, month, limit]
      );
      const targets = Array.isArray(result) ? result[0] : result.rows || [];
      
      return targets.map(target => ({
        ...target,
        // These would be calculated with actual revenue data
        currentRevenue: 0,
        progress: 0,
        rank: 0
      }));
    } catch (error) {
      console.error('Service error in getTopPerformers:', error);
      throw new Error('Lỗi khi lấy top performers');
    }
  }

  // Validate target data
  validateTargetData(targetData) {
    const { itemId, itemType, monthlyTarget, targetMonth } = targetData;
    const errors = [];
    
    if (!itemId) errors.push('Item ID là bắt buộc');
    if (!itemType || !['doctor', 'hospital', 'specialty'].includes(itemType)) {
      errors.push('Item type phải là doctor, hospital hoặc specialty');
    }
    if (!monthlyTarget || monthlyTarget <= 0) {
      errors.push('Mục tiêu tháng phải là số dương');
    }
    if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
      errors.push('Tháng mục tiêu phải có định dạng YYYY-MM');
    }
    
    // Note: Cho phép đặt mục tiêu cho các tháng trong quá khứ để phục vụ mục đích hiệu chỉnh dữ liệu.
    // Nếu muốn giới hạn chỉ hiện tại và tương lai, có thể bật lại kiểm tra dưới đây.
    // const currentMonth = new Date().toISOString().slice(0, 7);
    // if (targetMonth < currentMonth) {
    //   errors.push('Không thể đặt mục tiêu cho tháng trong quá khứ');
    // }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new RevenueTargetService();