// src/utils/encrypt.js
// 导入crypto-js（确保已安装：npm install crypto-js）
import CryptoJS from 'crypto-js'

const md5Encrypt = (password) => {
  if (!password || typeof password !== 'string') {
    console.warn('密码加密失败：无效的密码参数')
    return ''
  }
  try {
    // 生成32位小写MD5加密结果（与后端保持一致）
    return CryptoJS.MD5(password).toString().toLowerCase()
  } catch (error) {
    console.error('密码加密异常：', error)
    return ''
  }
}

export { md5Encrypt } // 导出供其他文件使用