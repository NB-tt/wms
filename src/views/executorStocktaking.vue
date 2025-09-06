<template>
  <div class="executor-container">
    <!-- 返回首页 -->
    <div class="back-container">
      <el-button type="default" icon="ArrowLeft" @click="goToHome" class="back-btn">
        返回首页
      </el-button>
    </div>

    <h1 class="page-title">盘点任务执行</h1>

    <el-card class="form-card">
      <!-- 选择任务 -->
      <el-form label-width="120px">
        <el-form-item label="选择任务">
          <el-select v-model="currentTaskId" placeholder="请选择任务" filterable @change="loadDetails">
            <el-option
              v-for="task in tasks"
              :key="task.taskId"
              :label="task.taskName"
              :value="task.taskId"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 明细表格 -->
      <el-table v-if="details.length" :data="details" border stripe style="margin-top: 20px;">
        <el-table-column prop="itemName" label="物品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="bookQuantity" label="账面数量" />
        <el-table-column label="实际数量">
          <template #default="scope">
            <el-input-number
              v-model.number="scope.row.actualQuantity"
              :min="0"
              :controls="false"
              placeholder="请输入"
              style="width: 100%;"
            />
          </template>
        </el-table-column>
        <el-table-column label="差异原因">
          <template #default="scope">
            <el-input
              v-model="scope.row.differenceReason"
              :disabled="scope.row.actualQuantity === scope.row.bookQuantity"
              placeholder="数量不一致请填写原因"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 操作按钮 -->
      <div class="form-actions" v-if="details.length">
        <el-button type="primary" @click="submitDetails" :loading="submitLoading">提交盘点明细</el-button>
        <el-button @click="resetForm">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { stocktakingApi } from '@/api/stocktakingApi'
import { useRouter } from 'vue-router'

const router = useRouter()
const submitLoading = ref(false)

const tasks = ref([])
const details = ref([])
const currentTaskId = ref(null)

// 登录用户信息
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const executorId = userInfo.userId
const executorName = userInfo.realName

// 加载未完成任务
const loadTasks = async () => {
  try {
    const res = await stocktakingApi.getTasks()
    tasks.value = res.filter(t => t.taskStatus === 0)
  } catch {
    ElMessage.error('加载任务失败')
  }
}

// 选择任务加载明细
const loadDetails = async (taskId) => {
  if (!taskId) return
  try {
    const res = await stocktakingApi.getDetails(taskId)
    details.value = res.map(d => ({
      ...d,
      actualQuantity: d.bookQuantity, // 默认填账面数，避免空
      differenceReason: '',
      executorId,
      executorName
    }))
  } catch {
    ElMessage.error('加载明细失败')
  }
}

// 提交明细
const submitDetails = async () => {
  for (const d of details.value) {
    if (d.actualQuantity == null || d.actualQuantity === '') {
      ElMessage.warning(`物品【${d.itemName}】必须填写实际数量`)
      return
    }
    if (d.actualQuantity !== d.bookQuantity && !d.differenceReason) {
      ElMessage.warning(`物品【${d.itemName}】数量有差异，请填写原因`)
      return
    }
  }

  submitLoading.value = true
  try {
    for (const d of details.value) {
      await stocktakingApi.submitDetail(d)
    }
    ElMessage.success('提交成功')
    resetForm()
    loadTasks()
  } catch {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

// 重置
const resetForm = () => {
  currentTaskId.value = null
  details.value = []
}

// 返回首页
const goToHome = () => {
  router.push('/home')
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.executor-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.back-container {
  margin-bottom: 20px;
}
.back-btn {
  background-color: #e6f4ff;
}

.page-title {
  text-align: left;
  margin-bottom: 20px;
  color: #1d2129;
  font-size: 22px;
  font-weight: 600;
}

.form-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fff;
  padding: 25px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-start;
  margin-top: 20px;
}
</style>
