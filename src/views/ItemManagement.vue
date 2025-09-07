<template>
  <div class="item-management-container">
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
        <h2 class="page-title">物品管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd" class="add-button">
          <el-icon><Plus /></el-icon> 新增物品
        </el-button>
        <el-button type="success" @click="showAddCategoryDialog" class="add-category-button">
          <el-icon><FolderAdd /></el-icon> 新增分类
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
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

    <!-- 表格区域 -->
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

      <!-- 分页区域 -->
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

    <!-- 新增/编辑物品弹窗 -->
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

    <!-- 分类弹窗（含删除功能） -->
    <el-dialog v-model="categoryDialogVisible" title="新增分类" width="800px">
      <div class="category-dialog-content">
       
        <div class="existing-categories">
          <h4>已有分类</h4>
          <el-table 
            :data="itemTypeList" 
            height="300"
            border
            size="small"
            :cell-style="{ padding: '8px' }"
            @row-click="handleCategoryRowClick"
          >
            <el-table-column prop="typeName" label="分类名称" />
            <el-table-column prop="sortNum" label="排序" width="80" align="center" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="scope">
                <el-button 
                  type="danger" 
                  size="small" 
                  icon="Delete" 
                  @click.stop="handleDeleteCategory(scope.row.typeId, scope.row.typeName)"
                  class="category-delete-btn"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 右侧：新增分类表单 -->
        <div class="add-category-form">
          <el-form ref="categoryForm" :model="categoryForm" :rules="categoryFormRules" label-width="100px">
            <el-form-item label="分类名称" prop="typeName">
              <el-input 
                v-model="categoryForm.typeName" 
                placeholder="请输入分类名称"
                @input="checkCategoryExists"
              />
              <div v-if="categoryExists" class="error-tip">
                <el-icon><Warning /></el-icon> 该分类已存在
              </div>
            </el-form-item>
            <el-form-item label="排序序号" prop="sortNum">
              <el-input-number 
                v-model="categoryForm.sortNum" 
                :min="0" 
                :step="1" 
                placeholder="请输入排序号"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleAddCategory"
          :disabled="categoryExists"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, FolderAdd, Warning, Delete } from '@element-plus/icons-vue'
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

// 分类弹窗相关
const categoryDialogVisible = ref(false)
const categoryForm = ref({
  typeName: '',
  sortNum: null  // 初始为空，强制用户手动输入
})
const categoryExists = ref(false)
const categoryFormRules = reactive({
  typeName: [
    { required: true, message: '分类名称不能为空', trigger: 'blur' },
    { max: 20, message: '分类名称不能超过20个字符', trigger: 'blur' }
  ],
  sortNum: [
    { required: true, message: '排序号不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '排序号不能为负数', trigger: 'change' }
  ]
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
 * 返回首页
 */
const handleBack = () => {
  window.location.href = '/home'
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

 // 删除物品
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

// 显示新增分类对话框
const showAddCategoryDialog = () => {
  categoryForm.value = {
    typeName: '',
    sortNum: null  // 排序号初始为空，强制手动输入
  }
  categoryExists.value = false
  categoryDialogVisible.value = true
  setTimeout(() => {
    proxy.$refs.categoryForm?.clearValidate()
    // 自动聚焦到分类名称输入框
    const inputElement = document.querySelector('.add-category-form .el-input__inner')
    inputElement?.focus()
  }, 0)
}

  // 检查分类是否已存在
const checkCategoryExists = () => {
  // 强制触发视图更新
  categoryForm.value = { ...categoryForm.value }
  
  const name = categoryForm.value.typeName.trim()
  if (!name) {
    categoryExists.value = false
    return
  }
  categoryExists.value = itemTypeList.value.some(
    item => item.typeName.toLowerCase() === name.toLowerCase()
  )
}

// 新增分类
const handleAddCategory = async () => {
  if (categoryExists.value) return
  
  const valid = await proxy.$refs.categoryForm.validate()
  if (!valid) return

  try {
    await request.post('/item-types', {
      typeName: categoryForm.value.typeName,
      sortNum: categoryForm.value.sortNum
    })
    ElMessage.success('分类添加成功')
    categoryDialogVisible.value = false
    await loadItemTypes() // 重新加载分类列表
  } catch (e) {
    ElMessage.error(`添加分类失败：${e.message}`)
  }
}

// 删除分类
const handleDeleteCategory = async (typeId, typeName) => {
  try {
    // 1. 确认删除
    await ElMessageBox.confirm(
      `确定删除分类【${typeName}】吗？删除前请确保该分类下没有物品关联`,
      '危险操作',
      {
        type: 'danger',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    // 2. 检查是否有关联物品
    const res = await request.get('/items/count-by-type', {
      params: { typeId }
    })

    if (res.data > 0) {
      ElMessageBox.alert(
        `无法删除【${typeName}】，该分类下仍有 ${res.data} 个物品，请先修改这些物品的分类或删除物品`,
        '删除失败',
        { type: 'error' }
      )
      return
    }

    // 3. 执行删除
    await request.delete(`/item-types/${typeId}`)
    ElMessage.success(`分类【${typeName}】已成功删除`)
    
    // 4. 刷新分类列表
    await loadItemTypes()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(`删除失败：${e.message || '网络错误'}`)
    }
  }
}

// 防止表格行点击事件与删除按钮事件冲突
const handleCategoryRowClick = () => {
  // 空函数，用于接收表格行点击事件，避免冒泡影响
}
</script>

<style scoped>
/* 全局容器样式 */
.item-management-container { 
  padding: 20px; 
  background: #f5f7fa; 
  min-height: calc(100vh - 60px); 
}

/* 头部样式 */
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
  gap: 12px;
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

/* 按钮样式 */
.add-button {
  background-color: #409eff;
  border-color: #409eff;
}
.add-category-button {
  background-color: #67c23a;
  border-color: #67c23a;
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

/* 操作按钮样式*/
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

/* 分类弹窗样式 */
.category-dialog-content {
  display: flex;
  gap: 20px;
}

.existing-categories {
  flex: 1;
  border-right: 1px solid #eee;
  padding-right: 20px;
}

.existing-categories h4 {
  margin: 0 0 15px 0;
  color: #666;
}

.add-category-form {
  flex: 1;
  padding-left: 20px;
}

.error-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
}

.error-tip .el-icon {
  margin-right: 5px;
}

/* 分类删除按钮样式 */
.category-delete-btn {
  color: #f56c6c;
  background: transparent;
  border: none;
  padding: 4px;
}
.category-delete-btn:hover {
  background-color: #fff1f0;
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
  .category-dialog-content {
    flex-direction: column;
  }
  .existing-categories {
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-right: 0;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .add-category-form {
    padding-left: 0;
  }
}
</style>