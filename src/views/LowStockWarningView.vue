<template>
  <div class="low-stock-container">
    <el-card class="main-card">
      <template #header>
        <div class="header-content">
          <h2>低库存预警</h2>
          <!-- 红色徽章显示低库存数量（仅数字） -->
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

      <!-- 低库存物品表格（加载状态优化） -->
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElTable } from 'element-plus'
import { statisticsApi } from '@/api/statistics'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态管理（修正类型和初始值）
const lowStockItems = ref([])  // 低库存物品列表（数组）
const lowStockCount = ref(0)   // 低库存数量（数字，默认0）
const loading = ref(true)      // 加载状态
const searchKeyword = ref('')  // 搜索关键词

// 筛选后的物品列表（确保是数组）
const filteredItems = computed(() => {
  if (!Array.isArray(lowStockItems.value)) return []  // 安全校验
  if (!searchKeyword.value) return lowStockItems.value
  const keyword = searchKeyword.value.toLowerCase()
  return lowStockItems.value.filter(item => 
    (item.name || '').toLowerCase().includes(keyword) ||  // 防undefined
    (item.specification || '').toLowerCase().includes(keyword)
  )
})

// 搜索防抖处理（500ms延迟）
const handleSearch = (() => {
  let timer = null
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => { /* 由computed自动触发筛选 */ }, 500)
  }
})()

// 获取低库存数量（独立处理错误）
const fetchLowStockCount = async () => {
  try {
    const res = await statisticsApi.getLowStockCount()
    // 后端返回格式：{ code:200, data: 5 }
    if (res?.code === 200) {
      return res.data || 0  // 返回数字
    } else {
      ElMessage.warning('低库存数量获取失败')
      return 0
    }
  } catch (error) {
    console.error('数量接口错误:', error)
    return 0  // 错误时返回0
  }
}

// 获取低库存物品列表（独立处理错误）
const fetchLowStockItems = async () => {
  try {
    const res = await statisticsApi.getLowStockItems()
    // 后端返回格式：{ code:200, data: [...] }
    if (res?.code === 200) {
      return Array.isArray(res.data) ? res.data : []  // 返回数组
    } else {
      ElMessage.warning('低库存列表获取失败')
      return []
    }
  } catch (error) {
    console.error('列表接口错误:', error)
    return []  // 错误时返回空数组
  }
}

// 页面加载：获取数据（独立错误处理）
onMounted(async () => {
  try {
    loading.value = true
    // 并行请求，但单独处理每个接口错误
    const [count, items] = await Promise.all([
      fetchLowStockCount(), 
      fetchLowStockItems()
    ])
    lowStockCount.value = count  // 赋值数字
    lowStockItems.value = items  // 赋值数组
  } catch (error) {
    ElMessage.error('数据加载异常')
  } finally {
    loading.value = false
  }
})

// 跳转入库页面
const handleStockIn = (item) => {
  if (!item?.itemId) {
    ElMessage.warning('物品信息异常')
    return
  }
  router.push({
    path: '/stock-in',
    query: { itemId: item.itemId, itemName: item.name }  // 携带名称优化体验
  })
}
</script>

<style scoped>
.low-stock-container {
  padding: 20px;
  background: #f5f7fa;  /* 浅灰背景区分内容区 */
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
/* 表格加载动画优化 */
::v-deep .el-table__empty-text {
  padding: 60px 0;
}
</style>