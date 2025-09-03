<template>
  <div class="report-statistics">
    <!-- 返回首页按钮 -->
    <div class="back-container">
      <el-button type="default" icon="ArrowLeft" @click="goToHome" class="back-btn">
        返回首页
      </el-button>
    </div>

    <h1 class="page-title">报表统计</h1>

    <!-- 柱状图 -->
    <el-card class="chart-card" style="margin-bottom: 20px;">
      <div ref="chartRef" style="width: 100%; height: 400px;"></div>
    </el-card>

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
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/reportApi.js'
import dayjs from 'dayjs'
import axios from "axios"
import * as echarts from 'echarts'

const router = useRouter()

const query = reactive({
  type: 'daily',
  date: '',
  reportType: 'in'
})

const previewData = ref([])
const loading = ref(false)

// 日期选择器类型
const datePickerType = computed(() => {
  if (query.type === 'daily') return 'date'
  if (query.type === 'monthly') return 'month'
  if (query.type === 'yearly') return 'year'
  return 'date'
})

const dateFormat = computed(() => {
  if (query.type === 'daily') return 'YYYY-MM-DD'
  if (query.type === 'monthly') return 'YYYY-MM'
  if (query.type === 'yearly') return 'YYYY'
  return 'YYYY-MM-DD'
})

const valueFormat = undefined

const formatDate = () => {
  if (!query.date) return ''
  if (query.type === 'daily') return dayjs(query.date).format('YYYY-MM-DD')
  if (query.type === 'monthly') return dayjs(query.date).format('YYYY-MM')
  if (query.type === 'yearly') return dayjs(query.date).format('YYYY')
  return query.date
}

// ECharts
const chartRef = ref(null)
let chartInstance = null

const renderChart = (data) => {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)

  // ===== 空数据：清空并给出占位 =====
  if (!data || data.length === 0) {
    chartInstance.clear()
    chartInstance.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: '40%',
        textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' }
      },
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: []
    }, true) // notMerge=true，强制覆盖
    return
  }

  // ===== 你的原始逻辑：按名称聚合并着色 =====
  const items = [...new Set(data.map(d => d.itemName))]
  const quantities = items.map(item =>
    data.filter(d => d.itemName === item)
      .reduce((sum, cur) => sum + (cur.quantity || 0), 0)
  )

  const colorPalette = [
    '#4caf50','#f56c6c','#2196f3','#ff9800','#9c27b0','#00bcd4','#ff5722','#607d8b',
    '#e91e63','#3f51b5','#009688'
  ]
  const itemColors = items.map((_, i) => colorPalette[i % colorPalette.length])

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: items,
      axisLabel: {
        rotate: 0,
        fontStyle: 'normal',
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: 14
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontStyle: 'normal',
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: 14
      }
    },
    series: [{
      name: query.reportType === 'in' ? '入库数量' : '出库数量',
      type: 'bar',
      data: quantities,
      itemStyle: {
        color: (params) => itemColors[params.dataIndex]
      },
      label: {
        show: true,
        position: 'top',
        fontStyle: 'normal',
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: 14
      }
    }]
  }

  chartInstance.setOption(option, true) // notMerge=true，防止残留
}





// 监听预览数据更新图表
watch(previewData, (newVal) => {
  if (newVal.length > 0) renderChart(newVal)
})

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
      reportType: query.reportType
    }
    console.log('发送给后端的参数:', params)

    const res = await reportApi.preview(params)
    // 统一成数组
    const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    console.log('收到的 JSON 数据:', arr)

    previewData.value = arr
    renderChart(arr)              // 关键：这里不管空不空都渲染（空则清空）
    ElMessage.success('预览成功')
  } catch (error) {
    console.error('获取预览失败', error)
    previewData.value = []
    renderChart([])               // 失败也清空图表
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

  const params = {
    type: query.type,
    date: formatDate(),
    reportType: query.reportType
  }

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('未获取到登录信息，请先登录')
      return
    }

    const res = await axios.get('/api/report/export', {
      params,
      responseType: 'blob',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    const fileName = `StockReport_${query.reportType}_${query.type}_${formatDate()}.xlsx`
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败：' + error.message)
  }
}

const goToHome = () => router.push('/home')

const pickerOptions = {
  disabledDate(time) {
    return time.getTime() > Date.now()
  }
}
</script>

<style scoped>
.back-container { margin-bottom: 20px; }
.back-btn { background-color: #e6f4ff; }

.page-title { text-align: left; margin-bottom: 20px; color: #1d2129; font-size: 22px; font-weight: 600; }

.form-card, .table-card, .chart-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fff;
  padding: 25px;
  margin-bottom: 20px;
}

.report-form { width: 100%; }
</style>
