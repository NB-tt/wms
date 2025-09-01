import { hasPerm } from '@/utils/permission'

/**
 * 自定义指令：v-perm → 控制元素显示/隐藏
 * 使用示例：<el-button v-perm="'stock_out_submit'">提交出库</el-button>
 */
export const permDirective = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  // 当组件更新时重新检查权限
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

// 权限检查逻辑封装
function checkPermission(el, binding) {
  const requiredPerm = binding.value
  // 无权限则移除DOM元素
  if (requiredPerm && !hasPerm(requiredPerm)) {
    // 先隐藏元素，避免闪烁
    el.style.display = 'none'
    // 延迟移除，确保DOM已渲染
    setTimeout(() => {
      el.parentNode?.removeChild(el)
    }, 0)
  } else {
    // 有权限则显示元素
    el.style.display = ''
  }
}