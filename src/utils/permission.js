// src/utils/permission.js
import { useUserStore } from '@/stores/user'

/**
 * 判断用户是否拥有指定权限
 * @param {string} perm - 权限标识（如 'user_manage'）
 * @returns {boolean} - 是否拥有权限
 */
export const hasPerm = (perm) => {
  try {
    const userStore = useUserStore()
    // 系统管理员拥有所有权限（修复：确保角色判断正确）
    if (userStore.role === 'system_admin') {
      return true
    }
    // 普通用户检查权限列表
    return userStore.permissions && userStore.permissions.includes(perm)
  } catch (error) {
    console.error('权限判断失败：', error)
    return false
  }
}