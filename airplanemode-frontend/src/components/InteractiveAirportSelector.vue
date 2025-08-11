<template>
  <div class="interactive-airport-selector">
    <!-- 机场选择面板 -->
    <div v-if="!selectedAirport" class="airport-selection-panel">
      <div class="panel-header">
        <h3>🌍 选择起始机场</h3>
        <p>点击地图上的机场或从列表中选择</p>
      </div>
      
      <div class="airport-list">
        <div 
          v-for="airport in majorAirports" 
          :key="airport.id"
          class="airport-item"
          @click="selectAirport(airport)"
        >
          <div class="airport-icon">✈️</div>
          <div class="airport-info">
            <div class="airport-code">{{ airport.code }}</div>
            <div class="airport-name">{{ airport.name }}</div>
            <div class="airport-location">{{ airport.city }}, {{ airport.country }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 半径控制面板 -->
    <div v-if="selectedAirport" class="radius-control-panel">
      <div class="panel-header">
        <h3>🎯 {{ selectedAirport.name }}</h3>
        <button class="back-button" @click="resetSelection">← 重新选择</button>
      </div>
      
      <div class="radius-control">
        <label class="control-label">飞行半径 (飞行时间: {{ estimatedFlightTime }})</label>
        <div class="slider-container">
          <input
            type="range"
            v-model="flightRadius"
            :min="minRadius"
            :max="maxRadius"
            :step="radiusStep"
            class="radius-slider"
            @input="updateRadius"
          @change="updateRadius"
          />
          <div class="slider-labels">
            <span>{{ minRadius }}km</span>
            <span>{{ maxRadius }}km</span>
          </div>
        </div>
        <div class="radius-info">
          <span class="current-radius">当前半径: {{ flightRadius }}km</span>
        </div>
      </div>
    </div>

    <!-- 底部机场抽屉 -->
    <div 
      v-if="selectedAirport && nearbyAirports.length > 0" 
      class="airport-drawer"
      :class="{ expanded: isDrawerExpanded }"
    >
      <div class="drawer-handle" @click="toggleDrawer">
        <div class="handle-bar"></div>
        <span class="drawer-title">
          范围内机场 ({{ nearbyAirports.length }})
        </span>
      </div>
      
      <div class="drawer-content">
        <div class="airport-cards">
          <div 
            v-for="airport in nearbyAirports" 
            :key="airport.id"
            class="airport-card"
            @click="selectDestination(airport)"
          >
            <div class="card-header">
              <div class="airport-marker">✈️ {{ airport.code }}</div>
              <div class="distance-info">{{ Math.round(airport.distance) }}km</div>
            </div>
            <div class="card-body">
              <h4 class="airport-name">{{ airport.name }}</h4>
              <p class="airport-location">{{ airport.city }}, {{ airport.country }}</p>
              <p class="airport-description">{{ airport.description }}</p>
              <div class="flight-estimate">
                <span class="flight-time">预计飞行: {{ airport.estimatedTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'
import { computed, onUnmounted, ref, watch } from 'vue'
import { airports, calculateDistanceByCoords, type Airport } from '../data/airports'

// Props
interface Props {
  viewer: Cesium.Viewer | null
  isFlying: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'start-flight': [departure: Airport, destination: Airport]
}>()

// 响应式状态
const selectedAirport = ref<Airport | null>(null)
const flightRadius = ref(2000) // 默认2000km
const isDrawerExpanded = ref(false)

// 半径控制参数
const minRadius = 500
const maxRadius = 8000
const radiusStep = 100

// Cesium相关
let airportMarkers: Cesium.Entity[] = []
let radiusCircle: Cesium.Entity | null = null

// 主要机场列表（用于初始选择）
const majorAirports = computed(() => {
  return airports.slice(0, 20) // 显示前20个主要机场
})

// 计算预估飞行时间
const estimatedFlightTime = computed(() => {
  const averageSpeed = 800 // km/h
  const hours = flightRadius.value / averageSpeed
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`
  } else {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}小时${m}分钟`
  }
})

// 计算范围内的机场
const nearbyAirports = computed(() => {
  if (!selectedAirport.value) {
    console.log('📍 [InteractiveAirportSelector] 没有选中的机场，返回空数组')
    return []
  }

  console.log('🔍 [InteractiveAirportSelector] 计算范围内机场，当前半径:', flightRadius.value, 'km')
  console.log('📍 [InteractiveAirportSelector] 选中机场:', selectedAirport.value.code)

  const result = airports
    .filter(airport => airport.id !== selectedAirport.value!.id)
    .map(airport => {
      const distance = calculateDistanceByCoords(
        selectedAirport.value!.latitude,
        selectedAirport.value!.longitude,
        airport.latitude,
        airport.longitude
      )

      const averageSpeed = 800 // km/h
      const flightTimeHours = distance / averageSpeed
      const hours = Math.floor(flightTimeHours)
      const minutes = Math.round((flightTimeHours - hours) * 60)

      return {
        ...airport,
        distance,
        estimatedTime: hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`
      }
    })
    .filter(airport => airport.distance <= flightRadius.value)
    .sort((a, b) => a.distance - b.distance)

  console.log('✅ [InteractiveAirportSelector] 找到范围内机场数量:', result.length)
  if (result.length > 0) {
    console.log('📋 [InteractiveAirportSelector] 前5个机场:', result.slice(0, 5).map(a => `${a.code}(${a.distance.toFixed(0)}km)`))
  }

  return result
})

// 选择机场
const selectAirport = (airport: Airport) => {
  selectedAirport.value = airport
  flyToAirport(airport)
  addAirportMarker(airport)
  updateRadiusCircle()
  updateNearbyAirportMarkers()
}

// 重置选择
const resetSelection = () => {
  selectedAirport.value = null
  clearAllMarkers()
  isDrawerExpanded.value = false
}

// 切换抽屉展开状态
const toggleDrawer = () => {
  isDrawerExpanded.value = !isDrawerExpanded.value
}

// 更新半径
const updateRadius = () => {
  updateRadiusCircle()
  updateNearbyAirportMarkers()
}

// 选择目的地
const selectDestination = (destination: Airport) => {
  if (selectedAirport.value) {
    emit('start-flight', selectedAirport.value, destination)
  }
}

// Cesium相关方法
const flyToAirport = (airport: Airport) => {
  if (!props.viewer) return
  
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      airport.longitude, 
      airport.latitude, 
      500000 // 500km高度
    ),
    duration: 2.0
  })
}

const addAirportMarker = (airport: Airport) => {
  if (!props.viewer) return

  const marker = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(airport.longitude, airport.latitude),
    billboard: {
      image: '/airplane-icon.svg',
      scale: 1.2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      color: Cesium.Color.CYAN
    },
    label: {
      text: airport.code,
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -50)
    }
  })

  airportMarkers.push(marker)
}

const updateRadiusCircle = () => {
  if (!props.viewer || !selectedAirport.value) {
    console.log('❌ [InteractiveAirportSelector] 无法更新半径圆圈 - viewer或selectedAirport不可用')
    return
  }

  console.log('🎯 [InteractiveAirportSelector] 更新半径圆圈，半径:', flightRadius.value, 'km')

  // 移除旧的圆圈
  if (radiusCircle) {
    props.viewer.entities.remove(radiusCircle)
  }

  // 添加新的圆圈
  radiusCircle = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      selectedAirport.value.longitude,
      selectedAirport.value.latitude
    ),
    ellipse: {
      semiMajorAxis: flightRadius.value * 1000, // 转换为米
      semiMinorAxis: flightRadius.value * 1000,
      material: Cesium.Color.CYAN.withAlpha(0.2),
      outline: true,
      outlineColor: Cesium.Color.CYAN,
      height: 0
    }
  })

  // 强制Cesium重新渲染
  props.viewer.scene.requestRender()

  console.log('✅ [InteractiveAirportSelector] 半径圆圈更新完成')
}

const updateNearbyAirportMarkers = () => {
  if (!props.viewer) {
    console.log('❌ [InteractiveAirportSelector] Viewer不可用，无法更新机场标记')
    return
  }

  console.log('🔄 [InteractiveAirportSelector] 更新附近机场标记，半径:', flightRadius.value)

  // 强制重新计算nearbyAirports
  const nearby = nearbyAirports.value
  console.log('📍 [InteractiveAirportSelector] 范围内机场数量:', nearby.length)

  // 移除旧的附近机场标记（保留选中的机场标记）
  const markersToRemove = airportMarkers.slice(1)
  markersToRemove.forEach(marker => {
    props.viewer!.entities.remove(marker)
  })
  airportMarkers = airportMarkers.slice(0, 1)

  // 添加范围内机场标记
  nearby.forEach((airport, index) => {
    console.log(`✈️ [InteractiveAirportSelector] 添加机场标记 ${index + 1}:`, airport.code, `距离: ${airport.distance.toFixed(0)}km`)

    const marker = props.viewer!.entities.add({
      position: Cesium.Cartesian3.fromDegrees(airport.longitude, airport.latitude),
      billboard: {
        image: '/airplane-icon.svg',
        scale: 0.8,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        color: Cesium.Color.LIGHTGRAY
      },
      label: {
        text: airport.code,
        font: '12px sans-serif',
        fillColor: Cesium.Color.LIGHTGRAY,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -40)
      }
    })

    airportMarkers.push(marker)
  })

  // 强制Cesium重新渲染
  props.viewer.scene.requestRender()

  console.log('✅ [InteractiveAirportSelector] 机场标记更新完成，总标记数:', airportMarkers.length)
}

const clearAllMarkers = () => {
  if (!props.viewer) return
  
  airportMarkers.forEach(marker => {
    props.viewer!.entities.remove(marker)
  })
  airportMarkers = []
  
  if (radiusCircle) {
    props.viewer.entities.remove(radiusCircle)
    radiusCircle = null
  }
}

// 监听viewer变化，当viewer准备好时初始化地图
watch(() => props.viewer, (newViewer) => {
  if (newViewer) {
    console.log('🌍 [InteractiveAirportSelector] Viewer已准备就绪，初始化地图标记')
    // 如果已经选择了机场，重新添加标记
    if (selectedAirport.value) {
      addAirportMarker(selectedAirport.value)
      updateRadiusCircle()
      updateNearbyAirportMarkers()
    }
  }
}, { immediate: true })

// 监听半径变化，实时更新圆圈和机场标记
watch(flightRadius, () => {
  if (props.viewer && selectedAirport.value) {
    console.log('🎯 [InteractiveAirportSelector] 半径变化:', flightRadius.value)
    updateRadiusCircle()
    updateNearbyAirportMarkers()
  }
})

// 生命周期
onUnmounted(() => {
  clearAllMarkers()
})
</script>

<style scoped>
.interactive-airport-selector {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
}

.interactive-airport-selector > * {
  pointer-events: auto;
}

/* 机场选择面板 */
.airport-selection-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  color: #00d4ff;
  font-size: 18px;
}

.panel-header p {
  margin: 0 0 16px 0;
  color: #cccccc;
  font-size: 14px;
}

.airport-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.airport-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.airport-item:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.airport-icon {
  font-size: 20px;
  margin-right: 12px;
}

.airport-info {
  flex: 1;
}

.airport-code {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 2px;
}

.airport-name {
  font-size: 14px;
  color: #cccccc;
  margin-bottom: 2px;
}

.airport-location {
  font-size: 12px;
  color: #999999;
}

/* 半径控制面板 */
.radius-control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 350px;
}

.back-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 12px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.radius-control {
  margin-top: 16px;
}

.control-label {
  display: block;
  color: #cccccc;
  font-size: 14px;
  margin-bottom: 12px;
}

.slider-container {
  position: relative;
  margin-bottom: 8px;
}

.radius-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
}

.radius-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #00d4ff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
}

.radius-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #00d4ff;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.radius-info {
  text-align: center;
  margin-top: 8px;
}

.current-radius {
  color: #00d4ff;
  font-weight: bold;
  font-size: 14px;
}

/* 底部机场抽屉 */
.airport-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transform: translateY(calc(100% - 60px));
  transition: transform 0.3s ease;
  z-index: 1001;
  max-height: 50vh;
}

.airport-drawer.expanded {
  transform: translateY(0);
}

.drawer-handle {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  position: absolute;
  top: 12px;
}

.drawer-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
}

.drawer-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(50vh - 60px);
}

.airport-cards {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.airport-card {
  min-width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.airport-card:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.airport-marker {
  font-size: 16px;
  font-weight: bold;
  color: #00d4ff;
}

.distance-info {
  font-size: 14px;
  color: #999999;
}

.card-body h4 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-size: 16px;
}

.card-body p {
  margin: 0 0 8px 0;
  color: #cccccc;
  font-size: 14px;
}

.airport-description {
  font-size: 12px !important;
  color: #999999 !important;
  line-height: 1.4;
}

.flight-estimate {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.flight-time {
  color: #00d4ff;
  font-size: 14px;
  font-weight: bold;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .airport-selection-panel,
  .radius-control-panel {
    left: 10px;
    right: 10px;
    max-width: none;
  }
  
  .airport-cards {
    flex-direction: column;
  }
  
  .airport-card {
    min-width: auto;
  }
}
</style>
