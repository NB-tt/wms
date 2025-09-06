import { useUserStore } from '@/stores/user'

/**
 * 判断用户是否拥有指定权限（支持大小写不敏感匹配）
 * @param {string} perm - 权限标识（如 'stock_taking'）
 * @returns {boolean} - 是否拥有权限
 */
export const hasPerm = (perm) => {
  try {
    const userStore = useUserStore()
    if (userStore.role === 'system_admin') return true
    if (!perm || !userStore.permissions?.length) return false
    
    // 统一转为小写比较，避免大小写问题
    const targetPerm = perm.toLowerCase()
    return userStore.permissions.some(p => p.toLowerCase() === targetPerm)
  } catch (error) {
    console.error('权限判断失败：', error)
    return false
  }
}