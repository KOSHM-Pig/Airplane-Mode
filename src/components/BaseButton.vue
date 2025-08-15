<template>
  <button 
    class="base-btn" 
    :class="{ 'with-icon': hasIcon }"
    @click="handleClick"
    :disabled="disabled"
  >
    <!-- 图标插槽 -->
    <span v-if="hasIcon" class="svg-icon">
      <slot name="icon"></slot>
    </span>
    
    <!-- 文本内容 -->
    <span class="btn-text">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',
  props: {
    // 按钮文本
    text: {
      type: String,
      default: 'Button'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 按钮宽度
    width: {
      type: [String, Number],
      default: 130
    },
    // 按钮高度
    height: {
      type: [String, Number],
      default: 40
    }
  },
  computed: {
    hasIcon() {
      return !!this.$slots.icon
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event)
      }
    }
  },
  emits: ['click']
}
</script>

<style scoped>
/* From Uiverse.io by vinodjangid07 */
.base-btn {
  width: v-bind(typeof width === 'number' ? width + 'px' : width);
  height: v-bind(typeof height === 'number' ? height + 'px' : height);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(15, 15, 15);
  border: none;
  color: white;
  font-weight: 600;
  gap: 8px;
  cursor: pointer;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.103);
  position: relative;
  overflow: hidden;
  transition-duration: .3s;
  font-family: inherit;
  font-size: 14px;
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.base-btn:disabled:hover::before {
  transform: none;
}

.base-btn:disabled:active {
  transform: none;
}

.svg-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.svg-icon :deep(path) {
  fill: white;
}

.btn-text {
  line-height: 1;
}

.base-btn::before {
  width: v-bind(width + 'px');
  height: v-bind(width + 'px');
  position: absolute;
  content: "";
  background-color: white;
  border-radius: 50%;
  left: -100%;
  top: 0;
  transition-duration: .3s;
  mix-blend-mode: difference;
}

.base-btn:hover::before {
  transition-duration: .3s;
  transform: translate(100%, -50%);
  border-radius: 0;
}

.base-btn:active {
  transform: translate(5px, 5px);
  transition-duration: .3s;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .base-btn {
    min-height: 44px; /* 移动端最小触摸目标 */
    font-size: 16px; /* 防止iOS缩放 */
  }
}
</style>
