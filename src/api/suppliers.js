// 供应商管理接口
import request from '@/utils/request'

export const supplierApi = {
  // 1. 分页查询供应商（后端路径：/api/suppliers/page，method=GET）
  list: (params) => request.get('/suppliers/page', { params }),  
  
  // 2. 新增供应商（后端路径：/api/suppliers，method=POST）
  add: (data) => request.post('/suppliers', data),   
  
  // 3. 编辑供应商（后端路径：/api/suppliers，method=PUT）
  update: (data) => request.put('/suppliers', data),    
  
  // 4. 删除供应商（后端路径：/api/suppliers/{id}，method=DELETE）
  delete: (id) => request.delete(`/suppliers/${id}`),  
  
  // 5. 获取所有供应商（后端路径：/api/suppliers，method=GET）
  getAll: () => request.get('/suppliers')
}