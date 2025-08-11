<template>
  <button
    class="stylish-button"
    :class="[size, { active: isActive }]"
    @click="handleClick"
    :disabled="disabled"
    :title="tooltip"
  >
    <!-- 按钮文字 -->
    <span class="button-text">
      <slot>{{ text }}</slot>
    </span>

    <!-- 通知徽章（可选） -->
    <div v-if="badge" class="notification-badge">{{ badge }}</div>
  </button>
</template>

<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
  tooltip?: string
  badge?: string | number
  isActive?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  text: '按钮',
  isActive: false,
  disabled: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.stylish-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(24, 23, 23);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none;
  outline: none;
  font-family: inherit;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.5px;
}

/* 尺寸变体 */
.stylish-button.small {
  padding: 8px 16px;
  font-size: 12px;
  border-radius: 8px;
}

.stylish-button.medium {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 10px;
}

.stylish-button.large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 12px;
}

/* 悬停效果 */
.stylish-button:hover:not(:disabled) {
  background-color: rgb(40, 40, 40);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 激活状态 */
.stylish-button:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.stylish-button.active {
  background-color: rgb(60, 60, 60);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

/* 禁用状态 */
.stylish-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  background-color: rgb(24, 23, 23);
}

.stylish-button:disabled:hover {
  background-color: rgb(24, 23, 23);
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 按钮文字 */
.button-text {
  color: white;
  font-weight: inherit;
  white-space: nowrap;
  user-select: none;
}

/* 通知徽章 */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
  }
}



/* 响应式设计 */
@media (max-width: 768px) {
  .stylish-button {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  }

  .stylish-button:hover:not(:disabled) {
    transform: translateY(-0.5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .stylish-button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .stylish-button.small {
    padding: 6px 12px;
    font-size: 11px;
  }

  .stylish-button.medium {
    padding: 10px 20px;
    font-size: 13px;
  }

  .stylish-button.large {
    padding: 14px 28px;
    font-size: 15px;
  }
}
</style>
