
// 导入样式文件
import './assets/main.css'
// 导入Cesium样式
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
