<template>
  <div class="stock-out-records">
    <!-- 标题区：返回按钮 + 标题 -->
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="goBack">返回出库管理</el-button>
      </div>
      <h1>出库记录查询</h1>
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
          @clear="getStockOutRecords"
          @keyup.enter="getStockOutRecords"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="searchParams.status"
          placeholder="审批状态筛选"
          style="width: 180px;"
          @change="getStockOutRecords"
        >
          <el-option label="全部状态" value=""></el-option>
          <el-option label="待审批" value="0"></el-option>
          <el-option label="已通过" value="1"></el-option>
          <el-option label="已驳回" value="2"></el-option>
        </el-select>

        <el-button 
          type="default" 
          icon="Refresh" 
          @click="getStockOutRecords"
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

      <div v-else-if="stockOutRecords.length === 0" class="no-data">
        <el-empty description="暂无出库记录"></el-empty>
      </div>

      <el-table
        v-else
        :data="stockOutRecords"
        border
        stripe
        style="width: 100%;"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column label="出库单ID" prop="outId" width="100" align="center"></el-table-column>
        <el-table-column label="物品名称" align="center">
          <template #default="scope">
            {{ getItemNameById(scope.row.itemId) }}
          </template>
        </el-table-column>
        <el-table-column label="出库数量" prop="outQuantity" width="120" align="center"></el-table-column>
        <el-table-column label="批次号" prop="batchNo" align="center"></el-table-column>
        <el-table-column label="申请人ID" prop="applyId" align="center"></el-table-column>
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
            <!-- 审批按钮：仅审批人 + 待审批 -->
            <el-button
              v-if="scope.row.status === 0 && isApprover"
              type="primary"
              size="small" 
              @click="openApproveDialog(scope.row)"
            >
              审批
            </el-button>
            <!-- 撤销按钮：仅创建人 + 待审批 -->
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
        v-if="stockOutRecords.length > 0"
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
      title="审批出库单"
      width="500px"
      :before-close="closeDialog"
    >
      <el-form
        ref="approveFormRef"
        :model="approveForm"
        :rules="approveRules"
        label-width="100px"
      >
        <el-form-item label="出库单ID" disabled>
          <el-input v-model="approveForm.outId"></el-input>
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
import { ElMessage, ElEmpty, ElTag, ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadio, ElButton, ElDialog, ElSelect, ElOption, ElPagination } from 'element-plus'
import { Search, Refresh, Loading } from '@element-plus/icons-vue'  
import { stockOutApi } from '@/api/stockOut'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userId)
const currentUserRole = computed(() => userStore.role)
const isApprover = computed(() => ['system_admin', 'warehouse_admin'].includes(currentUserRole.value))

// 物品列表（用于匹配物品名称）
const itemList = ref([])
// 出库记录数组
const stockOutRecords = ref([])
// 总记录数（分页用）
const total = ref(0)
// 加载状态
const loading = ref(false)

// 搜索参数
const searchParams = reactive({
  keyword: '',    // 搜索关键词（批次号/备注）
  status: '',     // 审批状态（0=待审批，1=通过，2=驳回）
  pageNum: 1,     // 当前页码
  pageSize: 10    // 每页条数
})

// 审批弹窗相关
const approveDialogVisible = ref(false)
const approveFormRef = ref(null)
const approveForm = reactive({
  outId: null,          // 出库单ID
  itemId: null,         // 物品ID
  status: '1',          // 默认审批状态：通过（字符串类型，匹配el-radio的label）
  approveRemark: '',    // 审批备注（驳回时必填）
  approveBy: currentUserId.value  // 审批人ID（当前登录用户）
})

// 审批表单校验规则
const approveRules = reactive({
  status: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  approveRemark: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
})

// 初始化：加载物品列表 + 出库记录
const init = async () => {
  try {
    // 1. 加载物品列表（用于显示物品名称）
    const itemRes = await stockOutApi.getItems()
    if (itemRes.code === 200 && Array.isArray(itemRes.data)) {
      itemList.value = itemRes.data  // 正确提取物品列表（res.data）
    } else {
      itemList.value = []
      ElMessage.warning('物品列表加载失败，部分名称可能无法显示')
    }

    // 2. 加载出库记录
    await getStockOutRecords()
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('页面初始化失败，请刷新重试')
  }
}

