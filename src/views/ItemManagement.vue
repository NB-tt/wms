<template>
  <div class="item-management-container">
    <!-- 头部区域（新增返回按钮 + 优化布局） -->
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
        <h2 class="page-title">物品管理</h2>
      </div>
      <el-button type="primary" @click="handleAdd" class="add-button">
        <el-icon><Plus /></el-icon> 新增物品
      </el-button>
    </div>

    <!-- 搜索区域（美化输入框样式） -->
    <el-card class="search-card">
      <el-input
        v-model="searchKeyword"
        placeholder="输入名称/规格搜索"
        clearable
        @keyup.enter="loadItemList"
        class="search-input"
      >
        <template #append>
          <el-button type="primary" @click="loadItemList" class="search-btn">搜索</el-button>
        </template>
      </el-input>
    </el-card>

    <!-- 表格区域（优化样式和交互） -->
    <el-card class="table-card">
      <el-table 
        :data="itemList" 
        border 
        stripe 
        v-loading="loading"
        :empty-text="loading ? '加载中...' : '暂无数据'"
        :cell-style="{ 'font-size': '14px' }"
        :header-cell-style="{ 'font-weight': 'bold', 'background-color': '#f5f7fa' }"
      >
        <el-table-column prop="itemId" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="specification" label="规格" width="150" />
        <el-table-column 
          prop="typeId" 
          label="分类" 
          width="120" 
          :formatter="formatCategory" 
        />
        <el-table-column 
          prop="unitPrice" 
          label="单价" 
          width="100" 
          align="right" 
          :formatter="(row) => `${row.unitPrice} 元`" 
        />
        <el-table-column 
          prop="stockQuantity" 
          label="库存" 
          width="100" 
          align="center" 
          :cell-style="(row) => row.row.stockQuantity <= row.row.minStock && { color: 'red', 'font-weight': 'bold' }" 
        />
        <el-table-column 
          prop="minStock" 
          label="低库存阈值" 
          width="120" 
          align="center" 
        />
        <el-table-column 
          prop="supplierId" 
          label="供应商" 
          width="180" 
          :formatter="formatSupplier" 
        />
        <el-table-column prop="location" label="位置" width="150" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)" class="edit-btn">编辑</el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row.itemId)" 
              class="delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域（美化样式） -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageNum"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          class="pagination-component"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗（保持原有逻辑） -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="itemForm" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物品名称" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="分类" prop="typeId">
          <el-select v-model="form.typeId" placeholder="选择分类">
            <el-option 
              v-for="type in itemTypeList" 
              :key="type.typeId" 
              :label="type.typeName" 
              :value="type.typeId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input v-model.number="form.unitPrice" type="number" min="0" step="0.01" placeholder="请输入单价" />
        </el-form-item>
        <el-form-item label="低库存阈值" prop="minStock">
          <el-input v-model.number="form.minStock" type="number" min="0" placeholder="请输入阈值" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="选择供应商" clearable>
            <el-option 
              v-for="supplier in supplierList" 
              :key="supplier.supplierId" 
              :label="supplier.name" 
              :value="supplier.supplierId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入位置" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'  // 导入返回图标
import request from '@/utils/request'

// 组件实例（用于访问ref）
const { proxy } = getCurrentInstance()

// 表格数据与分页
const itemList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const loading = ref(false)

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增物品')
const form = ref({
  itemId: null,
  name: '',
  specification: '',
  typeId: null,
  unitPrice: 0,
  minStock: 0,
  supplierId: null,
  location: ''
})

// 关联数据（分类、供应商）
const itemTypeList = ref([])
const supplierList = ref([])

