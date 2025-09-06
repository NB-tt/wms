<template>
  <div class="stocktaking-container">
    <!-- 头部区域：返回按钮 + 页面标题 -->
    <div class="page-header">
      <el-button
        type="default"
        icon="ArrowLeft"
        @click="handleBack"
        class="back-button"
      >
        返回首页
      </el-button>
      <h2 class="page-title">库存盘点（发起人）</h2>
      <el-button type="primary" @click="showCreateDialog = true">创建任务</el-button>
    </div>

    <!-- 任务列表 -->
    <el-card shadow="hover" class="mb-20">
      <el-table :data="tasks" border style="width: 100%">
        <el-table-column prop="taskName" label="任务名称" />
        <el-table-column prop="taskStatus" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.taskStatus === 0 ? 'warning' : 'success'">
              {{ scope.row.taskStatus === 0 ? '进行中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间">
          <template #default="scope">{{ formatTime(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间">
          <template #default="scope">{{ formatTime(scope.row.endTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewDetails(scope.row)">
              明细
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 明细对话框 -->
    <el-dialog v-model="showDetailDialog" title="盘点明细" width="70%">
      <el-table :data="details" border style="width: 100%">
        <el-table-column prop="itemName" label="物料名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="bookQuantity" label="账面数量" width="120" />
        <el-table-column label="实际数量" width="120">
          <template #default="scope">
            <span v-if="currentTask.taskStatus === 0">任务进行中</span>
            <span v-else>{{ scope.row.actualQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="备注" />
        <el-table-column prop="createTime" label="创建时间">
          <template #default="scope">{{ formatTime(scope.row.createTime) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建盘点任务" width="70%">
      <el-form :model="newTask" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.task.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="newTask.task.remark" />
        </el-form-item>

        <el-divider>盘点物料</el-divider>
        <el-table :data="newTask.details" border style="width: 100%">
          <el-table-column label="物料">
            <template #default="scope">
              <el-select
                v-model="scope.row.itemId"
                filterable
                remote
                clearable
                placeholder="请选择物料"
                :remote-method="searchItems"
                :loading="itemLoading"
                style="width: 100%"
                @focus="searchItems('')"
                @change="handleItemChange(scope.row, $event)"
              >
                <el-option
                  v-for="item in itemOptions"
                  :key="item.itemId"
                  :label="item.name + ' (' + item.specification + ')'"
                  :value="item.itemId"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="备注">
            <template #default="scope">
              <el-input v-model="scope.row.reason" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeDetail(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-10">
          <el-button type="primary" @click="addDetail">添加物料</el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTask">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { stocktakingApi } from '@/api/stocktakingApi'
import { ElMessage } from 'element-plus'

export default {
  name: 'StocktakingCreator',
  data() {
    return {
      tasks: [],
      details: [],
      showDetailDialog: false,
      showCreateDialog: false,
      currentTask: {}, // 当前查看的任务
      newTask: {
        task: { taskName: '', remark: '', createdBy: 1 },
        details: []
      },
      itemOptions: [],
      itemLoading: false
    }
  },
  methods: {
    handleBack() {
      this.$router.push('/home')
    },
    async loadTasks() {
      const res = await stocktakingApi.getTasks()
      this.tasks = (res || []).map(task => ({
        ...task,
        startTime: task.startTime ? task.startTime.replace('T', ' ') : '',
        endTime: task.endTime ? task.endTime.replace('T', ' ') : ''
      }))
    },
    async viewDetails(task) {
      this.currentTask = task
      const res = await stocktakingApi.getDetails(task.taskId)
      this.details = (res || []).map(d => ({
        ...d,
        createTime: d.createTime ? d.createTime.replace('T', ' ') : ''
      }))
      this.showDetailDialog = true
    },
    addDetail() {
      this.newTask.details.push({ itemId: null, itemName: '', specification: '', reason: '' })
    },
    removeDetail(index) {
      this.newTask.details.splice(index, 1)
    },
    async submitTask() {
      await stocktakingApi.createTask(this.newTask)
      ElMessage.success('盘点任务创建成功')
      this.showCreateDialog = false
      this.loadTasks()
      this.newTask = { task: { taskName: '', remark: '', createdBy: 1 }, details: [] }
    },
    async searchItems(keyword) {
      this.itemLoading = true
      try {
        const res = await stocktakingApi.searchItems(keyword || '')
        this.itemOptions = res || []
      } finally {
        this.itemLoading = false
      }
    },
    handleItemChange(row, itemId) {
      const item = this.itemOptions.find(i => i.itemId === itemId)
      if (item) {
        row.itemName = item.name
        row.specification = item.specification
      }
    },
    formatTime(timeStr) {
      return timeStr ? timeStr.replace('T', ' ') : ''
    }
  },
  mounted() {
    this.loadTasks()
  }
}
</script>

<style scoped>
.stocktaking-container { padding: 20px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.back-button { background-color: #f0f2f5; color: #409eff; border: none; }
.page-title { margin: 0; font-size: 20px; flex-grow: 1; }
.mb-20 { margin-bottom: 20px; }
.mt-10 { margin-top: 10px; }
</style>
