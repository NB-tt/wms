import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { permDirective } from './directives/perm'


// 创建实例
const pinia = createPinia()
const app = createApp(App)

// 全局注册图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局配置
app.config.globalProperties.$filters = {
  formatStatus(status) {
    const statusMap = { 0: '待审批', 1: '已通过', 2: '已驳回' }
    return statusMap[status] || '未知'
  }
}

// 安装插件
app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.directive('perm', permDirective)

// 挂载应用
app.mount('#app')