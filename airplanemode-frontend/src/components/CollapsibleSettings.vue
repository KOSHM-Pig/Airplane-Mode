<template>
  <div class="collapsible-settings" :class="{ expanded: isExpanded }">
    <!-- 主按钮 -->
    <button class="settings-toggle-btn" @click="toggleSettings">
      <span class="toggle-icon">{{ isExpanded ? '>' : '<' }}</span>
    </button>
    
    <!-- 展开的选项 -->
    <div class="settings-options" v-show="isExpanded">
      <div class="settings-section">
        <span class="section-label">画质</span>
        <div class="option-buttons">
          <button 
            v-for="quality in qualitySettings" 
            :key="quality.name"
            class="option-btn"
            :class="{ active: currentQuality === quality.name }"
            @click="$emit('quality-change', quality)"
          >
            {{ quality.name }}
          </button>
        </div>
      </div>
      
      <div class="settings-section">
        <span class="section-label">地图源</span>
        <div class="option-buttons">
          <button 
            v-for="source in mapSources" 
            :key="source.name"
            class="option-btn"
            :class="{ active: currentMapSource === source.name }"
            @click="$emit('map-source-change', source)"
          >
            {{ source.name }}
          </button>
        </div>
      </div>
      
      <div class="settings-section">
        <button class="option-btn" @click="$emit('toggle2D')">
          切换2D视图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface Props {
  qualitySettings: Array<{
    name: string
    description: string
    scale: number
    tileLoadPolicy: string
    maximumScreenSpaceError: number
    tileCacheSize: number
  }>
  mapSources: Array<{
    name: string
    description: string
    url?: string
    provider: string
    accessToken?: string
  }>
  currentQuality: string
  currentMapSource: string
}

defineProps<Props>()

// Emits
defineEmits<{
  'quality-change': [quality: any]
  'map-source-change': [source: any]
  'toggle2D': []
}>()

// State
const isExpanded = ref(false)

// Methods
const toggleSettings = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
/* 可折叠设置按钮 - 右上角 */
.collapsible-settings {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.settings-toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.settings-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.toggle-icon {
  font-size: 18px;
  font-weight: bold;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.collapsible-settings.expanded .toggle-icon {
  transform: rotate(180deg);
}

.settings-options {
  position: absolute;
  top: 0;
  right: 60px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
  animation: slideInLeft 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: block;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  opacity: 0.9;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.option-btn.active {
  background: rgba(0, 188, 212, 0.8);
  border-color: rgba(0, 188, 212, 1);
  color: white;
}

.option-btn.active:hover {
  background: rgba(0, 150, 170, 0.9);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .collapsible-settings {
    top: 10px;
    right: 10px;
  }
  
  .settings-toggle-btn {
    width: 45px;
    height: 45px;
  }
  
  .settings-options {
    right: 55px;
    min-width: calc(100vw - 80px);
    max-width: calc(100vw - 80px);
  }
}
</style>
