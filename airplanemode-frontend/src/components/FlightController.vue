<template>
  <div class="flight-controller">
    <!-- 交互式机场选择器 -->
    <InteractiveAirportSelector
      v-if="!isFlying"
      :viewer="props.viewer"
      :is-flying="isFlying"
      @start-flight="startCustomFlight"
    />

    <!-- 停止飞行按钮 -->
    <div v-if="isFlying" class="stop-flight-control">
      <GlowButton
        text="⏹️ 停止飞行"
        @click="stopFlight"
      />
    </div>

    <!-- 飞行信息面板 -->
    <div v-if="isFlying" class="flight-info">
      <div class="info-header">飞行信息</div>
      <div class="info-content">
        <div class="info-row">
          <span class="info-label">航线:</span>
          <span class="info-value">{{ currentRoute?.name || '未知' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">进度:</span>
          <span class="info-value">{{ flightStatus.progress }}%</span>
        </div>
        <div class="info-row">
          <span class="info-label">剩余时间:</span>
          <span class="info-value">{{ flightStatus.remainingTime }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前速度:</span>
          <span class="info-value">{{ flightStatus.currentSpeed }} km/h</span>
        </div>
        <div class="info-row">
          <span class="info-label">当前高度:</span>
          <span class="info-value">{{ flightStatus.currentAltitude }} m</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'
import { onMounted, onUnmounted, ref } from 'vue'
import { type Airport } from '../data/airports'
import { FlightService, type FlightRoute, type FlightStatus } from '../services/FlightService'
import GlowButton from './GlowButton.vue'
import InteractiveAirportSelector from './InteractiveAirportSelector.vue'

// Props
interface Props {
  viewer: Cesium.Viewer | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'start-transition': []
  'end-transition': []
}>()

// 响应式状态
const isFlying = ref(false)
const currentRoute = ref<FlightRoute | null>(null)
const flightStatus = ref<FlightStatus>({
  isFlying: false,
  progress: 0,
  remainingTime: '00:00:00',
  currentSpeed: 0,
  currentAltitude: 0,
  elapsedTime: 0
})

// 飞行服务实例
let flightService: FlightService | null = null
let statusUpdateInterval: number | null = null

// 初始化飞行服务
const initFlightService = () => {
  if (props.viewer && !flightService) {
    flightService = new FlightService(props.viewer)
    startStatusMonitoring()
    console.log('✅ [FlightController] 飞行控制器初始化完成')
  }
}

// 监听viewer变化
onMounted(() => {
  // 如果viewer已经存在，立即初始化
  if (props.viewer) {
    initFlightService()
  } else {
    // 否则等待viewer初始化
    const checkViewer = setInterval(() => {
      if (props.viewer) {
        initFlightService()
        clearInterval(checkViewer)
      }
    }, 100)

    // 10秒后停止检查
    setTimeout(() => {
      clearInterval(checkViewer)
    }, 10000)
  }
})

// 清理
onUnmounted(() => {
  stopStatusMonitoring()
  if (flightService) {
    flightService.stopFlight()
  }
})

// 开始飞行
const startFlight = async (routeId: string) => {
  // 确保飞行服务已初始化
  if (!flightService) {
    console.log('🔄 [FlightController] 尝试初始化飞行服务...')
    initFlightService()

    if (!flightService) {
      console.error('❌ [FlightController] 飞行服务初始化失败')
      return
    }
  }

  try {
    console.log(`🛫 [FlightController] 开始飞行: ${routeId}`)
    
    const success = await flightService.startFlight(routeId)
    
    if (success) {
      isFlying.value = true
      currentRoute.value = flightService.getRouteById(routeId)
      console.log('✅ [FlightController] 飞行启动成功')
    } else {
      console.error('❌ [FlightController] 飞行启动失败')
    }
  } catch (error) {
    console.error('❌ [FlightController] 飞行启动异常:', error)
  }
}

// 停止飞行
const stopFlight = () => {
  if (!flightService) return

  flightService.stopFlight()
  isFlying.value = false
  currentRoute.value = null
  console.log('🛫 [FlightController] 飞行已停止')
}

// 开始自定义飞行
const startCustomFlight = async (departure: Airport, destination: Airport) => {
  // 确保飞行服务已初始化
  if (!flightService) {
    console.log('🔄 [FlightController] 尝试初始化飞行服务...')
    initFlightService()

    if (!flightService) {
      console.error('❌ [FlightController] 飞行服务初始化失败')
      return
    }
  }

  try {
    console.log(`🛫 [FlightController] 开始自定义飞行: ${departure.code} → ${destination.code}`)

    // 开始黑场过渡
    console.log('🎬 [FlightController] 开始黑场过渡')
    emit('start-transition')

    // 等待过渡动画完成
    await new Promise(resolve => setTimeout(resolve, 1000))

    const success = await flightService.startCustomFlight(departure.code, destination.code)

    if (success) {
      isFlying.value = true
      // 获取创建的自定义航线
      const customRouteId = `${departure.code}-${destination.code}`
      currentRoute.value = flightService.getRouteById(customRouteId) || flightService.createCustomRoute(departure.code, destination.code)
      console.log('✅ [FlightController] 自定义飞行启动成功')

      // 等待一下让相机跟踪生效，然后结束过渡
      setTimeout(() => {
        console.log('🎬 [FlightController] 结束黑场过渡')
        emit('end-transition')
      }, 1500)
    } else {
      console.error('❌ [FlightController] 自定义飞行启动失败')
      emit('end-transition')
    }
  } catch (error) {
    console.error('❌ [FlightController] 自定义飞行启动异常:', error)
    emit('end-transition')
  }
}

// 开始状态监控
const startStatusMonitoring = () => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval)
  }

  statusUpdateInterval = setInterval(() => {
    if (flightService && isFlying.value) {
      const status = flightService.getFlightStatus()
      flightStatus.value = { ...status }
      
      // 检查飞行是否完成
      if (!status.isFlying && isFlying.value) {
        isFlying.value = false
        currentRoute.value = null
        console.log('🛬 [FlightController] 飞行已完成')
      }
    }
  }, 1000) as unknown as number
}

// 停止状态监控
const stopStatusMonitoring = () => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval)
    statusUpdateInterval = null
  }
}
</script>

<style scoped>
.flight-controller {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
}

.flight-controller > * {
  pointer-events: auto;
}

/* 停止飞行按钮 */
.stop-flight-control {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 快捷航线面板 */
.quick-routes {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-routes-header h4 {
  margin: 0 0 10px 0;
  color: #00d4ff;
  font-size: 14px;
  text-align: center;
}

.flight-controls {
  display: flex;
  gap: 8px;
  flex-direction: column;
}

/* 飞行信息面板 - 左下角 */
.flight-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.9);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 280px;
  max-width: 350px;
}

.info-header {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 8px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #cccccc;
  font-size: 14px;
  min-width: 80px;
}

.info-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .quick-routes {
    bottom: 10px;
    right: 10px;
    left: auto;
    width: auto;
  }

  .flight-controls {
    flex-direction: column;
    gap: 6px;
  }

  .flight-info {
    bottom: 10px;
    left: 10px;
    right: 120px; /* 为快捷航线按钮留出空间 */
    min-width: auto;
    max-width: none;
  }
}
</style>
