import request from '@/utils/request'

export const userApi = {
  // 路径 '/users/login'，结合baseURL='/api' 后匹配后端的 '/api/users/login'
  login: (data) => request.post('/users/login', data),
  
  // 其他接口（与后端对应）
  getUserList: (params) => request.get('/users/list', { params }),
  addUser: (data) => request.post('/users/add', data),
  updateUser: (data) => request.post('/users/update', data),
  deleteUser: (id) => request.delete(`/users/${id}`)
  
}

    