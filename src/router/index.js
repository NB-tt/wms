import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { hasToken: false, requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { hasToken: true, requiresAuth: true }
  },
  {
    path: '/item',
    name: 'ItemManagement',
    component: () => import('@/views/ItemManagement.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'item_manage' }
  },
  {
    path: '/stock-in',
    name: 'StockIn',
    component: () => import('@/views/StockInView.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_in' }
  },
  {
    path: '/stock-in/records',
    name: 'StockInRecords',
    component: () => import('@/views/StockInRecords.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_in' }
  },
  {
    path: '/stock-out',
    name: 'StockOut',
    component: () => import('@/views/StockOutView.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_out' }
  },
  {
    path: '/stock-out/records',
    name: 'StockOutRecords',
    component: () => import('@/views/StockOutRecords.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_out' }
  },
  // 低库存预警
  {
    path: '/low-stock',
    name: 'LowStockWarning',
    component: () => import('@/views/LowStockWarningView.vue'),
    meta: {
      hasToken: true,
      requiresAuth: true,
      targetPerm: 'low_stock'  // 对应权限标识
    }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('@/views/UserManagement.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'user_manage' }
  },
  {
    path: '/report-statistics',
    name: 'ReportStatistics',
    component: () => import('@/views/ReportStatistics.vue'),
    meta: {
      hasToken: true,
      requiresAuth: true,
      targetPerm: 'report_statistics' // 权限标识，和前端 v-if="hasPerm('report_statistics')" 对应
    }
  },
  {
    path: '/Stock-taking',
    name: 'Stocktaking',
    component: () => import('@/views/Stocktaking.vue'),
    meta: {
      hasToken: true,
      requiresAuth: true,
      targetPerm: 'Stock_taking' // 权限标识，和前端 v-if="hasPerm('report_statistics')" 对应
    }
  },
  {
    path: '/executor-Stocktaking',
    name: 'executorStocktaking.',
    component: () => import('@/views/executorStocktaking.vue'),
    meta: {
      hasToken: true,
      requiresAuth: true,
      targetPerm: 'executor_Stocktaking' // 权限标识，和前端 v-if="hasPerm('report_statistics')" 对应
    }
  },
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const hasToken = !!userStore.token
  const { requiresAuth, targetPerm } = to.meta

  console.log('路由守卫调试:', {
    path: to.path,
    hasToken,
    requiresAuth,
    targetPerm,
    userRole: userStore.role,
    userPermissions: userStore.permissions
  })

  // 1. 不需要认证的页面（如登录页）
  if (!requiresAuth) {
    if (hasToken && to.path === '/login') {
      next('/home')  // 已登录用户访问登录页 → 跳首页
    } else {
      next()  // 未登录用户正常访问登录页
    }
    return
  }

  // 2. 需要认证但未登录 → 跳登录页
  if (!hasToken) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }

  // 3. 系统管理员直接放行（无需检查权限）
  if (userStore.role === 'system_admin') {
    next()
    return
  }

  // 4. 非管理员权限检查（核心修复）
  if (targetPerm && !userStore.hasPermission(targetPerm)) {
    ElMessage.error('没有访问权限，请联系管理员')
    next(false)  // 禁止跳转，留在当前页（首页）
    return
  }

  // 5. 所有检查通过 → 放行
  next()
})

export default router
