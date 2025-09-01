<template>
  <div class="item-management-container">
    <!-- 头部与搜索 -->
    <div class="page-header">
      <h2>物品管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增物品
      </el-button>
    </div>

    <el-card class="search-card">
      <el-input
        v-model="searchKeyword"
        placeholder="输入名称/规格搜索"
        clearable
        @keyup.enter="loadItemList"
      >
        <template #append>
          <el-button type="primary" @click="loadItemList">搜索</el-button>
        </template>
      </el-input>
    </el-card>

    <!-- 物品列表 -->
    <el-card class="table-card">
      <el-table 
        :data="itemList" 
        border 
        stripe 
        v-loading="loading"
        :empty-text="loading ? '加载中...' : '暂无数据'"
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
          :cell-style="(row) => row.row.stockQuantity <= row.row.minStock && { color: 'red' }" 
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
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row.itemId)" style="margin-left: 5px">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageNum"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
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
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 组件实例（用于访问ref）
const { proxy } = getCurrentInstance()

// 表格数据与分页
const itemList = ref([])
const total = ref(0)
const pageNum = ref(1)  // 初始页码设为1（修复pageNum=18的问题）
const pageSize = ref(10)
const searchKeyword = ref('')
const loading = ref(false)  // 表格加载状态

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

// 页面初始化：加载所有必要数据
onMounted(async () => {
  await Promise.all([
    loadItemList(),    // 加载物品列表
    loadItemTypes(),   // 加载分类列表
    loadSuppliers()    // 加载供应商列表
  ])
})

/**
 * 加载物品列表（修复路径：无/api前缀）
 */
const loadItemList = async () => {
  loading.value = true
  try {
    // 请求路径：'/items'（无/api前缀）
    const res = await request.get('/items', {
      params: {
        pageNum: pageNum.value,  // 页码从1开始
        pageSize: pageSize.value,
        keyword: searchKeyword.value
      }
    })

    // 直接使用res（后端返回的分页对象：{ total: 100, records: [...] }）
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
 * 加载分类列表（修复路径：无/api前缀）
 */
const loadItemTypes = async () => {
  try {
    // 请求路径：'/item-types'（无/api前缀）
    const res = await request.get('/item-types')
    itemTypeList.value = res.data || []  // 后端直接返回分类数组
  } catch (e) {
    ElMessage.error(`加载分类失败：${e.message}`)
  }
}

/**
 * 加载供应商列表
 */
const loadSuppliers = async () => {
  try {
    // 请求路径：'/suppliers'（无/api前缀）
    const res = await request.get('/suppliers')
    supplierList.value = res.data || []  // 后端直接返回供应商数组
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
 * 分页：每页条数变化
 */
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNum.value = 1  // 切换每页大小时回到第1页
  loadItemList()
}

/**
 * 分页：当前页码变化
 */
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
    itemId: null, 
    name: '', 
    specification: '', 
    typeId: null, 
    unitPrice: 0, 
    minStock: 0, 
    supplierId: null, 
    location: '' 
  }
  dialogVisible.value = true
  setTimeout(() => proxy.$refs.itemForm?.clearValidate(), 0)
}

/**
 * 编辑物品
 */
const handleEdit = (row) => {
  dialogTitle.value = '编辑物品'
  form.value = { ...row }  // 深拷贝行数据
  dialogVisible.value = true
  setTimeout(() => proxy.$refs.itemForm?.clearValidate(), 0)
}

/**
 * 提交表单（新增/编辑）
 */
const handleSubmit = async () => {
  // 表单校验
  const valid = await proxy.$refs.itemForm.validate()
  if (!valid) return

  try {
    if (!form.value.itemId) {
      // 新增：
      await request.post('/items', form.value)
      ElMessage.success('新增成功')
    } else {
      // 编辑：
      await request.put('/items', form.value)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    loadItemList()  // 刷新列表
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
    // 删除：
    await request.delete(`/items/${id}`)
    ElMessage.success('删除成功')
    loadItemList()  // 刷新列表
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(`删除失败：${e.message}`)
  }
}
</script>

<style scoped>
.item-management-container { 
  padding: 20px; 
  background: #f5f7fa; 
  min-height: calc(100vh - 60px); 
}
.page-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.search-card { 
  margin-bottom: 20px; 
  padding: 15px; 
}
.table-card { 
  padding: 15px; 
}
.pagination { 
  margin-top: 15px; 
  text-align: right; 
}
</style>