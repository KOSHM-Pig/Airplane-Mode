<template>
  <div class="layer-selector">
    <BaseButton
      :text="currentLayerName"
      :width="50"
      :height="50"
      :loading="isLoading"
      @click="switchLayer"
    />
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  LAYER_CONFIGS,
  LAYER_TYPES,
  MapLayerManager,
  validateAmapAPI
} from '../utils/mapLayerUtils.js'
import { createMapRefreshManager } from '../utils/mapRefreshUtils.js'
import BaseButton from './BaseButton.vue'

// Props
const props = defineProps({
  map: {
    type: Object,
    default: null
  },
  isDarkMode: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['layerChanged'])

// 响应式数据
const currentLayerIndex = ref(0)
const isLoading = ref(false)

// 图层配置 - 按顺序切换（四种模式）
const layers = [
  {
    type: LAYER_TYPES.STANDARD,
    ...LAYER_CONFIGS[LAYER_TYPES.STANDARD]
  },
  {
    type: LAYER_TYPES.DARK,
    ...LAYER_CONFIGS[LAYER_TYPES.DARK]
  },
  {
    type: LAYER_TYPES.SATELLITE,
    ...LAYER_CONFIGS[LAYER_TYPES.SATELLITE]
  },
  {
    type: LAYER_TYPES.ROADNET,
    ...LAYER_CONFIGS[LAYER_TYPES.ROADNET]
  }
]

// 图层管理器
let layerManager = null
// 地图刷新管理器
let refreshManager = null

// 计算当前图层名称
const currentLayerName = computed(() => {
  return layers[currentLayerIndex.value]?.name || '标准'
})

// 计算当前图层图标
const currentLayerIcon = computed(() => {
  return layers[currentLayerIndex.value]?.icon || '🗺️'
})

// 初始化图层管理器
const initLayerManager = () => {
  if (props.map && !layerManager) {
    if (!validateAmapAPI()) {
      console.error('高德地图API验证失败')
      return false
    }
    layerManager = new MapLayerManager(props.map)
    refreshManager = createMapRefreshManager(props.map)
    return true
  }
  return !!layerManager
}

// 顺序切换图层
const switchLayer = () => {
  console.log('🔄 图层切换按钮被点击')

  if (isLoading.value) {
    console.log('⏳ 正在加载中，跳过此次点击')
    return
  }

  isLoading.value = true

  // 切换到下一个图层
  const oldIndex = currentLayerIndex.value
  currentLayerIndex.value = (currentLayerIndex.value + 1) % layers.length
  const currentLayer = layers[currentLayerIndex.value]

  console.log(`🔄 从图层${oldIndex}切换到图层${currentLayerIndex.value}: ${currentLayer.name}`)

  // 直接发送事件给父组件，让父组件处理地图重建
  emit('layerChanged', {
    type: currentLayer.type,
    name: currentLayer.name,
    description: currentLayer.description,
    icon: currentLayer.icon
  })

  console.log(`✅ 图层切换请求已发送: ${currentLayer.name}`)

  // 延迟重置加载状态，给地图重建一些时间
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

// 监听地图实例变化，重新初始化图层管理器
watch(() => props.map, (newMap) => {
  if (newMap && !layerManager) {
    initLayerManager()
  }
}, { immediate: true })

// 组件销毁时清理图层管理器
onUnmounted(() => {
  if (layerManager) {
    layerManager.destroy()
    layerManager = null
  }
  if (refreshManager) {
    refreshManager.destroy()
    refreshManager = null
  }
})
</script>

<style scoped>
.layer-selector {
  position: relative;
  z-index: 1000;
}
</style>
