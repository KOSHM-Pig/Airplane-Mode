import { createApp } from 'vue'
import App from './App.vue'
import './styles/amap-override.css'
import './styles/mobile.css'

// Capacitor 插件导入
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard'
import { StatusBar, Style } from '@capacitor/status-bar'

// 配置状态栏 - 设置为沉浸式模式
StatusBar.setStyle({ style: Style.Dark })
StatusBar.setBackgroundColor({ color: '#000000' })
StatusBar.setOverlaysWebView({ overlay: true })

// 在移动设备上隐藏状态栏
if (window.Capacitor && window.Capacitor.isNativePlatform()) {
  StatusBar.hide()
}

// 配置键盘
Keyboard.setStyle({ style: KeyboardStyle.Dark })

createApp(App).mount('#app')
