<template>
  <div class="forbidden-container">
    <el-empty 
      description="您没有访问该页面的权限" 
      :image-size="120"
    >
      <template #image>
        <el-icon style="font-size: 120px; color: #ff4d4f;">
          <WarningFilled />  <!-- 图标名称 WarningFilled -->
        </el-icon>
      </template>
      <el-button 
        type="primary" 
        @click="goHome"
        style="margin-top: 20px;"
      >
        返回首页
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'  

const router = useRouter()

const goHome = () => {
  router.push('/home')  // 返回首页
}
</script>

<style scoped>
.forbidden-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}
</style>