<template>
  <div class="stock-in-records">
    <!-- 标题区 -->
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="goBack">返回入库管理</el-button>
      </div>
      <h1>入库记录查询</h1>
      <p class="desc">支持按批次号、备注搜索，按审批状态筛选</p>
    </div>

    <!-- 搜索区 -->
    <el-card class="search-card">
      <div class="search-container">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索批次号/备注"
          clearable
          style="width: 300px;"
          @clear="getStockInRecords"
          @keyup.enter="getStockInRecords"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchParams.status"
          placeholder="审批状态筛选"
          style="width: 180px;"
          @change="getStockInRecords"
        >
          <el-option label="全部状态" value=""></el-option>
          <el-option label="待审批" value="0"></el-option>
          <el-option label="已通过" value="1"></el-option>
          <el-option label="已驳回" value="2"></el-option>
        </el-select>

        <el-button 
          type="default" 
          icon="Refresh" 
          @click="getStockInRecords"
        >
          刷新
        </el-button>
      </div>
    </el-card>

    <!-- 记录列表区 -->
    <el-card class="table-card">
      <div v-if="loading" class="loading">
        <Loading size="50" />
        <p>加载中...</p>
      </div>

      <div v-else-if="stockInRecords.length === 0" class="no-data">
        <el-empty description="暂无入库记录"></el-empty>
      </div>

      <el-table
        v-else
        :data="stockInRecords"
        border
        stripe
        style="width: 100%;"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column label="入库单ID" prop="inId" width="100" align="center"></el-table-column>
        <el-table-column label="物品名称" align="center">
          <template #default="scope">
            {{ getItemNameById(scope.row.itemId) }}
          </template>
        </el-table-column>
        <el-table-column label="入库数量" prop="inQuantity" width="120" align="center"></el-table-column>
        <el-table-column label="批次号" prop="batchNo" align="center"></el-table-column>
        <el-table-column label="供应商" align="center">
          <template #default="scope">
            {{ getSupplierNameById(scope.row.supplierId) }}
          </template>
        </el-table-column>
        <el-table-column label="审批状态" width="140" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批备注" prop="approveRemark" align="center">
          <template #default="scope">
            <span v-if="scope.row.approveRemark">{{ scope.row.approveRemark }}</span>
            <span v-else class="empty-remark">无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 0 && isApprover"
              type="primary"
              size="small"  
              @click="openApproveDialog(scope.row)"
            >
              审批
            </el-button>
            <el-button
              v-if="scope.row.status === 0 && scope.row.createBy === currentUserId"
              type="warning"
              size="small"  
              @click="handleCancel(scope.row)"
              style="margin-left: 8px;"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="stockInRecords.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="searchParams.pageNum"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="searchParams.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 15px; text-align: right;"
      ></el-pagination>
    </el-card>

    <!-- 审批弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审批入库单"
      width="500px"
      :before-close="closeDialog"
    >
      <el-form
        ref="approveFormRef"
        :model="approveForm"
        :rules="approveRules"
        label-width="100px"
      >
        <el-form-item label="入库单ID" disabled>
          <el-input v-model="approveForm.inId"></el-input>
        </el-form-item>
        <el-form-item label="物品名称" disabled>
          <el-input :value="getItemNameById(approveForm.itemId)"></el-input>
        </el-form-item>
        <el-form-item label="审批结果" prop="status">
          <el-radio-group v-model="approveForm.status" @change="handleStatusChange">
            <el-radio label="1">通过</el-radio>
            <el-radio label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="approveForm.status === '2'"
          label="驳回原因"
          prop="approveRemark"
        >
          <el-input
            v-model="approveForm.approveRemark"
            type="textarea"
            rows="3"
            placeholder="请输入驳回原因（必填）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApproveSubmit">确定审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElEmpty, ElMessageBox } from 'element-plus'
import { Search, Refresh, Loading } from '@element-plus/icons-vue'  
import { stockInApi } from '@/api/stockIn'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userId)
const currentUserRole = computed(() => userStore.role)
const isApprover = computed(() => ['system_admin', 'warehouse_admin'].includes(currentUserRole.value))

