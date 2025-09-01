   // src/api/userManagementApi.js
   import request from '@/utils/request'

   // 用户管理接口
   export const userApi = {
     list: (params) => request.get('/users/list', { params }),  
     add: (data) => request.post('/users/add', data),          
     update: (data) => request.post('/users/update', data),   
     delete: (id) => request.delete(`/users/${id}`)  
   }

   // 角色管理接口（核心修正）
   export const roleApi = {
     // 获取所有角色的路径（后端路径 /api/roles）
     list: () => request.get('/roles'),  // 正确路径：baseURL + '/roles' → /api/roles
     
     // 角色权限查询路径（后端路径 /api/roles/{roleId}/permissions）
     getPerms: (roleId) => request.get(`/roles/${roleId}/permissions`),  
     
     // 权限分配接口路径（后端路径 /api/roles/assign-permissions）
     assignPerms: (data) => request.post('/roles/assign-permissions', data),  
     
     save: (data) => request.post('/roles', data)  
   }

   // 权限列表接口
   export const permissionApi = {
     list: () => request.get('/permissions')  // 路径：/api/permissions
   }