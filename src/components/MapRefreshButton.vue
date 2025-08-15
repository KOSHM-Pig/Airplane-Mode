<template>
  <div class="refresh-button-container">
    <div
      class="refresh-button"
      :class="{ 'refreshing': isRefreshing }"
      @click="handleRefresh"
      :disabled="isRefreshing"
      :title="refreshTooltip"
    >
      <span v-if="!isRefreshing" class="refresh-icon">🔄</span>
      <span v-else class="refreshing-icon">⏳</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  createMapRefreshManager,
  REFRESH_METHODS 
} from '../utils/mapRefreshUtils.js'

// Props
const props = defineProps({
  map: {
    type: Object,
    default: null
  },
  refreshMethod: {
    type: String,
    default: null,
    validator: (value) => {
      return value === null || Object.values(REFRESH_METHODS).includes(value)
    }
  }
})

// Emits
const emit = defineEmits(['refreshed', 'refreshFailed'])

// 响应式数据
const isRefreshing = ref(false)
const refreshCount = ref(0)
const lastRefreshTime = ref(0)

// 计算属性
const refreshTooltip = computed(() => {
  if (isRefreshing.value) {
    return '正在刷新地图...'
  }
  return `刷新地图 (已刷新 ${refreshCount.value} 次)`
})

// 处理刷新
const handleRefresh = async () => {
  if (!props.map || isRefreshing.value) return

  isRefreshing.value = true
  
  try {
    const refreshManager = createMapRefreshManager(props.map)
    
    // 使用指定的刷新方法或智能刷新
    const success = refreshManager.smartRefresh(props.refreshMethod)
    
    if (success) {
      refreshCount.value++
      lastRefreshTime.value = Date.now()
      
      emit('refreshed', {
        method: props.refreshMethod || 'smart',
        count: refreshCount.value,
        timestamp: lastRefreshTime.value
      })
      
      console.log('手动地图刷新成功')
    } else {
      emit('refreshFailed', {
        method: props.refreshMethod || 'smart',
        timestamp: Date.now()
      })
      
      console.error('手动地图刷新失败')
    }
    
    // 清理管理器
    refreshManager.destroy()
    
  } catch (error) {
    console.error('地图刷新过程中出错:', error)
    emit('refreshFailed', {
      method: props.refreshMethod || 'smart',
      error: error.message,
      timestamp: Date.now()
    })
  } finally {
    // 延迟恢复按钮状态，给用户视觉反馈
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

// 暴露方法给父组件
defineExpose({
  refresh: handleRefresh,
  getRefreshStats: () => ({
    count: refreshCount.value,
    lastTime: lastRefreshTime.value
  })
})
</script>

<style scoped>
.refresh-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.refresh-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.refresh-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.refresh-button.refreshing {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.refresh-icon {
  font-size: 16px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.refresh-button:hover .refresh-icon {
  transform: rotate(180deg);
}

.refreshing-icon {
  font-size: 14px;
  line-height: 1;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .refresh-button {
    width: 36px;
    height: 36px;
  }
  
  .refresh-icon {
    font-size: 14px;
  }
  
  .refreshing-icon {
    font-size: 12px;
  }
}
</style>
