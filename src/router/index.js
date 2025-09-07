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
  {
    path: '/low-stock',
    name: 'LowStockWarning',
    component: () => import('@/views/LowStockWarningView.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'low_stock' }
  },
   // 供应商管理
  {
    path: '/supplier',
    name: 'SupplierManagement',
    component: () => import('@/views/SupplierManagement.vue'), 
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'supplier_manage' } 
  },
  {
    path: '/stock-in',
    name: 'StockIn',
    component: () => import('@/views/StockInView.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_in' }
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
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'report_statistics' }
  },
  // 盘点任务发起人（统一小写权限标识）
  {
    path: '/stock-taking',
    name: 'Stocktaking',
    component: () => import('@/views/Stocktaking.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'stock_taking' }
  },
  // 盘点任务执行人（名称拼写+统一小写权限标识）
  {
    path: '/executor-stocktaking',
    name: 'ExecutorStocktaking',
    component: () => import('@/views/executorStocktaking.vue'),
    meta: { hasToken: true, requiresAuth: true, targetPerm: 'executor_stocktaking' }
  },
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
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

  if (!requiresAuth) {
    hasToken && to.path === '/login' ? next('/home') : next()
    return
  }

  if (!hasToken) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }

  if (userStore.role === 'system_admin') {
    next()
    return
  }

  if (targetPerm && !userStore.hasPermission(targetPerm)) {
    ElMessage.error('没有访问权限，请联系管理员')
    next(false)
    return
  }

  next()
})

export default router