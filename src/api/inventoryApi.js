import request from '@/utils/request'

export const stocktakingApi = {
  // 创建盘点任务及明细
  createTask: (data) => request.post('/stocktaking/task', data),

  // 查询所有盘点任务
  getTasks: () => request.get('/stocktaking/tasks'),

  // 查询某个任务的明细
  getDetails: (taskId) => request.get(`/stocktaking/details/${taskId}`),

  // 完成任务并生成库存调整
  completeTask: (taskId) => request.post(`/stocktaking/complete-adjust/${taskId}`)
}
