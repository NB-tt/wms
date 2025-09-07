<template>
  <div class="supplier-container">
    <!-- 返回首页按钮 + 页面标题和操作区 -->
    <div class="back-and-header">
      <!-- 返回首页按钮 -->
      <div class="back-container">
        <el-button 
          type="default" 
          @click="goToHome" 
          class="back-btn"
          icon="ArrowLeft"
        >
          返回首页
        </el-button>
      </div>

      <!-- 页面标题和操作区 -->
      <div class="page-header">
        <h1>供应商管理</h1>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>新增供应商
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区 -->
    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索供应商名称/联系人/电话" 
        style="width: 300px" 
        prefix-icon="Search"
      />
      <el-button type="default" @click="fetchSuppliers">查询</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <!-- 供应商列表 -->
    <el-table :data="supplierList" border stripe style="width: 100%">
      <el-table-column prop="supplierId" label="供应商ID" width="100" align="center" />
      <el-table-column prop="name" label="供应商名称" align="center" />
      <el-table-column prop="contactPerson" label="联系人" align="center" />
      <el-table-column prop="phone" label="联系电话" align="center" />
      <el-table-column prop="address" label="地址" align="center" />
      <el-table-column prop="email" label="邮箱" align="center" />
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.supplierId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控件 -->
    <div class="pagination" style="margin-top: 15px; text-align: right;">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[5, 10, 20]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑供应商弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="supplierForm" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="supplierForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="supplierForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="supplierForm.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 导入返回图标和路由
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supplierApi } from '@/api/suppliers' 
import { Plus, ArrowLeft } from '@element-plus/icons-vue'  // 导入ArrowLeft图标
import { useRouter } from 'vue-router'  // 导入路由

// 初始化路由
const router = useRouter()

// 原有分页参数、弹窗控制等逻辑完全保留
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const supplierList = ref([])
const searchKeyword = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('新增供应商')
const supplierForm = ref({
  supplierId: null,
  name: '',
  contactPerson: '',
  phone: '',
  address: '',
  email: ''
})
const formRef = ref(null)
const formRules = reactive({
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
})

// 返回首页方法
const goToHome = () => {
  router.push('/home')  // 跳转到首页路由
}


const fetchSuppliers = async () => {
  try {
    const res = await supplierApi.list({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    })
    supplierList.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('获取供应商列表失败')
    console.error(error)
  }
}

const openAddDialog = () => {
  dialogTitle.value = '新增供应商'
  supplierForm.value = { supplierId: null, name: '', contactPerson: '', phone: '', address: '', email: '' }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑供应商'
  supplierForm.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  try {
    if (supplierForm.value.supplierId) {
      await supplierApi.update(supplierForm.value)
      ElMessage.success('编辑供应商成功')
    } else {
      await supplierApi.add(supplierForm.value)
      ElMessage.success('新增供应商成功')
    }
    dialogVisible.value = false
    fetchSuppliers()
  } catch (error) {
    ElMessage.error(supplierForm.value.supplierId ? '编辑失败' : '新增失败')
    console.error(error)
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该供应商吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await supplierApi.delete(id)
    ElMessage.success('删除成功')
    fetchSuppliers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  fetchSuppliers()
}
const handleCurrentChange = (num) => {
  pageNum.value = num
  fetchSuppliers()
}
const resetSearch = () => {
  searchKeyword.value = ''
  fetchSuppliers()
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>

.back-and-header {
  display: flex;
  flex-direction: column;
  gap: 20px;  
  margin-bottom: 20px;
}

.back-container {
  padding-left: 5px;  
}

.back-btn {
  background-color: #e6f4ff;  /* 浅蓝背景 */
  border-color: #b3d8ff;
}


.supplier-container {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>