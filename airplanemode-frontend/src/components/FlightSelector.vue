<template>
  <div class="flight-selector">
    <!-- 出发地选择 -->
    <div v-if="!selectedDeparture" class="departure-selection">
      <div class="selection-header">
        <h3>✈️ 选择出发地</h3>
        <p>请选择您的出发机场</p>
      </div>
      <div class="airport-grid">
        <div 
          v-for="airport in majorAirports" 
          :key="airport.id"
          class="airport-card"
          @click="selectDeparture(airport)"
        >
          <div class="airport-code">{{ airport.code }}</div>
          <div class="airport-name">{{ airport.name }}</div>
          <div class="airport-city">{{ airport.city }}</div>
        </div>
      </div>
    </div>

    <!-- 目的地选择 -->
    <div v-else class="destination-selection">
      <div class="selection-header">
        <button class="back-btn" @click="goBack">
          <span>←</span>
        </button>
        <div class="departure-info">
          <div class="departure-code">{{ selectedDeparture.code }}</div>
          <div class="departure-name">{{ selectedDeparture.name }}</div>
        </div>
      </div>

      <!-- 飞行时间选择器 -->
      <div class="flight-time-selector">
        <label>飞行时间范围：</label>
        <div class="time-options">
          <button 
            v-for="time in flightTimeOptions" 
            :key="time.value"
            class="time-btn"
            :class="{ active: selectedFlightTime === time.value }"
            @click="selectFlightTime(time.value)"
          >
            {{ time.label }}
          </button>
        </div>
      </div>

      <!-- 可到达的目的地 -->
      <div class="destinations-grid">
        <div 
          v-for="destination in availableDestinations" 
          :key="destination.id"
          class="destination-card"
          @click="selectDestination(destination)"
        >
          <div class="destination-code">{{ destination.code }}</div>
          <div class="destination-name">{{ destination.name }}</div>
          <div class="flight-info">
            <span class="flight-time">{{ destination.estimatedTime }}</span>
            <span class="distance">{{ destination.distance }}km</span>
          </div>
        </div>
      </div>

      <!-- 选择航班按钮 -->
      <div v-if="selectedDestination" class="flight-action">
        <GlowButton
          :text="`🛫 ${selectedDeparture.code} → ${selectedDestination.code}`"
          @click="startFlight"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAirportById, getAllAirports, type Airport } from '../data/airports'
import GlowButton from './GlowButton.vue'

interface FlightTimeOption {
  value: number // 小时
  label: string
}

interface DestinationWithInfo extends Airport {
  distance: number
  estimatedTime: string
}

// Props
interface Props {
  isFlying?: boolean
}

// Emits
interface Emits {
  (e: 'start-flight', departure: Airport, destination: Airport): void
}

const props = withDefaults(defineProps<Props>(), {
  isFlying: false
})

const emit = defineEmits<Emits>()

// 状态
const selectedDeparture = ref<Airport | null>(null)
const selectedDestination = ref<DestinationWithInfo | null>(null)
const selectedFlightTime = ref<number>(2) // 默认2小时

// 飞行时间选项
const flightTimeOptions: FlightTimeOption[] = [
  { value: 1, label: '1小时内' },
  { value: 2, label: '2小时内' },
  { value: 4, label: '4小时内' },
  { value: 8, label: '8小时内' },
  { value: 12, label: '12小时内' }
]

// 主要机场（出发地选择）
const majorAirports = computed(() => {
  const airports = getAllAirports()
  // 选择一些主要的国际机场
  const majorCodes = ['PEK', 'PVG', 'CAN', 'SZX', 'CTU', 'XIY', 'NKG', 'HGH', 'WUH', 'CSX']
  return airports.filter(airport => majorCodes.includes(airport.code))
})

// 根据飞行时间计算可到达的目的地
const availableDestinations = computed(() => {
  if (!selectedDeparture.value) return []
  
  const allAirports = getAllAirports()
  const maxFlightTime = selectedFlightTime.value
  const averageSpeed = 800 // km/h 平均飞行速度
  const maxDistance = maxFlightTime * averageSpeed
  
  return allAirports
    .filter(airport => airport.id !== selectedDeparture.value!.id)
    .map(airport => {
      const distance = calculateDistance(
        selectedDeparture.value!.latitude,
        selectedDeparture.value!.longitude,
        airport.latitude,
        airport.longitude
      )
      
      const estimatedTime = Math.round(distance / averageSpeed * 10) / 10 // 保留1位小数
      
      return {
        ...airport,
        distance: Math.round(distance),
        estimatedTime: `${estimatedTime}h`
      }
    })
    .filter(dest => dest.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20) // 最多显示20个目的地
})

// 计算两点间距离（简化的球面距离公式）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 选择出发地
function selectDeparture(airport: Airport) {
  selectedDeparture.value = airport
  selectedDestination.value = null
}

// 选择飞行时间
function selectFlightTime(time: number) {
  selectedFlightTime.value = time
  selectedDestination.value = null
}

// 选择目的地
function selectDestination(destination: DestinationWithInfo) {
  selectedDestination.value = destination
}

// 返回出发地选择
function goBack() {
  selectedDeparture.value = null
  selectedDestination.value = null
}

// 开始飞行
function startFlight() {
  if (selectedDeparture.value && selectedDestination.value) {
    emit('start-flight', selectedDeparture.value, selectedDestination.value)
  }
}
</script>

<style scoped>
.flight-selector {
  position: absolute;
  top: 20px;
  left: 20px;
  max-width: 400px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: white;
  z-index: 1000;
}

.selection-header {
  margin-bottom: 20px;
  text-align: center;
}

.selection-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.selection-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.departure-info {
  text-align: center;
}

.departure-code {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
}

.departure-name {
  font-size: 14px;
  opacity: 0.8;
}

.airport-grid, .destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.airport-card, .destination-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.airport-card:hover, .destination-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.airport-code, .destination-code {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.airport-name, .destination-name {
  font-size: 12px;
  margin-bottom: 2px;
}

.airport-city {
  font-size: 11px;
  opacity: 0.7;
}

.flight-info {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 4px;
}

.flight-time-selector {
  margin: 20px 0;
}

.flight-time-selector label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.time-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.time-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.time-btn.active {
  background: #ffd700;
  color: #000;
  border-color: #ffd700;
}

.flight-action {
  margin-top: 20px;
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .flight-selector {
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
    padding: 16px;
  }
  
  .airport-grid, .destinations-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }
}
</style>
