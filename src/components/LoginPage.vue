<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 标题区域 -->
      <div class="header">
        <h1 class="title">飞行模式</h1>
        <p class="subtitle">Airplane Mode</p>
      </div>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <BaseInput
            v-model="loginForm.username"
            label="用户名"
            placeholder="请输入用户名"
            :required="true"
            :width="'100%'"
            :height="52"
          />
        </div>

        <div class="form-group">
          <BaseInput
            v-model="loginForm.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :required="true"
            :width="'100%'"
            :height="52"
          />
        </div>

        <BaseButton
          :text="isLoading ? '登录中...' : '登录'"
          :disabled="isLoading"
          :width="'100%'"
          :height="52"
          @click="handleLogin"
        />
      </form>

      <!-- 底部信息 -->
      <div class="footer">
        <p class="version">Version 1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

export default {
  name: 'LoginPage',
  components: {
    BaseButton,
    BaseInput
  },
  emits: ['login-success'],
  setup(props, { emit }) {
    const loginForm = ref({
      username: '',
      password: ''
    })
    
    const isLoading = ref(false)

    const handleLogin = async () => {
      if (!loginForm.value.username || !loginForm.value.password) {
        return
      }

      isLoading.value = true
      
      try {
        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 简单的验证逻辑（实际项目中应该调用API）
        if (loginForm.value.username && loginForm.value.password) {
          emit('login-success', {
            username: loginForm.value.username
          })
        }
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    return {
      loginForm,
      isLoading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 32px;
  font-weight: 300;
  color: #fff;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 300;
  letter-spacing: 1px;
}

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* 平板端适配 */
@media (min-width: 768px) {
  .login-card {
    max-width: 480px;
    padding: 48px 40px;
  }
  
  .title {
    font-size: 36px;
  }
  
  .form-input,
  .login-btn {
    height: 52px;
  }
}

/* 大屏适配 */
@media (min-width: 1024px) {
  .login-card {
    max-width: 520px;
    padding: 56px 48px;
  }
}

/* 移动端安全区域适配 */
@media (max-width: 767px) {
  .login-container {
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    padding-top: max(20px, env(safe-area-inset-top));
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
}
</style>
