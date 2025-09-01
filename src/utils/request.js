import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '/api', // 与代理配置配合，最终请求为 http://localhost:8088/api/xxx
  timeout: 5000,
  withCredentials: true // 允许携带cookie
})

// 请求拦截器：添加Token
request.interceptors.request.use(config => {
  const userStore = useUserStore()
  // 携带Token（后端要求格式：Bearer + 空格 + token）
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  console.log(`请求发送: ${config.method} ${config.url}`)
  return config
}, error => {
  ElMessage.error('请求发送失败')
  return Promise.reject(error)
})

// 响应拦截器
request.interceptors.response.use(response => {
  return response.data
}, error => {
  console.error(`请求失败: ${error.config.url}`, error.response)
  // 统一处理401未授权（Token无效/过期）
  if (error.response?.status === 401) {
    const userStore = useUserStore()
    userStore.clearUserInfo() // 清除无效登录信息
    ElMessage.error('登录已过期，请重新登录')
    window.location.href = '/login' // 跳转到登录页
  } else {
    ElMessage.error(error.response?.data?.message || '请求失败')
  }
  return Promise.reject(error)
})

export default request