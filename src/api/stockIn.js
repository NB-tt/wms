import request from '@/utils/request'

/**
 * 入库相关API封装
 */
export const stockInApi = {
  // 获取物品列表（请求路径：/api/items → 匹配后端ItemController）
  getItems: (params) => request.get('/stock-in/items', { params }),

  // 获取供应商列表（请求路径：/api/suppliers → 匹配后端SupplierController）
  getSuppliers: (params) => request.get('stock-in/suppliers', { params }),

  // 提交入库单（请求路径：/api/stock-in/submit → 匹配后端StockInController）
  submitStockIn: (data) => request.post('/stock-in/submit', data),

  // 分页查询入库记录
  getRecords: (params) => request.get('/stock-in/records', { params }),

  // 审批入库单
  approveStockIn: (data) => request.post('/stock-in/approve', data),

  // 撤销入库单
  cancelStockIn: (data) => request.post('/stock-in/cancel', data)
}