// 获取出库记录
const getStockOutRecords = async () => {
  try {
    loading.value = true
    const res = await stockOutApi.getRecords(searchParams)
    
    // 后端返回格式：{ code:200, data: { records: [], total: 0 } }
    if (res.code === 200 && res.data) {
      stockOutRecords.value = res.data.records || []  // 提取 data.records
      total.value = res.data.total || 0                // 提取 data.total
    } else {
      stockOutRecords.value = []
      total.value = 0
      ElMessage.warning(res.msg || '获取出库记录失败')
    }
  } catch (error) {
    console.error('获取出库记录失败:', error)
    ElMessage.error('网络错误，获取出库记录失败')
  } finally {
    loading.value = false  // 无论成功失败，结束加载状态
  }
}

// 返回出库管理页
const goBack = () => {
  router.push({ name: 'StockOut' })
}

// 根据物品ID获取名称
const getItemNameById = (itemId) => {
  if (!itemId) return '未知物品'
  const item = itemList.value.find(i => i.itemId === Number(itemId))
  return item ? item.name : `物品ID: ${itemId}`
}

// 审批状态文本映射
const getStatusText = (status) => ({ 0: '待审批', 1: '已通过', 2: '已驳回' }[status] || '未知状态')
// 审批状态标签样式映射
const getStatusTagType = (status) => ({ 0: 'info', 1: 'success', 2: 'danger' }[status] || 'default')

// 打开审批弹窗
const openApproveDialog = (row) => {
  approveForm.outId = row.outId
  approveForm.itemId = row.itemId
  approveForm.status = '1'  // 默认选中“通过”
  approveForm.approveRemark = ''
  approveDialogVisible.value = true
  nextTick(() => approveFormRef.value?.resetFields())  // 重置表单验证状态
}

// 切换审批状态时，清除备注验证
const handleStatusChange = () => {
  nextTick(() => {
    if (approveFormRef.value) {
      approveFormRef.value.clearValidate('approveRemark')  // 清除备注字段的验证
    }
  })
}

// 提交审批（修复：数据类型转换 + 分组校验）
const handleApproveSubmit = async () => {
  try {
    // 1. 前端表单校验
    await approveFormRef.value.validate()

    // 2. 构造提交数据（转换为后端需要的类型）
    const submitData = {
      outId: Number(approveForm.outId),          // 出库单ID转数字
      status: Number(approveForm.status),        // 审批状态转数字（1=通过，2=驳回）
      approveRemark: approveForm.approveRemark,  // 备注（驳回时必填）
      approveBy: Number(approveForm.approveBy)   // 审批人ID转数字
    }

    // 3. 调用审批接口
    const res = await stockOutApi.approveStockOut(submitData)
    
    if (res.code === 200 && res.data) {
      ElMessage.success('审批成功！')
      approveDialogVisible.value = false
      getStockOutRecords()  // 刷新出库记录列表
    } else {
      ElMessage.error(res.msg || '审批失败，请重试')
    }
  } catch (error) {
    // 区分前端校验失败和后端错误
    if (error.name !== 'Error') {
      ElMessage.error('请完成表单必填项')
    } else {
      ElMessage.error('服务器错误，审批失败')
    }
  }
}

// 关闭审批弹窗时重置表单
const closeDialog = () => {
  approveFormRef.value?.resetFields()
  approveDialogVisible.value = false
}

// 撤销出库单
const handleCancel = async (row) => {
  try {
    // 二次确认
    const confirmRes = await ElMessage.confirm(
      `确定要撤销出库单ID: ${row.outId}吗？`,
      '确认撤销',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    if (confirmRes) {
      // 调用撤销接口
      const res = await stockOutApi.cancelStockOut({ outId: row.outId })
      
      if (res.code === 200 && res.data) {
        ElMessage.success('撤销成功！')
        getStockOutRecords()  // 刷新列表
      } else {
        ElMessage.error(res.msg || '撤销失败')
      }
    }
  } catch (error) {
    // 用户取消确认时不提示错误
    if (error !== 'cancel') {
      ElMessage.error('撤销失败，请重试')
    }
  }
}

// 分页：每页条数变化
const handleSizeChange = (size) => {
  searchParams.pageSize = size
  searchParams.pageNum = 1  // 重置页码为1
  getStockOutRecords()
}

// 分页：当前页码变化
const handleCurrentChange = (page) => {
  searchParams.pageNum = page
  getStockOutRecords()
}

// 页面挂载时初始化
onMounted(() => init())
</script>

<style scoped>
.stock-out-records {
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
</style>