<template>
  <div class="low-stock-container">
    <!-- 头部区域 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          type="default"
          icon="ArrowLeft"
          @click="handleBack"
          class="back-button"
        >
          返回首页
        </el-button>
        <h2 class="page-title">低库存预警</h2>
      </div>
      <div class="header-right">
        <el-badge :value="lowStockCount" :max="99" class="badge" />
      </div>
    </div>

    <!-- 筛选选项卡 -->
    <el-tabs v-model="activeTab" @tab-change="loadData">
      <el-tab-pane label="当前预警" name="active" />
      <el-tab-pane label="已忽略" name="ignored" />
    </el-tabs>

    <!-- 搜索区域 -->
    <el-card class="search-card" v-if="activeTab === 'active'">
      <el-input
        v-model="searchKeyword"
        placeholder="输入名称/规格搜索"
        clearable
        @keyup.enter="loadData"
        class="search-input"
      >
        <template #append>
          <el-button type="primary" @click="loadData" class="search-btn">搜索</el-button>
        </template>
      </el-input>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card">
      <el-table
        :data="activeTab === 'active' ? filteredItems : ignoredItems"
        border
        stripe
        v-loading="loading"
        :empty-text="loading ? '加载中...' : activeTab === 'active' ? '暂无低库存物品' : '暂无被忽略物品'"
      >
        <el-table-column prop="itemId" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="specification" label="规格" width="150" />
        <el-table-column
          prop="stockQuantity"
          label="当前库存"
          width="100"
          align="center"
          :cell-style="(row) => ({
            color: row.row.stockQuantity <= (row.row.minStock || 1) ? 'red' : '',
            'font-weight': row.row.stockQuantity <= (row.row.minStock || 1) ? 'bold' : ''
          })"
        />
        <el-table-column
          prop="minStock"
          label="预警阈值"
          width="100"
          align="center"
        />
        <el-table-column prop="location" label="位置" width="150" />
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleStockIn(scope.row)"
            >
              立即入库
            </el-button>
            <el-button 
              v-if="activeTab === 'active'"
              type="warning" 
              size="small" 
              @click="handleIgnore(scope.row.itemId)"
            >
              忽略预警
            </el-button>
            <el-button 
              v-else
              type="success" 
              size="small" 
              @click="handleRestore(scope.row.itemId)"
            >
              恢复预警
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { statisticsApi } from '@/api/statistics'
import { lowStockApi } from '@/api/lowStockApi'

const router = useRouter()

// 表格数据
const activeTab = ref('active')
const lowStockItems = ref([])
const ignoredItems = ref([])
const lowStockCount = ref(0)
const loading = ref(false)
const searchKeyword = ref('')

// 过滤后的数据
const filteredItems = computed(() => {
  if (!searchKeyword.value) return lowStockItems.value
  const keyword = searchKeyword.value.toLowerCase()
  return lowStockItems.value.filter(item => 
    (item.name || '').toLowerCase().includes(keyword) || 
    (item.specification || '').toLowerCase().includes(keyword)
  )
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'active') {
      // 获取低库存物品列表
      const itemsRes = await lowStockApi.getLowStockItems()
      lowStockItems.value = itemsRes.data || []
      
      // 获取低库存数量
      const countRes = await statisticsApi.getLowStockCount()
      lowStockCount.value = countRes.data || 0
    } else {
      // 获取被忽略物品列表
      const res = await lowStockApi.getIgnoredItems()
      ignoredItems.value = res.data || []
    }
  } catch (e) {
    ElMessage.error(`加载失败: ${e.message}`)
  } finally {
    loading.value = false
  }
}

// 立即入库
const handleStockIn = (item) => {
  router.push({
    path: '/stock-in',
    query: {
      itemId: item.itemId,
      itemName: item.name,
      specification: item.specification
    }
  })
}

// 忽略预警
const handleIgnore = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定忽略该物品的预警吗？', '确认操作', {
      type: 'warning'
    })
    
    const res = await lowStockApi.ignoreWarning(itemId)
    
    if (res.code === 200) {
      ElMessage.success('已忽略该物品预警')
      loadData() // 刷新列表
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(`操作失败: ${e.message}`)
    }
  }
}

// 恢复预警
const handleRestore = async (itemId) => {
  try {
    await ElMessageBox.confirm('确定恢复该物品的预警吗？', '确认操作', {
      type: 'warning'
    })
    
    // 假设恢复阈值为10，可以根据实际情况调整
    const res = await lowStockApi.setWarningThreshold(itemId, 10)
    
    if (res.code === 200) {
      ElMessage.success('已恢复该物品预警')
      loadData() // 刷新列表
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(`操作失败: ${e.message}`)
    }
  }
}

// 返回首页
const handleBack = () => {
  router.push('/home')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.low-stock-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
}

.back-button {
  background-color: #f0f2f5;
  color: #409eff;
  border: none;
  padding: 6px 12px;
}

.back-button:hover {
  background-color: #e6f4ff;
}

.page-title {
  margin: 0;
  color: #1d2129;
  font-size: 20px;
}

.badge {
  margin-left: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border-radius: 4px;
  overflow: hidden;
}

.el-table {
  border-radius: 4px 4px 0 0;
}

.el-table__header th {
  background-color: #f5f7fa !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-right {
    align-self: flex-end;
    margin-top: 12px;
  }
}
</style>