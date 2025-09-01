import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        // 关键修改：移除rewrite或修改为保留/api前缀
        rewrite: (path) => path, // 不再移除/api前缀
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            console.log(`代理请求路径: ${proxyReq.path}`) // 调试日志
          })
        }
      }
    }
  }
})