import request from '@/utils/request'

export const roleApi = {
  // 角色列表（请求路径：/api/roles → 后端角色接口）
  list: (pageNum, pageSize) => request.get('/roles', { params: { pageNum, pageSize } }),
  // 保存角色
  save: (data) => request.post('/roles', data),
  // 删除角色
  delete: (id) => request.delete(`/roles/${id}`),
  // 分配权限
  assignPerms: (data) => request.post('/roles/assign-perms', data),
  // 获取角色权限
  getPerms: (roleId) => request.get(`/roles/${roleId}/perms`),
}