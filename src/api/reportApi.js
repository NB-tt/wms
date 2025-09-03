import request from '@/utils/request'

export const reportApi = {
  // 预览报表
  preview: (params) => request.get('/report/preview', { params }),

  // 导出报表
  export: (params) => request.get('/report/export', { params })
}
