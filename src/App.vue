<template>
  <div id="app">
    <!-- 登录页面 -->
    <LoginPage
      v-if="!isLoggedIn"
      @login-success="handleLoginSuccess"
    />

    <!-- 地图组件 -->
    <MapComponent
      v-else
      ref="mapComponent"
    />
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import MapComponent from './components/MapComponent.vue'

export default {
  name: 'App',
  components: {
    MapComponent,
    LoginPage
  },
  setup() {
    const isLoggedIn = ref(false)
    const userInfo = ref(null)

    // 检查本地存储的登录状态
    onMounted(() => {
      const savedLoginState = localStorage.getItem('isLoggedIn')
      const savedUserInfo = localStorage.getItem('userInfo')

      if (savedLoginState === 'true' && savedUserInfo) {
        isLoggedIn.value = true
        userInfo.value = JSON.parse(savedUserInfo)
      }
    })

    const handleLoginSuccess = (userData) => {
      isLoggedIn.value = true
      userInfo.value = userData

      // 保存登录状态到本地存储
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userInfo', JSON.stringify(userData))

      console.log('登录成功:', userData)
    }

    const handleLogout = () => {
      isLoggedIn.value = false
      userInfo.value = null

      // 清除本地存储
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userInfo')
    }

    return {
      isLoggedIn,
      userInfo,
      handleLoginSuccess,
      handleLogout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  width: 100vw;
  background: #000;
  overflow: hidden;
}
.amap-logo {
display: none; /* 隐藏高德地图 Logo */
opacity: 0 !important; /* 确保完全透明 */
}

.amap-copyright {
opacity: 0; /* 隐藏版权信息 */
}
</style>
