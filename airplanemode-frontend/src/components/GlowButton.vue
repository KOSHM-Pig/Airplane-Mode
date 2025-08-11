<template>
  <button 
    class="glow-button" 
    :class="{ disabled: disabled }"
    :disabled="disabled"
    @click="handleClick"
  >
    <span class="button-text">{{ text }}</span>
    <div class="hoverEffect">
      <div></div>
    </div>
  </button>
</template>

<script setup lang="ts">
interface Props {
  text: string
  disabled?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<style scoped>
.glow-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: 0;
  position: relative;
  overflow: hidden;
  border-radius: 10rem;
  transition: all 0.02s;
  font-weight: bold;
  cursor: pointer;
  color: rgb(37, 37, 37);
  z-index: 0;
  box-shadow: 0 0px 7px -5px rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 14px;
  min-width: 120px;
}

.glow-button:hover:not(.disabled) {
  background: rgb(193, 228, 248);
  color: rgb(33, 0, 85);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.glow-button:active:not(.disabled) {
  transform: scale(0.97) translateY(-1px);
}

.glow-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(200, 200, 200, 0.7);
}

.button-text {
  position: relative;
  z-index: 2;
  white-space: nowrap;
}

.hoverEffect {
  position: absolute;
  bottom: 0;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}

.hoverEffect div {
  background: rgb(222, 0, 75);
  background: linear-gradient(
    90deg,
    rgba(222, 0, 75, 1) 0%,
    rgba(191, 70, 255, 1) 49%,
    rgba(0, 212, 255, 1) 100%
  );
  border-radius: 40rem;
  width: 10rem;
  height: 10rem;
  transition: 0.4s;
  filter: blur(20px);
  animation: effect infinite 3s linear;
  opacity: 0;
}

.glow-button:hover:not(.disabled) .hoverEffect div {
  width: 8rem;
  height: 8rem;
  opacity: 0.5;
}

@keyframes effect {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .glow-button {
    padding: 10px 20px;
    font-size: 12px;
    min-width: 100px;
  }
}
</style>
