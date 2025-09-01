import request from '@/utils/request'

export const permissionApi = {
  // 权限列表（请求路径：/api/permissions → 匹配后端PermissionController）
  list: () => request.get('/permissions'),
}