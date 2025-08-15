<template>
  <div class="flight-countdown">
    <div class="countdown-display">
      <!-- 分钟数字显示 -->
      <div class="minutes-container">
        <span
          v-for="(digit, index) in minuteDigits"
          :key="`${index}-${digit}`"
          class="minute-digit"
          :class="{ 'changing': changingDigits.includes(index) }"
        >
          {{ digit }}
        </span>
      </div>

      <!-- 分钟标签 -->
      <div class="minute-label">分钟</div>
    </div>
  </div>
</template>

<script setup>
import audioManager from '@/utils/audioManager.js'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Props
const props = defineProps({
  duration: {
    type: Number,
    default: 300 // 默认5分钟（300秒）
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0 // 飞行进度 0-1
  }
})

// Emits
const emit = defineEmits(['finished', 'tick'])

// 响应式数据
const isActive = ref(false)
const changingDigits = ref([]) // 记录正在变化的数字位
const startTime = ref(0) // 开始时间戳
const displayMinutes = ref(0) // 当前显示的分钟数（用于模板显示）
let updateTimer = null // 更新定时器

// 计算分钟数字数组
const minuteDigits = computed(() => {
  const minutes = displayMinutes.value
  return minutes.toString().split('').map(d => parseInt(d))
})

// 开始倒计时
const start = async () => {
  isActive.value = true
  startTime.value = Date.now()

  // 初始化显示分钟数
  const totalMinutes = Math.ceil(props.duration / 60)
  displayMinutes.value = totalMinutes

  // 播放起飞音频
  try {
    console.log('🛫 飞机起飞，播放起飞音频...')
    await audioManager.play('takeoff')
    console.log('🛫 起飞音频播放完成')
  } catch (error) {
    console.error('🛫 起飞音频播放失败:', error)
  }

  let debugCounter = 0 // 调试计数器

  // 每秒更新一次，检查分钟数是否变化
  updateTimer = setInterval(() => {
    const now = Date.now()
    const elapsedSeconds = (now - startTime.value) / 1000
    const totalSeconds = props.duration

    // 直接计算新的分钟数，不依赖computed
    const elapsedMinutes = Math.floor((now - startTime.value) / 60000)
    const totalMinutes = Math.ceil(props.duration / 60)
    const newMinutes = Math.max(0, totalMinutes - elapsedMinutes)

    // 每5秒输出一次调试信息
    debugCounter++
    if (debugCounter % 5 === 0) {
      console.log('⏰ 倒计时调试信息:')
      console.log(`  - 开始时间: ${new Date(startTime.value).toLocaleTimeString()}`)
      console.log(`  - 当前时间: ${new Date(now).toLocaleTimeString()}`)
      console.log(`  - 已经过时间: ${elapsedSeconds.toFixed(1)}秒 (${elapsedMinutes}分钟)`)
      console.log(`  - 总飞行时间: ${totalSeconds}秒 (${totalMinutes}分钟)`)
      console.log(`  - 计算剩余: ${newMinutes}分钟`)
      console.log(`  - 当前显示: ${displayMinutes.value}分钟`)
      console.log(`  - 进度: ${((elapsedSeconds/totalSeconds)*100).toFixed(1)}%`)
    }

    if (newMinutes !== displayMinutes.value) {
      console.log(`⏰ 分钟数变化: ${displayMinutes.value} → ${newMinutes}`)

      // 先触发动画，再延迟更新数字
      const oldMinutes = displayMinutes.value
      checkMinutesChange(newMinutes, oldMinutes)

      // 延迟更新显示的分钟数，让动画先播放
      setTimeout(() => {
        displayMinutes.value = newMinutes
        console.log(`⏰ 数字更新完成: ${newMinutes}`)
      }, 150) // 动画中间时更新数值
    }

    // 如果倒计时结束
    if (newMinutes <= 0) {
      console.log('⏰ 倒计时结束！')
      stop()
      emit('finished')
    }
  }, 1000) // 每秒检查一次

  console.log('⏰ 倒计时已开始，使用真实时间')
  console.log(`⏰ 总飞行时间: ${props.duration}秒 (${Math.ceil(props.duration/60)}分钟)`)
}

// 检查分钟数变化并触发动画
const checkMinutesChange = (newMinutes, oldMinutes) => {
  if (newMinutes !== oldMinutes && oldMinutes > 0) {
    // 检查哪些数字位会发生变化
    const currentDigits = oldMinutes.toString().split('').map(d => parseInt(d))
    const nextDigits = newMinutes.toString().split('').map(d => parseInt(d))

    // 找出变化的位数
    const changingPositions = []
    const maxLength = Math.max(currentDigits.length, nextDigits.length)

    for (let i = 0; i < maxLength; i++) {
      const currentDigit = currentDigits[i] || 0
      const nextDigit = nextDigits[i] || 0
      if (currentDigit !== nextDigit) {
        changingPositions.push(i)
      }
    }

    // 触发动画
    if (changingPositions.length > 0) {
      console.log(`⏰ 触发动画，变化位置: ${changingPositions}`)
      changingDigits.value = changingPositions

      // 动画结束后清除状态
      setTimeout(() => {
        changingDigits.value = []
        console.log(`⏰ 动画结束`)
      }, 300) // 与CSS动画时间一致
    }
  }
}

// 停止倒计时
const stop = () => {
  isActive.value = false
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  changingDigits.value = []
  console.log('⏰ 倒计时已停止')
}

// 重置倒计时
const reset = () => {
  stop()
  startTime.value = 0
  currentMinutes.value = 0
  changingDigits.value = []
}

// 暴露方法给父组件
defineExpose({
  start,
  stop,
  reset,
  isActive: computed(() => isActive.value),
  timeLeft: computed(() => remainingMinutes.value)
})

// 清理定时器
onUnmounted(() => {
  stop()
})

// 自动开始
onMounted(() => {
  if (props.autoStart) {
    start()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');

.flight-countdown {
  position: relative;
  background: transparent;
  padding: 8px 12px;
  min-width: 100px;
}

.countdown-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.minutes-container {
  display: flex;
  align-items: baseline;
}

.minute-digit {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 64px;
  color: #ffffff;
  line-height: 1;
  transition: all 0.3s ease-out;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.minute-digit.changing {
  transform: translateY(-10px);
  opacity: 0.3;
}

.minute-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #ffffff;
  line-height: 1;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .flight-countdown {
    padding: 6px 8px;
  }

  .minute-digit {
    font-size: 48px;
  }

  .minute-label {
    font-size: 16px;
  }
}
</style>
