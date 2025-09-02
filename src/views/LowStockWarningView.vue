<template>
  <div class="low-stock-container">
    <!-- 新增：返回首页按钮（左上角） -->
    <div class="back-container" style="margin-bottom: 20px;">
      <el-button 
        type="default" 
        icon="ArrowLeft" 
        @click="goToHome" 
        class="back-btn"
      >
        返回首页
      </el-button>
    </div>

    <el-card class="main-card">
      <template #header>
        <div class="header-content">
          <h2>低库存预警</h2>
          <el-badge :value="lowStockCount" type="danger" v-if="lowStockCount > 0" />
        </div>
      </template>

      <!-- 搜索框 -->
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索物品名称/规格" 
        prefix-icon="el-icon-search"
        class="search-input"
        @input="handleSearch"  
      />

      <!-- 低库存物品表格 -->
      <el-table 
        v-loading="loading" 
        :data="filteredItems" 
        border 
        stripe 
        style="width: 100%; margin-top: 20px"
        empty-text="暂无低库存物品"  
      >
        <el-table-column prop="itemId" label="物品ID" width="80" />
        <el-table-column prop="name" label="物品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="stockQuantity" label="当前库存" />
        <el-table-column prop="minStock" label="最低库存阈值" />
        <el-table-column prop="location" label="存放位置" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleStockIn(scope.row)"
            >
              立即入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
// 仅新增返回首页相关代码，其余逻辑完全保留
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'  // 新增：导入返回图标
import { statisticsApi } from '@/api/statistics'
import { useRouter } from 'vue-router'

const router = useRouter()

// 原有状态管理完全保留
const lowStockItems = ref([])
const lowStockCount = ref(0)
const loading = ref(true)
const searchKeyword = ref('')

// 原有计算属性、方法完全保留
const filteredItems = computed(() => {
  if (!Array.isArray(lowStockItems.value)) return []
  if (!searchKeyword.value) return lowStockItems.value
  const keyword = searchKeyword.value.toLowerCase()
  return lowStockItems.value.filter(item => 
    (item.name || '').toLowerCase().includes(keyword) || 
    (item.specification || '').toLowerCase().includes(keyword)
  )
})

const handleSearch = (() => {
  let timer = null
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {}, 500)
  }
})()

const fetchLowStockCount = async () => {
  try {
    const res = await statisticsApi.getLowStockCount()
    return res?.code === 200 ? res.data || 0 : 0
  } catch (error) {
    console.error('数量接口错误:', error)
    return 0
  }
}

const fetchLowStockItems = async () => {
  try {
    const res = await statisticsApi.getLowStockItems()
    return res?.code === 200 && Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('列表接口错误:', error)
    return []
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [count, items] = await Promise.all([
      fetchLowStockCount(), 
      fetchLowStockItems()
    ])
    lowStockCount.value = count
    lowStockItems.value = items
  } catch (error) {
    ElMessage.error('数据加载异常')
  } finally {
    loading.value = false
  }
})

const handleStockIn = (item) => {
  if (!item?.itemId) {
    ElMessage.warning('物品信息异常')
    return
  }
  router.push({
    path: '/stock-in',
    query: { itemId: item.itemId, itemName: item.name }
  })
}

// 新增：返回首页方法
const goToHome = () => {
  router.push('/home')  // 跳转到首页路由（请根据实际路由调整）
}
</script>

<style scoped>
/* 仅新增返回按钮样式，原有样式完全保留 */
.back-container {
  margin-bottom: 20px;  /* 按钮与卡片间距 */
}

.back-btn {
  background-color: #e6f4ff;  /* 浅蓝背景，与入库/出库管理按钮统一 */
}

/* 原有样式完全保留 */
.low-stock-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}
.main-card {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-input {
  width: 300px;
  margin-top: 10px;
}
::v-deep .el-table__empty-text {
  padding: 60px 0;
}
</style>