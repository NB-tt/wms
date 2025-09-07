<template>
  <div class="home-container">
    <!-- 页面头部区域 -->
    <header class="page-header">
      <h1 class="page-title">办公用品仓库管理系统</h1>
      <div class="user-info">
        <span>欢迎回来，{{ currentUser.realName || '未知用户' }}</span>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- 统计卡片区域 -->
    <section class="stats-container">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">物品总数</div>
          <div class="stat-number">{{ itemCount }}</div>
          <div class="stat-info">系统中所有物品的数量</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">今日入库</div>
          <div class="stat-number">{{ todayStockIn }}</div>
          <div class="stat-info">今日完成入库的物品数量</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">今日出库</div>
          <div class="stat-number">{{ todayStockOut }}</div>
          <div class="stat-info">今日完成出库的物品数量</div>
        </div>

        <div class="stat-item">
          <div class="stat-label">低库存预警</div>
          <div class="stat-number">{{ lowStockCount }}</div>
          <div class="stat-info">库存低于预警阈值的物品数量</div>
        </div>
      </div>
    </section>

    <!-- 功能入口卡片 -->
    <section class="function-cards-container">
      <h2>功能入口</h2>
      <div class="function-cards">
        <el-card v-if="hasPerm('item_manage')" class="function-card" @click="$router.push('/item')">
          <div class="card-content">
            <el-icon :size="36"><Box /></el-icon>
            <div class="card-text">
              <h3>物品管理</h3>
              <p>管理办公用品的分类、信息和库存</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('supplier_manage')" class="function-card" @click="$router.push('/supplier')">
          <div class="card-content">
            <el-icon :size="36"><Shop /></el-icon>
            <div class="card-text">
              <h3>供应商管理</h3>
              <p>管理办公用品的供应商信息</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('stock_in')" class="function-card" @click="$router.push('/stock-in')">
          <div class="card-content">
            <el-icon :size="36"><ArrowDown /></el-icon>
            <div class="card-text">
              <h3>入库管理</h3>
              <p>记录办公用品的采购入库信息</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('stock_out')" class="function-card" @click="$router.push('/stock-out')">
          <div class="card-content">
            <el-icon :size="36"><ArrowUp /></el-icon>
            <div class="card-text">
              <h3>出库管理</h3>
              <p>处理办公用品的领用出库申请</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('low_stock')" class="function-card" @click="$router.push('/low-stock')">
          <div class="card-content">
            <el-icon :size="36"><Warning /></el-icon>
            <div class="card-text">
              <h3>低库存预警</h3>
              <p>查看库存不足的办公用品</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('user_manage')" class="function-card" @click="$router.push('/user-management')">
          <div class="card-content">
            <el-icon :size="36"><User /></el-icon>
            <div class="card-text">
              <h3>用户管理</h3>
              <p>管理系统用户、角色和权限</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('report_statistics')" class="function-card" @click="$router.push('/report-statistics')">
          <div class="card-content">
            <el-icon :size="36"><Printer /></el-icon>
            <div class="card-text">
              <h3>报表统计</h3>
              <p>导出出入库的报表</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('Stock_taking')" class="function-card" @click="$router.push('/Stock-taking')">
          <div class="card-content">
            <el-icon :size="36"><DocumentAdd /></el-icon>
            <div class="card-text">
              <h3>库存盘点</h3>
              <p>核算库存</p>
            </div>
          </div>
        </el-card>

        <el-card v-if="hasPerm('executor_Stocktaking')" class="function-card" @click="$router.push('/executor-Stocktaking')">
          <div class="card-content">
            <el-icon :size="36"><Document /></el-icon>
            <div class="card-text">
              <h3>库存盘点任务</h3>
              <p>执行人执行库存盘点任务</p>
            </div>
          </div>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { statisticsApi } from '@/api/statistics'
import { ElMessage, ElMessageBox } from 'element-plus'
import { hasPerm } from '@/utils/permission'
// 引入Shop图标（商店图标，用于供应商卡片）
import { Box, ArrowDown, ArrowUp, Warning, User, Shop } from '@element-plus/icons-vue'

const router = useRouter()
const currentUser = ref({ realName: '' })  // 当前用户信息

// 统计数据变量
const itemCount = ref('加载中...')
const todayStockIn = ref('加载中...')
const todayStockOut = ref('加载中...')
const lowStockCount = ref('加载中...')

// 页面加载时获取用户信息和统计数据
onMounted(async () => {
  try {
    // 1. 读取用户信息
    const storedUser = localStorage.getItem('userInfo')
    currentUser.value = storedUser ? JSON.parse(storedUser) : { realName: '未知用户' }

    // 2. 获取统计数据
    const timestamp = new Date().getTime()
    const [itemTotalRes, todayInRes, todayOutRes, lowStockRes] = await Promise.all([
      statisticsApi.getItemTotal({ _t: timestamp }),
      statisticsApi.getTodayStockIn({ _t: timestamp }),
      statisticsApi.getTodayStockOut({ _t: timestamp }),
      statisticsApi.getLowStockCount({ _t: timestamp })
    ])

    itemCount.value = extractData(itemTotalRes)
    todayStockIn.value = extractData(todayInRes)
    todayStockOut.value = extractData(todayOutRes)
    lowStockCount.value = extractData(lowStockRes)
  } catch (error) {
    console.error('页面初始化失败:', error)
    ElMessage.error('数据加载异常，请刷新页面重试')
    itemCount.value = '0'
    todayStockIn.value = '0'
    todayStockOut.value = '0'
    lowStockCount.value = '0'
  }
})

// 数据提取函数
const extractData = (response) => {
  if (typeof response === 'object' && response.data !== undefined) {
    return response.data.toString() || '0'
  }
  if (typeof response === 'string') {
    try {
      const parsed = JSON.parse(response)
      return parsed.data !== undefined ? parsed.data.toString() : response
    } catch  {
      return response
    }
  }
  return response.toString() || '0'
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userInfo')

    router.push('/login').then(() => {
      window.location.reload()
    })

    ElMessage.success('已成功退出登录')
  } catch  {
    return
  }
}
</script>

<style scoped>

.home-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.page-title {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.logout-btn:hover {
  background-color: #f0f0f0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-label {
  color: #666;
  margin-bottom: 10px;
}

.stat-number {
  color: #165DFF;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-info {
  color: #999;
  font-size: 14px;
}

.function-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.function-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.function-card:hover {
  transform: translateY(-5px);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.card-text h3 {
  margin: 0 0 5px 0;
}

.card-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid, .function-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .stats-grid, .function-cards {
    grid-template-columns: 1fr;
  }
}
</style>