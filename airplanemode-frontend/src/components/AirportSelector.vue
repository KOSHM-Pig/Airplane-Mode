<template>
  <div class="airport-selector">
    <div class="selector-header">
      <h3>✈️ 选择航线</h3>
    </div>
    
    <div class="airport-selection">
      <!-- 出发地选择 -->
      <div class="airport-group">
        <label class="airport-label">🛫 出发地</label>
        <select 
          v-model="selectedDeparture" 
          class="airport-select"
          @change="updateFlightInfo"
        >
          <option value="">请选择出发机场</option>
          <option 
            v-for="airport in availableDepartures" 
            :key="airport.id" 
            :value="airport.id"
          >
            {{ airport.iataCode }} - {{ airport.name }} ({{ airport.city }})
          </option>
        </select>
      </div>
      
      <!-- 到达地选择 -->
      <div class="airport-group">
        <label class="airport-label">🛬 到达地</label>
        <select 
          v-model="selectedArrival" 
          class="airport-select"
          @change="updateFlightInfo"
        >
          <option value="">请选择到达机场</option>
          <option 
            v-for="airport in availableArrivals" 
            :key="airport.id" 
            :value="airport.id"
          >
            {{ airport.iataCode }} - {{ airport.name }} ({{ airport.city }})
          </option>
        </select>
      </div>
    </div>
    
    <!-- 航线信息显示 -->
    <div v-if="flightInfo" class="flight-info">
      <div class="info-row">
        <span class="info-label">航线：</span>
        <span class="info-value">{{ flightInfo.route }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">距离：</span>
        <span class="info-value">{{ flightInfo.distance }} km</span>
      </div>
      <div class="info-row">
        <span class="info-label">预计飞行时间：</span>
        <span class="info-value">{{ flightInfo.duration }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">时差：</span>
        <span class="info-value">{{ flightInfo.timezoneInfo }}</span>
      </div>
    </div>
    
    <!-- 开始飞行按钮 -->
    <div class="flight-actions">
      <StylishButton
        text="🚀 开始飞行"
        size="large"
        :disabled="!canStartFlight || isFlying"
        @click="startCustomFlight"
      />
      <StylishButton
        v-if="isFlying"
        text="⏹️ 停止飞行"
        size="medium"
        @click="stopFlight"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { airports, getAirportById, calculateDistance, estimateFlightTime, type Airport } from '../data/airports'
import StylishButton from './StylishButton.vue'

// Props
interface Props {
  isFlying: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'start-flight': [departureId: string, arrivalId: string]
  'stop-flight': []
}>()

// 响应式状态
const selectedDeparture = ref<string>('')
const selectedArrival = ref<string>('')

// 计算属性
const availableDepartures = computed(() => airports)

const availableArrivals = computed(() => {
  if (!selectedDeparture.value) return airports
  // 排除已选择的出发地
  return airports.filter(airport => airport.id !== selectedDeparture.value)
})

const canStartFlight = computed(() => {
  return selectedDeparture.value && selectedArrival.value && selectedDeparture.value !== selectedArrival.value
})

const flightInfo = computed(() => {
  if (!selectedDeparture.value || !selectedArrival.value) return null
  
  const departure = getAirportById(selectedDeparture.value)
  const arrival = getAirportById(selectedArrival.value)
  
  if (!departure || !arrival) return null
  
  const distance = Math.round(calculateDistance(departure, arrival))
  const flightTimeHours = estimateFlightTime(distance)
  const hours = Math.floor(flightTimeHours)
  const minutes = Math.round((flightTimeHours - hours) * 60)
  
  return {
    route: `${departure.iataCode} → ${arrival.iataCode}`,
    distance: distance.toLocaleString(),
    duration: `${hours}小时${minutes}分钟`,
    timezoneInfo: `${departure.timezone} → ${arrival.timezone}`
  }
})

// 方法
const updateFlightInfo = () => {
  // 当选择改变时，这个方法会被调用
  // flightInfo 计算属性会自动更新
}

const startCustomFlight = () => {
  if (canStartFlight.value) {
    emit('start-flight', selectedDeparture.value, selectedArrival.value)
  }
}

const stopFlight = () => {
  emit('stop-flight')
}

// 监听出发地变化，如果到达地和出发地相同则清空到达地
watch(selectedDeparture, (newDeparture) => {
  if (newDeparture === selectedArrival.value) {
    selectedArrival.value = ''
  }
})
</script>

<style scoped>
.airport-selector {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 350px;
  max-width: 400px;
  color: white;
}

.selector-header h3 {
  margin: 0 0 15px 0;
  color: #00d4ff;
  font-size: 18px;
  text-align: center;
}

.airport-selection {
  margin-bottom: 15px;
}

.airport-group {
  margin-bottom: 15px;
}

.airport-label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #ccc;
  font-weight: 500;
}

.airport-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.airport-select:focus {
  border-color: #00d4ff;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

.airport-select option {
  background: #2a2a2a;
  color: white;
  padding: 8px;
}

.flight-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #aaa;
  font-weight: 500;
}

.info-value {
  color: #00d4ff;
  font-weight: 600;
}

.flight-actions {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .airport-selector {
    left: 10px;
    right: 10px;
    min-width: auto;
    max-width: none;
    width: calc(100vw - 20px);
  }
}
</style>
