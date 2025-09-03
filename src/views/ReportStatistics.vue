<template>
  <div class="report-statistics">
    <!-- 返回首页按钮 -->
    <div class="back-container">
      <el-button type="default" icon="ArrowLeft" @click="goToHome" class="back-btn">
        返回首页
      </el-button>
    </div>

    <h1 class="page-title">报表统计</h1>

    <!-- 筛选表单 -->
    <el-card class="form-card">
      <el-form :model="query" label-width="80px" class="report-form">
        <el-row :gutter="20" type="flex" align="middle">
          <!-- 报表类型 -->
          <el-col :span="6">
            <el-form-item label="报表类型">
              <el-select v-model="query.type" placeholder="选择报表类型">
                <el-option label="日报" value="daily"></el-option>
                <el-option label="月报" value="monthly"></el-option>
                <el-option label="年报" value="yearly"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 日期 -->
          <el-col :span="6">
            <el-form-item label="日期">
              <el-date-picker
                v-model="query.date"
                :type="datePickerType"
                :picker-options="pickerOptions"
                placeholder="请选择日期"
                :format="dateFormat"
                :value-format="valueFormat"
              />
            </el-form-item>
          </el-col>

          <!-- 类型 -->
          <el-col :span="6">
            <el-form-item label="类型">
              <el-select v-model="query.reportType" placeholder="选择类型">
                <el-option label="入库" value="in"></el-option>
                <el-option label="出库" value="out"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 查询 + 导出按钮 -->
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="fetchPreview" :loading="loading">查询预览</el-button>
              <el-button type="success" @click="exportReport">导出 Excel</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 预览表格 -->
    <el-card class="table-card">
      <el-table
        :data="previewData"
        border
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="dateTime" label="日期" width="180"></el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
        <el-table-column prop="itemName" label="物品名称" width="180"></el-table-column>
        <el-table-column prop="specification" label="规格" width="120"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
        <el-table-column prop="relatedPersonId" label="相关人ID" width="100"></el-table-column>
        <el-table-column prop="relatedPersonName" label="相关人姓名" width="120"></el-table-column>
        <el-table-column prop="relatedPersonDept" label="相关人部门" width="120"></el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/reportApi.js'
import dayjs from 'dayjs'

const router = useRouter()

const query = reactive({
  type: 'daily',         // 日报/月报/年报
  date: '',              // 选择的日期
  reportType: 'in'       // 入库/出库
})

const previewData = ref([])
const loading = ref(false)

// 根据报表类型动态修改日期选择器类型
const datePickerType = computed(() => {
  if (query.type === 'daily') return 'date'
  if (query.type === 'monthly') return 'month'
  if (query.type === 'yearly') return 'year'
  return 'date'
})

// 显示格式
const dateFormat = computed(() => {
  if (query.type === 'daily') return 'YYYY-MM-DD'
  if (query.type === 'monthly') return 'YYYY-MM'
  if (query.type === 'yearly') return 'YYYY'
  return 'YYYY-MM-DD'
})

// value-format 不用，使用 dayjs 手动格式化
const valueFormat = undefined

// 格式化日期
const formatDate = () => {
  if (!query.date) return ''
  if (query.type === 'daily') return dayjs(query.date).format('YYYY-MM-DD')
  if (query.type === 'monthly') return dayjs(query.date).format('YYYY-MM')
  if (query.type === 'yearly') return dayjs(query.date).format('YYYY')
  return query.date
}

// 发送请求前手动构造参数，确保 reportType 正确
const fetchPreview = async () => {
  if (!query.date) {
    ElMessage.warning('请选择日期')
    return
  }
  loading.value = true
  try {
    const params = {
      type: query.type,
      date: formatDate(),
      reportType: query.reportType // 这里保证传给后端的是用户选择的值
    }
    console.log('发送给后端的参数:', params)

    const res = await reportApi.preview(params)
    console.log('收到的 JSON 数据:', res)
    previewData.value = res.data || res || []
    ElMessage.success('预览成功')
  } catch (error) {
    console.error('获取预览失败', error)
    ElMessage.error('获取预览失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const exportReport = async () => {
  if (!query.date) {
    ElMessage.warning('请选择日期')
    return
  }
  try {
    const params = {
      type: query.type,
      date: formatDate(),
      reportType: query.reportType
    }
    console.log('导出参数:', params)

    const res = await reportApi.export(params)
    ElMessage.success(res.data || '导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

const goToHome = () => {
  router.push('/home')
}

// 禁止选择未来日期
const pickerOptions = {
  disabledDate(time) {
    return time.getTime() > Date.now()
  }
}
</script>



<style scoped>
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

.form-card, .table-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fff;
  padding: 25px;
  margin-bottom: 20px;
}

.report-form {
  width: 100%;
}
</style>
