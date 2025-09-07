<template>
  <div class="stock-out-container">
    <!-- 返回首页按钮 -->
    <div class="back-home-container">
      <el-button 
        type="default" 
        icon="ArrowLeft" 
        @click="goToHome" 
        class="back-home-btn"
        style="margin-bottom: 20px;"
      >
        返回首页
      </el-button>
    </div>

    <el-card class="main-card">
      <template #header><h2>物品出库管理</h2></template>
      <el-form
        ref="stockOutFormRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <!-- 物品名称下拉列表 -->
        <el-form-item label="物品名称" prop="itemId">
          <el-select 
            v-model="form.itemId" 
            placeholder="请选择物品"
            :disabled="itemListLoading"
          >
            <el-option 
              v-for="item in itemList" 
              :key="item.itemId" 
              :label="item.name" 
              :value="item.itemId" 
            />
            <el-option disabled v-if="itemListLoading" value="">加载中...</el-option>
            <el-option disabled v-if="!itemListLoading && itemList.length === 0" value="">暂无物品数据</el-option>
          </el-select>
        </el-form-item>

        <!-- 出库数量 -->
        <el-form-item label="出库数量" prop="outQuantity">
          <el-input 
            v-model.number="form.outQuantity" 
            type="number" 
            min="1" 
            placeholder="至少1件" 
          />
        </el-form-item>

        <!-- 申请人ID -->
        <el-form-item label="申请人ID" prop="applyId">
          <el-input 
            v-model="form.applyId"  
            placeholder="输入申请人ID（关联users表）" 
          />
        </el-form-item>

        <!-- 审批人ID -->
        <el-form-item label="审批人ID" prop="approveId">
          <el-input 
            v-model="form.approveId" 
            placeholder="输入审批人ID（关联users表）" 
          />
        </el-form-item>

        <!-- 领用用途 -->
        <el-form-item label="领用用途" prop="purpose">
          <el-input 
            v-model="form.purpose" 
            placeholder="输入领用用途（如：办公使用）" 
          />
        </el-form-item>

        <!-- 经办人ID -->
        <el-form-item label="经办人ID" prop="handlerId">
          <el-input 
            v-model="form.handlerId" 
            placeholder="输入经办人ID（关联users表）" 
          />
        </el-form-item>

        <!-- 出库时间 -->
        <el-form-item label="出库时间" prop="outTime">
          <el-date-picker 
            v-model="form.outTime" 
            type="datetime"          
            :max="new Date()" 
            value-format="YYYY-MM-DD HH:mm:ss" 
            placeholder="选择出库时间" 
          />
        </el-form-item>

        <!-- 提交按钮区 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交出库</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button 
            v-if="hasPerm('stock_out')" 
            type="default" 
            @click="goToStockOutRecords"
            style="margin-left: 10px;"
          >
            查看出库记录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'  
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'  // 导入返回图标
import { useRouter } from 'vue-router' 
import { stockOutApi } from '@/api/stockOut'
import { hasPerm } from '@/utils/permission'

const router = useRouter()
const stockOutFormRef = ref(null)

// 物品列表相关状态
const itemList = ref([])
const itemListLoading = ref(true)

// 表单数据：默认全空
const form = reactive({
  itemId: null,           // 物品ID（默认空）
  outQuantity: null,      // 出库数量（默认空）
  applyId: '',            // 申请人ID（默认空字符串）
  approveId: '',          // 审批人ID（默认空字符串）
  purpose: '',            // 领用用途（默认空）
  handlerId: '',          // 经办人ID（默认空字符串）
  outTime: null           // 出库时间（默认空）
})

// 表单校验规则
const rules = {
  itemId: [
    { required: true, message: '请选择物品', trigger: 'change' }
  ],
  outQuantity: [
    { required: true, message: '请输入出库数量', trigger: 'blur' },
    { validator: (_, val) => val > 0, message: '出库数量必须大于0', trigger: 'blur' }
  ],
  applyId: [
    { required: true, message: '请输入申请人ID', trigger: 'blur' }
  ],
  approveId: [
    { required: true, message: '请输入审批人ID', trigger: 'blur' }
  ],
  purpose: [
    { required: true, message: '请输入领用用途', trigger: 'blur' },
    { min: 2, message: '领用用途至少2个字符', trigger: 'blur' }
  ],
  handlerId: [
    { required: true, message: '请输入经办人ID', trigger: 'blur' }
  ],
  outTime: [
    { required: true, message: '请选择出库时间', trigger: 'change' }
  ]
}

// 加载物品列表
onMounted(async () => {
  try {
    itemListLoading.value = true
    const res = await stockOutApi.getItems()
    
    if (res?.code === 200 && Array.isArray(res.data)) {
      itemList.value = res.data
    } else {
      itemList.value = []
      ElMessage.warning('物品列表数据为空')
    }
  } catch (error) {
    console.error('获取物品列表失败:', error)
    ElMessage.error('获取物品列表失败，请稍后重试')
  } finally {
    itemListLoading.value = false
  }
})

// 提交出库单
const handleSubmit = async () => {
  try {
    await stockOutFormRef.value.validate()

    const submitData = {
      ...form,
      itemId: Number(form.itemId),
      outQuantity: Number(form.outQuantity),
      applyId: Number(form.applyId),
      approveId: Number(form.approveId),
      handlerId: Number(form.handlerId)
    }

    const res = await stockOutApi.submitStockOut(submitData)
    
    if (res.code === 200) {
      ElMessage.success('出库单提交成功')
      resetForm()
    } else {
      ElMessage.error(res.msg || '提交失败')
    }
  } catch (error) {
    if (error.name !== 'Error') {
      ElMessage.error('请完成所有必填项')
    } else {
      ElMessage.error(`提交失败：${error.response?.data?.msg || '服务器错误'}`)
    }
  }
}

// 重置表单
const resetForm = () => {
  stockOutFormRef.value?.resetFields()
  Object.keys(form).forEach(key => {
    form[key] = key === 'outQuantity' ? null : (typeof form[key] === 'string' ? '' : null)
  })
}

// 跳转记录页面
const goToStockOutRecords = () => {
  router.push({ name: 'StockOutRecords' })
}

//返回首页方法
const goToHome = () => {
  router.push('/home')  // 跳转到首页路由
}
</script>

<style scoped>

.back-home-container {
  margin-bottom: 15px;
}
.back-home-btn {
  background-color: #f5f7fa;
}


.stock-out-container { padding: 20px; background: #fff; min-height: calc(100vh - 60px); }
.main-card { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.el-form { margin-top: 20px; }
.el-select { width: 100%; }
</style>