// 数据存储
const itemList = ref([])          // 物品列表（用于名称显示）
const supplierList = ref([])      // 供应商列表（用于名称显示）
const stockInRecords = ref([])    // 入库记录列表
const total = ref(0)              // 总记录数
const loading = ref(false)        // 加载状态

// 搜索参数
const searchParams = reactive({
  keyword: '',    // 搜索关键词
  status: '',     // 审批状态（字符串类型）
  pageNum: 1,     // 当前页码
  pageSize: 10    // 每页条数
})

// 审批弹窗相关
const approveDialogVisible = ref(false)
const approveFormRef = ref(null)
const approveForm = reactive({
  inId: null,         // 入库单ID（显示用，提交时转换为数字）
  itemId: null,       // 物品ID（显示用）
  status: '1',        // 审批结果（前端临时存储，字符串类型）
  approveRemark: '',  // 驳回原因（仅驳回时必填）
  approveBy: null     // 审批人ID（提交时赋值）
})
const approveRules = reactive({
  status: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  approveRemark: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
})

// 初始化数据
const init = async () => {
  try {
    const timestamp = new Date().getTime()
    // 并行加载物品和供应商列表
    const [itemsRes, suppliersRes] = await Promise.all([
      stockInApi.getItems({ _t: timestamp, pageNum: 1, pageSize: 1000 }),
      stockInApi.getSuppliers({ _t: timestamp })
    ])

    // 处理物品列表（从Result.data提取，并转换itemId为数字）
    const itemData = itemsRes?.data || []
    itemList.value = itemData.map(item => ({
      ...item,
      itemId: Number(item.itemId)
    }))
    
    // 处理供应商列表（从Result.data提取，并转换supplierId为数字）
    const supplierData = suppliersRes?.data || []
    supplierList.value = supplierData.map(supplier => ({
      ...supplier,
      supplierId: Number(supplier.supplierId)
    }))

    // 加载入库记录
    await getStockInRecords()
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('初始化失败，请刷新页面重试')
  }
}

// 获取入库记录
const getStockInRecords = async () => {
  try {
    loading.value = true
    const queryParams = {
      keyword: searchParams.keyword,
      status: searchParams.status !== '' ? Number(searchParams.status) : null,
      pageNum: searchParams.pageNum,
      pageSize: searchParams.pageSize
    }
    const res = await stockInApi.getRecords(queryParams)
    
    // 从Result.data提取IPage数据（records和total）
    const pageData = res?.data || {}
    stockInRecords.value = pageData.records || []
    total.value = pageData.total || 0
  } catch (error) {
    console.error('获取记录失败:', error)
    ElMessage.error('获取记录失败，请重试')
  } finally {
    loading.value = false
  }
}

// 根据物品ID获取名称（确保ID为数字类型）
const getItemNameById = (itemId) => {
  const id = Number(itemId)
  const item = itemList.value.find(i => i.itemId === id)
  return item ? item.name : `物品ID: ${itemId}`
}

// 根据供应商ID获取名称（确保ID为数字类型）
const getSupplierNameById = (supplierId) => {
  const id = Number(supplierId)
  const supplier = supplierList.value.find(s => s.supplierId === id)
  return supplier ? supplier.name : `供应商ID: ${supplierId}`
}

// 状态文本和标签类型转换
const getStatusText = (status) => ({ 0: '待审批', 1: '已通过', 2: '已驳回' }[status] || '未知状态')
const getStatusTagType = (status) => ({ 0: 'info', 1: 'success', 2: 'danger' }[status] || 'default')

// 打开审批弹窗（初始化表单数据）
const openApproveDialog = (row) => {
  approveForm.inId = row.inId        // 入库单ID（数字类型，后端要求）
  approveForm.itemId = row.itemId    // 物品ID（用于显示名称）
  approveForm.status = '1'           // 默认选中“通过”
  approveForm.approveRemark = ''     // 清空驳回原因
  approveDialogVisible.value = true
  nextTick(() => approveFormRef.value?.resetFields())
}

