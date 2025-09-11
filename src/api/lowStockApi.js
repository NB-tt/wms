import request from '@/utils/request'

// 低库存预警相关接口
export const lowStockApi = {
  // 接口路径，与后端控制器匹配
  getLowStockItems: (params) => request.get('/low-stock/items', { params }),
  
  // 设置库存预警阈值
  setWarningThreshold: (data) => request.post('/items/set-threshold', data),
  
  // 获取当前预警阈值
  getWarningThreshold: () => request.get('/items/threshold'),

   // 获取低库存物品列表
  getLowStockItems: () => request.get('/low-stock/items'),
  
  // 忽略预警
  ignoreWarning: (itemId) => request.post('/low-stock/ignore', null, {
    params: { itemId }
  }),
  
  // 设置预警阈值
  setWarningThreshold: (data) => request.post('/low-stock/set-threshold', data),

  //查看忽略
  getIgnoredItems: () => request.get('/low-stock/ignored-items'),

  //恢复预警
  setWarningThreshold: (itemId, threshold) => 
  request.post('/low-stock/restore', null, { 
    params: { itemId, threshold } 
  })
}


