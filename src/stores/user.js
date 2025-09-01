import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: localStorage.getItem('userId') || null,
    role: localStorage.getItem('role') || null,
    realName: localStorage.getItem('realName') || '',
    token: localStorage.getItem('token') || null,
    permissions: localStorage.getItem('permissions') 
      ? JSON.parse(localStorage.getItem('permissions')) 
      : []
  }),
  actions: {
    setUserInfo(userInfo) {
      this.userId = userInfo.userId
      this.role = userInfo.role
      this.realName = userInfo.realName
      this.token = userInfo.token
      this.permissions = userInfo.permissions || []

      localStorage.setItem('userId', this.userId)
      localStorage.setItem('role', this.role)
      localStorage.setItem('realName', this.realName)
      localStorage.setItem('token', this.token)
      localStorage.setItem('permissions', JSON.stringify(this.permissions))
    },
    hasPermission(perm) {
      if (this.role === 'system_admin') return true
      return this.permissions.includes(perm)
    },
    // 在userStore的actions中添加：
    hasPermission(perm) {
      // 修复：支持数组包含判断（处理可能的空格或格式问题）
      if (!perm || !this.permissions.length) return false
      return this.permissions.some(p => p.trim() === perm.trim())
    },
    clearUserInfo() {
      this.userId = null
      this.role = null
      this.realName = ''
      this.token = null
      this.permissions = []
      
      localStorage.removeItem('userId')
      localStorage.removeItem('role')
      localStorage.removeItem('realName')
      localStorage.removeItem('token')
      localStorage.removeItem('permissions')
    }
  }
})