// 切换审批结果时清除驳回原因验证
const handleStatusChange = () => {
  nextTick(() => approveFormRef.value?.clearValidate('approveRemark'))
}

// 提交审批（后端校验适配）
const handleApproveSubmit = async () => {
  try {
    // 1. 前端表单验证（确保用户选择了审批结果，驳回时填写了原因）
    await approveFormRef.value.validate()

    // 2. 构建符合后端DTO要求的提交数据（严格匹配字段类型和规则）
    const submitData = {
      inId: Number(approveForm.inId),          // 入库单ID（转换为数字）
      status: Number(approveForm.status),      // 审批状态（1=通过，2=驳回，转换为数字）
      approveBy: Number(currentUserId.value),  // 审批人ID（转换为数字，确保非空）
      approveRemark: approveForm.status === '2' ? approveForm.approveRemark : null  // 驳回原因：通过时传null
    }

    // 3. 提交审批请求
    const res = await stockInApi.approveStockIn(submitData)
    
    // 4. 处理成功响应
    if (res.code === 200 && res.data) {
      ElMessage.success('审批成功！')
      approveDialogVisible.value = false
      getStockInRecords()  // 刷新记录列表，更新状态
    } else {
      ElMessage.error(`审批失败：${res.msg || '未知错误'}`)
    }
  } catch (error) {
    // 5. 处理错误（区分前端验证失败和后端校验失败）
    if (error.name === 'Error') {
      // 后端返回的错误（如400校验失败、500服务器错误）
      if (error.response?.status === 400) {
        // 提取后端返回的详细校验错误信息（如@NotBlank、@Range注解提示）
        const errorMsg = error.response.data?.msg || '数据校验失败'
        const fieldErrors = error.response.data?.errors || []
        if (fieldErrors.length > 0) {
          const detail = fieldErrors.map(e => `${e.field}: ${e.defaultMessage}`).join('；')
          ElMessage.error(`${errorMsg}：${detail}`)  // 示例："status: 必须为1或2；approveBy: 不能为空"
        } else {
          ElMessage.error(errorMsg)
        }
      } else {
        ElMessage.error('请求失败，请重试')
      }
    } else {
      // 前端表单验证失败（如未选择审批结果）
      ElMessage.error('请完成表单填写（选择审批结果，驳回时填写原因）')
    }
  }
}

// 关闭审批弹窗时重置表单
const closeDialog = () => {
  approveFormRef.value?.resetFields()
  approveDialogVisible.value = false
}

// 撤销入库单
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定撤销入库单ID: ${row.inId}吗？`,
      '确认撤销',
      { type: 'warning' }
    )
    
    const res = await stockInApi.cancelStockIn({ inId: row.inId })
    if (res.code === 200 && res.data) {
      ElMessage.success('撤销成功！')
      getStockInRecords()  // 刷新记录列表
    } else {
      ElMessage.error(res.msg || '撤销失败')
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('撤销失败，请重试')
  }
}

// 分页相关方法
const handleSizeChange = (size) => {
  searchParams.pageSize = size
  searchParams.pageNum = 1
  getStockInRecords()
}

const handleCurrentChange = (page) => {
  searchParams.pageNum = page
  getStockInRecords()
}

// 返回入库管理页面
const goBack = () => {
  router.push({ name: 'StockIn' })
}

// 页面挂载时初始化数据
onMounted(() => init())
</script>

<style scoped>
.stock-in-records {
  padding: 20px;
  background-color: #f9fafb;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.page-header h1 {
  margin: 0;
}

.page-header .desc {
  color: #666;
  margin-top: 4px;
  font-size: 14px;
}

.search-card {
  margin-bottom: 15px;
}

.search-container {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 15px;
  flex-wrap: wrap;
}

.table-card {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.loading {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.loading p {
  margin-top: 15px;
}

.no-data {
  padding: 50px 0;
}

.empty-remark {
  color: #999;
  font-style: italic;
}

.el-tag {
  font-size: 12px;
  padding: 2px 8px;
}

.el-pagination {
  margin-top: 15px;
  text-align: right;
}

@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .el-input, .el-select {
    width: 100% !important;
    margin-bottom: 10px;
  }
}
</style>