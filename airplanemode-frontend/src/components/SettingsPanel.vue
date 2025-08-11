<template>
  <div class="settings-panel">
    <!-- 主控制按钮 -->
    <div class="settings-trigger" @click="togglePanel">
      <div class="trigger-icon" :class="{ active: isPanelOpen }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ open: isPanelOpen }">
      <div class="sidebar-content">
        <!-- 画质设置 -->
        <div class="setting-group">
          <StylishButton 
            text="画质设置"
            size="medium"
            :is-active="activeDrawer === 'quality'"
            @click="toggleDrawer('quality')"
          />
        </div>

        <!-- 地图源设置 -->
        <div class="setting-group">
          <StylishButton 
            text="地图源"
            size="medium"
            :is-active="activeDrawer === 'mapSource'"
            @click="toggleDrawer('mapSource')"
          />
        </div>

        <!-- 其他设置 -->
        <div class="setting-group">
          <StylishButton 
            text="视图模式"
            size="medium"
            @click="$emit('toggle2D')"
          />
        </div>
      </div>
    </div>

    <!-- 抽屉框 -->
    <div 
      class="drawer-overlay" 
      :class="{ active: activeDrawer }"
      @click="closeDrawer"
    ></div>

    <!-- 画质抽屉 -->
    <div class="drawer quality-drawer" :class="{ open: activeDrawer === 'quality' }">
      <div class="drawer-header">
        <h3>画质设置</h3>
      </div>
      <div class="drawer-content">
        <div class="quality-options">
          <StylishButton
            v-for="quality in qualitySettings"
            :key="quality.name"
            :text="quality.name"
            size="small"
            :is-active="currentQuality === quality.name"
            :tooltip="quality.description"
            @click="selectQuality(quality)"
          />
        </div>
      </div>
    </div>

    <!-- 地图源抽屉 -->
    <div class="drawer mapSource-drawer" :class="{ open: activeDrawer === 'mapSource' }">
      <div class="drawer-header">
        <h3>地图源</h3>
      </div>
      <div class="drawer-content">
        <div class="mapSource-options">
          <StylishButton
            v-for="source in mapSources"
            :key="source.name"
            :text="source.name"
            size="small"
            :is-active="currentMapSource === source.name"
            :tooltip="source.description"
            @click="selectMapSource(source)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StylishButton from './StylishButton.vue'

// Props
interface Props {
  qualitySettings: any[]
  mapSources: any[]
  currentQuality: string
  currentMapSource: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  qualityChange: [quality: any]
  mapSourceChange: [source: any]
  toggle2D: []
}>()

// 响应式状态
const isPanelOpen = ref(false)
const activeDrawer = ref<string | null>(null)

// 方法
const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
  if (!isPanelOpen.value) {
    activeDrawer.value = null
  }
}

const toggleDrawer = (drawerType: string) => {
  if (activeDrawer.value === drawerType) {
    activeDrawer.value = null
  } else {
    activeDrawer.value = drawerType
  }
}

const closeDrawer = () => {
  activeDrawer.value = null
}

const selectQuality = (quality: any) => {
  emit('qualityChange', quality)
  closeDrawer()
}

const selectMapSource = (source: any) => {
  emit('mapSourceChange', source)
  closeDrawer()
}
</script>

<style scoped>
.settings-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
}

/* 触发按钮 */
.settings-trigger {
  width: 50px;
  height: 50px;
  background: rgba(24, 23, 23, 0.9);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.settings-trigger:hover {
  background: rgba(40, 40, 40, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

/* 汉堡图标 */
.trigger-icon {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.trigger-icon span {
  width: 100%;
  height: 2px;
  background: white;
  border-radius: 1px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.trigger-icon.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.trigger-icon.active span:nth-child(2) {
  opacity: 0;
  transform: scale(0);
}

.trigger-icon.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* 侧边栏 */
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  background: rgba(24, 23, 23, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  transform: translateX(calc(100% - 50px));
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  padding: 60px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-group {
  width: 100%;
}

/* 抽屉遮罩 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: -1;
}

.drawer-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* 抽屉框 */
.drawer {
  position: fixed;
  top: 20px;
  right: 240px;
  width: 300px;
  max-height: calc(100vh - 40px);
  background: rgba(24, 23, 23, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  transform: translateX(100px) scale(0.9);
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.drawer.open {
  transform: translateX(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-header h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.drawer-content {
  padding: 20px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

/* 选项网格 */
.quality-options,
.mapSource-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mapSource-options {
  grid-template-columns: 1fr;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-panel {
    top: 15px;
    right: 15px;
  }
  
  .sidebar {
    width: 180px;
  }
  
  .drawer {
    right: 200px;
    width: 280px;
  }
  
  .quality-options {
    grid-template-columns: 1fr;
  }
}

/* 滚动条样式 */
.drawer-content::-webkit-scrollbar {
  width: 4px;
}

.drawer-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
