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
    /**
     * 判断是否拥有指定权限（支持大小写不敏感匹配）
     * @param {string} perm - 权限标识
     * @returns {boolean}
     */
    hasPermission(perm) {
      if (this.role === 'system_admin') return true
      if (!perm || !this.permissions.length) return false
      
      const targetPerm = perm.toLowerCase()
      return this.permissions.some(p => p.toLowerCase() === targetPerm)
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