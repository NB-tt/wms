<template>
  <div class="stock-in-container">
    <!-- 返回首页按钮 + 标题 + 表单卡片 -->
    <div class="back-container">
      <el-button type="default" icon="ArrowLeft" @click="goToHome" class="back-btn">
        返回首页
      </el-button>
    </div>

    <h1 class="page-title">物品入库管理</h1>

    <el-card class="form-card">
      <el-form
        ref="stockInFormRef"
        :model="stockInForm"
        :rules="rules"
        label-width="120px"
        class="stock-in-form"
      >
       
        <el-form-item label="物品名称" prop="itemId">
          <el-select v-model="stockInForm.itemId" placeholder="请选择物品" filterable clearable class="w-full">
            <el-option v-for="item in itemList" :key="item.itemId" :label="item.name" :value="item.itemId"></el-option>
          </el-select>
          <span v-if="itemListLoading" class="loading-text">加载中...</span>
        </el-form-item>

        <el-form-item label="入库数量" prop="inQuantity">
          <el-input v-model.number="stockInForm.inQuantity" type="number" min="1" placeholder="请输入入库数量"></el-input>
        </el-form-item>

        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker v-model="stockInForm.purchaseDate" type="datetime" :max="new Date()" placeholder="选择采购日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD HH:mm:ss"></el-date-picker>
        </el-form-item>

        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="stockInForm.supplierId" placeholder="请选择供应商" filterable clearable class="w-full">
            <el-option v-for="supplier in supplierList" :key="supplier.supplierId" :label="supplier.name" :value="supplier.supplierId"></el-option>
          </el-select>
          <span v-if="supplierListLoading" class="loading-text">加载中...</span>
        </el-form-item>

        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="stockInForm.batchNo" placeholder="输入批次号" maxlength="50"></el-input>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="stockInForm.remark" type="textarea" rows="3" placeholder="输入入库备注" maxlength="200"></el-input>
        </el-form-item>

        <el-form-item class="form-actions">
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交入库</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="text" @click="goToRecords">查看入库记录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>

  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { stockInApi } from '@/api/stockIn'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const stockInFormRef = ref(null)
  const submitLoading = ref(false)
  const itemListLoading = ref(true)
  const supplierListLoading = ref(true)

  const stockInForm = reactive({
    itemId: null,
    inQuantity: 1,
    purchaseDate: '',
    supplierId: null,
    batchNo: '',
    remark: ''
  })

  const itemList = ref([])
  const supplierList = ref([])

  const rules = reactive({
    itemId: [{ required: true, message: '请选择物品名称', trigger: 'change' }],
    inQuantity: [
      { required: true, message: '请输入入库数量', trigger: 'blur' },
      { type: 'number', min: 1, message: '入库数量必须大于0', trigger: 'blur' }
    ],
    purchaseDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
    supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
    batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }]
  })

  const init = async () => {
    try {
      const timestamp = new Date().getTime()
      const [itemsRes, suppliersRes] = await Promise.all([
        stockInApi.getItems({ _t: timestamp, pageNum: 1, pageSize: 1000 }),
        stockInApi.getSuppliers({ _t: timestamp })
      ])

      const itemData = itemsRes?.data || []
      itemList.value = itemData.map(item => ({ ...item, itemId: Number(item.itemId) }))

      const supplierData = suppliersRes?.data || []
      supplierList.value = supplierData.map(supplier => ({ ...supplier, supplierId: Number(supplier.supplierId) }))
    } catch (error) {
      console.error('初始化数据失败:', error)
      ElMessage.error('数据加载失败，请刷新页面重试')
    } finally {
      itemListLoading.value = false
      supplierListLoading.value = false
    }
  }

  const handleSubmit = async () => {
    try {
      await stockInFormRef.value.validate()
      submitLoading.value = true
      const res = await stockInApi.submitStockIn(stockInForm)

      if (res.code === 200) {
        ElMessage.success('入库单提交成功！')
        resetForm()
      } else {
        ElMessage.error(res.msg || '提交失败，请重试')
      }
    } catch (error) {
      if (error.name !== 'Error') ElMessage.error('表单验证失败，请检查输入')
    } finally {
      submitLoading.value = false
    }
  }

  const resetForm = () => {
    stockInFormRef.value.resetFields()
    stockInForm.inQuantity = 1
  }

  const goToRecords = () => {
    router.push({ name: 'StockInRecords' })
  }

  const goToHome = () => {
    router.push('/home')
  }

  onMounted(() => init())
</script>

<style scoped>

.stock-in-container {
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

/* 标题样式 */
.page-title {
  text-align: left; 
  margin-bottom: 20px; 
  color: #1d2129;  
  font-size: 22px;  
  font-weight: 600;
}

/* 表单卡片样式 */
.form-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);  
  border-radius: 8px; 
  background: #fff;  
  padding: 25px;  
}

/* 表单内部样式 */
.stock-in-form {
  width: 100%;  
  margin-top: 10px;
}

/* 输入框/下拉框占满宽度 */
.el-select, .el-input {
  width: 100% !important;  /*  确保所有输入控件占满列宽 */
}


.loading-text {
  color: #666;
  margin-left: 10px;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;  
  gap: 15px;
  margin-top: 25px;
  margin-left: 0;  
}
</style>
