<template>
  <div class="not-found">
    <h1>404 - 页面不存在</h1>
    <p>您访问的页面不存在或已被删除。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup>
// 无额外逻辑
</script>

<style scoped>
.not-found {
  padding: 20px;
  text-align: center;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}
h1 {
  color: #f56c6c;
  font-size: 36px;
}
</style>