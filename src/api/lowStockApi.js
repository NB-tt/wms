import request from '@/utils/request'

// 低库存预警相关接口
export const lowStockApi = {
  // 接口路径，与后端控制器匹配
  getLowStockItems: (params) => request.get('/low-stock/items', { params }),
  
  // 设置库存预警阈值
  setWarningThreshold: (data) => request.post('/items/set-threshold', data),
  
  // 获取当前预警阈值
  getWarningThreshold: () => request.get('/items/threshold')
}
