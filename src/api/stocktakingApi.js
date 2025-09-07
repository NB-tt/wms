import request from '@/utils/request'

export const stocktakingApi = {
  // 创建任务
  createTask: (data) => request.post('/stocktaking/task', data),

  // 获取所有任务
  getTasks: () => request.get('/stocktaking/tasks'),

  // 获取任务明细
  getDetails: (taskId) => request.get(`/stocktaking/details/${taskId}`),

  // 完成任务并调整库存
  completeTask: (taskId) => request.post(`/stocktaking/complete-adjust/${taskId}`),

  // 搜索物料（远程搜索下拉框）
  searchItems: (keyword) => request.get('/items/search', { params: { keyword } }),

  // 提交盘点明细
  submitDetail: (detail) => request.post('/stocktaking/submit-detail', detail)
}
