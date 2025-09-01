<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="aside-container">
        <div class="logo">仓库管理系统</div>
        <el-menu 
          default-active="1" 
          class="el-menu-vertical-demo"
          @select="handleMenuSelect"
        >
          <el-menu-item 
            v-for="menu in filteredMenus" 
            :key="menu.path"
            :index="menu.path"
          >
            <component :is="menu.icon" class="menu-icon" />
            <span>{{ menu.label }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header-container">
          <div class="user-info">
            <span>{{ userStore.realName || '用户' }}</span>
            <el-dropdown @command="handleDropdownCommand">
              <el-button icon="User" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 页面内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'  // 导入路径
import { 
  Home, 
  Box, 
  Warning, 
  User, 
  List as ListIcon
} from '@element-plus/icons-vue'

// 获取用户store
const userStore = useUserStore()
const router = useRouter()

// 所有菜单定义
const allMenus = ref([
  { path: '/home', label: '首页', icon: Home, perm: 'home' },
  { path: '/items', label: '物品管理', icon: Box, perm: 'item_management' },
  { path: '/low-stock', label: '低库存预警', icon: Warning, perm: 'low_stock_warning' },
  { path: '/user-management', label: '用户管理', icon: User, perm: 'user_management' },
  { path: '/inbound', label: '入库管理', icon: ListIcon, perm: 'inbound_management' },
  { path: '/outbound', label: '出库管理', icon: ListIcon, perm: 'outbound_management' }
])

// 根据权限过滤菜单
const filteredMenus = computed(() => {
  return allMenus.value.filter(menu => {
    // 使用你的hasPermission方法检查权限
    return userStore.hasPermission(menu.perm)
  })
})

// 菜单选择处理
const handleMenuSelect = (path) => {
  router.push(path)
}

// 下拉菜单命令处理
const handleDropdownCommand = (command) => {
  if (command === 'logout') {
    userStore.clearUserInfo()
    router.push('/login')
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.aside-container {
  background-color: #001529;
  color: #fff;
}

.logo {
  text-align: center;
  padding: 20px 0;
  font-size: 18px;
  background-color: #1890ff;
}

.el-menu-vertical-demo {
  background-color: #001529;
  border-right: none;
}

.el-menu-item {
  color: rgba(255, 255, 255, 0.7);
}

.el-menu-item.is-active {
  color: #409eff;
  background-color: #1890ff1a;
}

.menu-icon {
  margin-right: 10px;
}

.header-container {
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.main-content {
  padding: 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>
    