// 表单校验规则
const formRules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  specification: [{ required: true, message: '规格不能为空', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unitPrice: [
    { required: true, message: '单价不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '单价不能为负数', trigger: 'change' }
  ],
  minStock: [
    { required: true, message: '阈值不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '阈值不能为负数', trigger: 'change' }
  ],
  location: [{ required: true, message: '位置不能为空', trigger: 'blur' }]
})

// 页面初始化
onMounted(async () => {
  await Promise.all([
    loadItemList(),
    loadItemTypes(),
    loadSuppliers()
  ])
})

/**
 * 返回首页（新增方法）
 */
const handleBack = () => {
  window.location.href = '/home'  // 跳转到首页路由，根据实际路由调整
  // 如果是SPA应用，使用路由跳转：this.$router.push('/home')
}

/**
 * 加载物品列表
 */
const loadItemList = async () => {
  loading.value = true
  try {
    const res = await request.get('/items', {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value
      }
    })
    itemList.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (e) {
    itemList.value = []
    total.value = 0
    ElMessage.error(`加载失败：${e.message || '网络错误'}`)
  } finally {
    loading.value = false
  }
}

/**
 * 加载分类列表
 */
const loadItemTypes = async () => {
  try {
    const res = await request.get('/item-types')
    itemTypeList.value = res.data || []
  } catch (e) {
    ElMessage.error(`加载分类失败：${e.message}`)
  }
}

/**
 * 加载供应商列表
 */
const loadSuppliers = async () => {
  try {
    const res = await request.get('/suppliers')
    supplierList.value = res.data || []
  } catch (e) {
    ElMessage.error(`加载供应商失败：${e.message}`)
  }
}

/**
 * 格式化分类名称
 */
const formatCategory = (row) => {
  const type = itemTypeList.value.find(t => t.typeId === row.typeId)
  return type ? type.typeName : '未知分类'
}

/**
 * 格式化供应商名称
 */
const formatSupplier = (row) => {
  if (!row.supplierId) return '无'
  const supplier = supplierList.value.find(s => s.supplierId === row.supplierId)
  return supplier ? supplier.name : '未知供应商'
}

/**
 * 分页事件
 */
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNum.value = 1
  loadItemList()
}
const handleCurrentChange = (val) => {
  pageNum.value = val
  loadItemList()
}

/**
 * 新增物品
 */
const handleAdd = () => {
  dialogTitle.value = '新增物品'
  form.value = { 
    itemId: null, name: '', specification: '', typeId: null, 
    unitPrice: 0, minStock: 0, supplierId: null, location: '' 
  }
  dialogVisible.value = true
  setTimeout(() => proxy.$refs.itemForm?.clearValidate(), 0)
}

/**
 * 编辑物品
 */
const handleEdit = (row) => {
  dialogTitle.value = '编辑物品'
  form.value = { ...row }
  dialogVisible.value = true
  setTimeout(() => proxy.$refs.itemForm?.clearValidate(), 0)
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  const valid = await proxy.$refs.itemForm.validate()
  if (!valid) return

  try {
    if (!form.value.itemId) {
      await request.post('/items', form.value)
      ElMessage.success('新增成功')
    } else {
      await request.put('/items', form.value)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    loadItemList()
  } catch (e) {
    ElMessage.error(`操作失败：${e.message}`)
  }
}

/**
 * 删除物品
 */
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该物品？删除后不可恢复', '确认删除', {
      type: 'warning'
    })
    await request.delete(`/items/${id}`)
    ElMessage.success('删除成功')
    loadItemList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(`删除失败：${e.message}`)
  }
}
</script>

<style scoped>
/* 全局容器样式 */
.item-management-container { 
  padding: 20px; 
  background: #f5f7fa; 
  min-height: calc(100vh - 60px); 
}

/* 头部样式（含返回按钮） */
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

/* 搜索框样式 */
.search-card { 
  margin-bottom: 20px; 
  padding: 16px; 
  background: white; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); 
}
.search-input { 
  width: 100%; 
  max-width: 800px; 
}
.search-btn { 
  min-width: 80px; 
}

/* 表格样式 */
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

/* 分页样式 */
.pagination { 
  margin-top: 16px; 
  text-align: right; 
  padding: 12px 16px; 
  background-color: #f9fafb; 
  border-top: 1px solid #eee; 
}

/* 操作按钮样式优化 */
.edit-btn { 
  margin-right: 8px; 
}
.delete-btn { 
  background-color: #f56c6c; 
  border-color: #f56c6c; 
}
.delete-btn:hover { 
  background-color: #f78989; 
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header { 
    flex-direction: column; 
    align-items: flex-start; 
    gap: 12px; 
  }
  .add-button { 
    align-self: flex-end; 
  }
}
</style>