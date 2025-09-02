import request from '@/utils/request'

// 用户管理接口（保持不变）
export const userApi = {
  list: (params) => request.get('/users/list', { params }),  
  add: (data) => request.post('/users/add', data),          
  update: (data) => request.post('/users/update', data),   
  delete: (id) => request.delete(`/users/${id}`),
  updateStatus: (data) => request.post('/users/update-status', data)  // 用户状态单独更新接口
}

// 角色管理接口
export const roleApi = {
  list: () => request.get('/roles'),  // 角色列表
  getPerms: (roleId) => request.get(`/roles/${roleId}/permissions`),  // 角色权限
  assignPerms: (data) => request.post('/roles/assign-permissions', data),  // 分配权限
  create: (role) => request.post('/roles', role),  // 新增角色
  checkRoleName: (name) => request.get(`/roles/check-name?name=${name}`),  // 角色名称唯一性校验
  checkRoleCode: (code) => request.get(`/roles/check-code?code=${code}`),   // 角色标识唯一性校验
  delete: (roleId) => request.delete(`/roles/${roleId}`)  // 角色删除接口
}

// 权限列表接口（保持不变）
export const permissionApi = {
  list: () => request.get('/permissions')
}