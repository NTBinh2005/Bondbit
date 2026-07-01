// utils/errorHelper.ts
export function getErrorMessage(e: any, fallback = 'Đã có lỗi xảy ra'): string {
  if (typeof e.response?.data === 'string') return e.response.data
  if (typeof e.response?.data?.message === 'string') return e.response.data.message
  if (typeof e.message === 'string') return e.message
  return fallback
}