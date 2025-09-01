import request from '@/utils/request'

export const statisticsApi = {
  // 物品总数
  getItemTotal: () => {
    console.log('请求物品总数接口')
    return request.get('/statistics/item-total')
  },
  // 今日入库
  getTodayStockIn: () => {
    console.log('请求今日入库接口')
    return request.get('/statistics/today-stock-in')
  },
  // 今日出库
  getTodayStockOut: () => {
    console.log('请求今日出库接口')
    return request.get('/statistics/today-stock-out')
  },
  // 低库存预警数量
  getLowStockCount: () => {  
    console.log('请求低库存数量接口')
    return request.get('/statistics/low-stock')
  },
  // 低库存物品列表
  getLowStockItems: () => {
    console.log('请求低库存物品列表接口')
    return request.get('/statistics/low-stock-items')
  }
}