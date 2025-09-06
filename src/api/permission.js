import request from '@/utils/request'

export const permissionApi = {
  // 权限列表（请求路径：/api/permissions → 匹配后端PermissionController）
  list: () => request.get('/permissions'),
  
  // 获取角色权限（请求路径：/api/roles/{roleId}/perms → 后端角色权限接口）
  getRolePerms: (roleId) => request.get(`/roles/${roleId}/perms`),
  
  // 分配权限（请求路径：/api/roles/assign-perms → 后端分配权限接口）
  assignPerms: (data) => request.post('/roles/assign-perms', data)
}