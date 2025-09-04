<template>
  <div class="stocktaking-page">
    <!-- 任务列表 -->
    <el-card shadow="hover" class="mb-20">
      <div class="flex justify-between items-center mb-10">
        <h2>库存盘点任务</h2>
        <el-button type="primary" @click="showCreateDialog = true">创建任务</el-button>
      </div>

      <el-table :data="tasks" border style="width: 100%">
        <el-table-column prop="taskId" label="任务ID" width="80" />
        <el-table-column prop="taskName" label="任务名称" />
        <el-table-column prop="taskStatus" label="状态" :formatter="formatStatus" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewDetails(scope.row)">明细</el-button>
            <el-button size="small" type="success" :disabled="scope.row.taskStatus === 1"
                       @click="completeTask(scope.row.taskId)">完成任务</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 明细对话框 -->
    <el-dialog v-model="showDetailDialog" title="盘点明细" width="60%">
      <el-table :data="details" border style="width: 100%">
        <el-table-column prop="detailId" label="明细ID" width="80" />
        <el-table-column prop="itemId" label="物料ID" />
        <el-table-column prop="bookQuantity" label="账面数量" />
        <el-table-column prop="actualQuantity" label="实盘数量" />
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
    </el-dialog>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建盘点任务" width="60%">
      <el-form :model="newTask" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.task.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="newTask.task.remark" />
        </el-form-item>
        <el-divider>盘点明细</el-divider>
        <el-table :data="newTask.details" border style="width: 100%">
          <el-table-column prop="itemId" label="物料ID">
            <template #default="scope">
              <el-input v-model="scope.row.itemId" placeholder="输入物料ID" />
            </template>
          </el-table-column>
          <el-table-column prop="bookQuantity" label="账面数量">
            <template #default="scope">
              <el-input v-model="scope.row.bookQuantity" type="number" />
            </template>
          </el-table-column>
          <el-table-column prop="actualQuantity" label="实盘数量">
            <template #default="scope">
              <el-input v-model="scope.row.actualQuantity" type="number" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeDetail(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-10">
          <el-button type="primary" @click="addDetail">添加明细</el-button>
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
import { stocktakingApi } from '@/api/inventoryApi'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Stocktaking',
  data() {
    return {
      tasks: [],
      details: [],
      showDetailDialog: false,
      showCreateDialog: false,
      newTask: {
        task: {
          taskName: '',
          remark: '',
          createdBy: 1
        },
        details: []
      }
    }
  },
  methods: {
    async loadTasks() {
      const res = await stocktakingApi.getTasks()
      this.tasks = res || []
    },
    async viewDetails(row) {
      const res = await stocktakingApi.getDetails(row.taskId)
      this.details = res || []
      this.showDetailDialog = true
    },
    async completeTask(taskId) {
      await stocktakingApi.completeTask(taskId)
      this.$message.success('任务已完成并生成库存调整')
      this.loadTasks()
    },
    addDetail() {
      this.newTask.details.push({ itemId: '', bookQuantity: 0, actualQuantity: 0 })
    },
    removeDetail(index) {
      this.newTask.details.splice(index, 1)
    },
    async submitTask() {
      await stocktakingApi.createTask(this.newTask)
      this.$message.success('盘点任务创建成功')
      this.showCreateDialog = false
      this.loadTasks()
      this.newTask = { task: { taskName: '', remark: '', createdBy: 1 }, details: [] }
    },
    formatStatus(row, column, value) {
      return value === 0 ? '进行中' : '已完成'
    }
  },
  mounted() {
    this.loadTasks()
  }
}
</script>

<style scoped>
.mb-20 {
  margin-bottom: 20px;
}
.mt-10 {
  margin-top: 10px;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}
</style>
