<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">办公用品仓库管理系统登录</div>
      <el-form
        ref="loginFormRef"
        :model="form"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            clearable
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item class="login-btn-group">
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

// 表单数据
const form = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 表单引用和状态
const loginFormRef = ref(null)
const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

// 登录处理函数
const handleLogin = async () => {
  // 表单验证
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    loading.value = true
    // 调用登录接口
    const res = await userApi.login({
      username: form.username,
      password: form.password
    })

    // 处理登录响应
    if (res.code === 200 && res.data.token) {
      // 存储真实名称（接口返回 realName）
      const userInfo = {
        userId: res.data.userInfo.userId,
        role: res.data.userInfo.role,
        realName: res.data.userInfo.realName,  
        token: res.data.token,
        permissions: res.data.permissions || []  // 存储权限列表
      }

      // 2. 存储到 Pinia
      userStore.setUserInfo(userInfo)

      // 3. 存储到 localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

      ElMessage.success('登录成功')
      // 跳转到首页或之前的页面
      const redirectPath = router.currentRoute.value.query.redirect || '/home'
      router.push(redirectPath)
    } else {
      ElMessage.error(res.msg || '登录失败，请检查账号密码')
    }
  } catch (error) {
    console.error('登录请求失败:', error)
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 350px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 25px;
  color: #303133;
}

.login-form {
  width: 100%;
}

.login-btn-group {
  margin-top: 15px;
}

.login-btn {
  width: 100%;
}
</style>