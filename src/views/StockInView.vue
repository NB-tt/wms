<template>
  <div class="stock-in-container">
    <h1 class="page-title">物品入库管理</h1>
    
    <el-card class="form-card">
      <el-form
        ref="stockInFormRef"
        :model="stockInForm"
        :rules="rules"
        label-width="120px"
        class="stock-in-form"
      >
        <!-- 物品名称 -->
        <el-form-item label="物品名称" prop="itemId">
          <el-select
            v-model="stockInForm.itemId"
            placeholder="请选择物品"
            filterable
            clearable
            class="w-full"
          >
            <el-option
              v-for="item in itemList"
              :key="item.itemId"
              :label="item.name"
              :value="item.itemId"
            ></el-option>
          </el-select>
          <span v-if="itemListLoading" class="loading-text">加载中...</span>
        </el-form-item>

        <!-- 入库数量 -->
        <el-form-item label="入库数量" prop="inQuantity">
          <el-input
            v-model.number="stockInForm.inQuantity"
            type="number"
            min="1"
            placeholder="请输入入库数量"
          ></el-input>
        </el-form-item>

        <!-- 采购日期 -->
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker
            v-model="stockInForm.purchaseDate"
            type="datetime"
            :max="new Date()" 
            placeholder="选择采购日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD HH:mm:ss" 
          ></el-date-picker>
        </el-form-item>

        <!-- 供应商 -->
        <el-form-item label="供应商" prop="supplierId">
          <el-select
            v-model="stockInForm.supplierId"
            placeholder="请选择供应商"
            filterable
            clearable
            class="w-full"
          >
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.supplierId"
              :label="supplier.name"
              :value="supplier.supplierId"
            ></el-option>
          </el-select>
          <span v-if="supplierListLoading" class="loading-text">加载中...</span>
        </el-form-item>

        <!-- 批次号 -->
        <el-form-item label="批次号" prop="batchNo">
          <el-input
            v-model="stockInForm.batchNo"
            placeholder="输入批次号"
            maxlength="50"
          ></el-input>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input
            v-model="stockInForm.remark"
            type="textarea"
            rows="3"
            placeholder="输入入库备注"
            maxlength="200"
          ></el-input>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="form-actions">
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            提交入库
          </el-button>
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

// 表单数据（itemId和supplierId初始值为null，确保数字类型）
const stockInForm = reactive({
  itemId: null,        // 物品ID（数字类型）
  inQuantity: 1,       // 入库数量（默认1，数字类型）
  purchaseDate: '',    // 采购日期（字符串类型）
  supplierId: null,    // 供应商ID（数字类型）
  batchNo: '',         // 批次号（字符串类型）
  remark: ''           // 备注（字符串类型）
})

// 物品和供应商列表（用于下拉选择）
const itemList = ref([])
const supplierList = ref([])

// 表单验证规则
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

// 初始化：加载物品和供应商列表
const init = async () => {
  try {
    const timestamp = new Date().getTime()
    // 并行加载物品和供应商列表（API路径：/stock-in/items 和 /stock-in/suppliers）
    const [itemsRes, suppliersRes] = await Promise.all([
      stockInApi.getItems({ _t: timestamp, pageNum: 1, pageSize: 1000 }),
      stockInApi.getSuppliers({ _t: timestamp })
    ])

    // 1. 解析物品列表（从 res.data.data 提取数据）
    // 后端返回格式：{ code: 200, msg: "操作成功", data: [ {itemId: 1, ...}, ... ] }
    const itemData = itemsRes?.data || []  // 提取 Result.data 中的物品数组
    itemList.value = itemData.map(item => ({
      ...item,
      itemId: Number(item.itemId)  // 强制转换itemId为数字（避免类型错误）
    }))

    // 2. 解析供应商列表（从 res.data.data 提取数据）
    const supplierData = suppliersRes?.data || []  // 提取 Result.data 中的供应商数组
    supplierList.value = supplierData.map(supplier => ({
      ...supplier,
      supplierId: Number(supplier.supplierId)  // 强制转换supplierId为数字
    }))

    // 调试日志（确认数据是否正确加载）
    console.log('物品列表数据:', itemList.value)  // 输出条物品数据
    console.log('供应商列表数据:', supplierList.value)  // 输出条供应商数据

  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('数据加载失败，请刷新页面重试')
  } finally {
    itemListLoading.value = false
    supplierListLoading.value = false
  }
}

// 提交入库单
const handleSubmit = async () => {
  try {
    await stockInFormRef.value.validate()
    submitLoading.value = true
    
    const res = await stockInApi.submitStockIn(stockInForm)
    if (res.code === 200) {  // 后端返回 Result.success(...)
      ElMessage.success('入库单提交成功！')
      resetForm()  // 提交成功后重置表单
    } else {
      ElMessage.error(res.msg || '提交失败，请重试')
    }
  } catch (error) {
    if (error.name !== 'Error') ElMessage.error('表单验证失败，请检查输入')
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  stockInFormRef.value.resetFields()
  stockInForm.inQuantity = 1  // 重置数量为1
}

// 跳转到入库记录页面
const goToRecords = () => {
  router.push({ name: 'StockInRecords' })
}

// 页面挂载时初始化数据
onMounted(() => init())
</script>

<style scoped>
.stock-in-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stock-in-form {
  padding: 20px 0;
}

.loading-text {
  color: #666;
  margin-left: 10px;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
</style>