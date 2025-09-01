import request from '@/utils/request'

/**
 * 出库相关API封装
 * 所有出库接口调用都集中在此，便于维护
 */
export const stockOutApi = {
  /**
   * 获取物品列表（供前端下拉）
   * @returns Promise<Result>
   */
  getItems: () => request.get('/stock-out/items'),

  /**
   * 提交出库单
   * @param {StockOutDTO} data - 出库请求参数
   * @returns Promise<Result>
   */
  submitStockOut: (data) => request.post('/stock-out/submit', data),

  /**
   * 分页查询出库记录
   * @param {Object} params - 查询参数
   * @param {string} [params.keyword] - 模糊搜索关键词
   * @param {number} [params.status] - 审批状态（0=待审批，1=已通过，2=已驳回）
   * @param {number} [params.pageNum=1] - 当前页码
   * @param {number} [params.pageSize=10] - 每页条数
   * @returns Promise<Result<IPage<StockOut>>>
   */
  getRecords: (params) => request.get('/stock-out/records', { params }),

  /**
   * 审批出库单
   * @param {StockOutApproveDTO} data - 审批参数
   * @returns Promise<Result<boolean>>
   */
  approveStockOut: (data) => request.post('/stock-out/approve', data),

  /**
   * 撤销出库单
   * @param {StockOutCancelDTO} data - 撤销参数
   * @returns Promise<Result<boolean>>
   */
  cancelStockOut: (data) => request.post('/stock-out/cancel', data)
}