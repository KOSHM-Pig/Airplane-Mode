<template>
  <div class="input-wrapper">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
    </label>
    <div class="input-container">
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="base-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseInput',
  props: {
    // v-model 绑定值
    modelValue: {
      type: [String, Number],
      default: ''
    },
    // 输入框类型
    type: {
      type: String,
      default: 'text'
    },
    // 标签文本
    label: {
      type: String,
      default: ''
    },
    // 占位符
    placeholder: {
      type: String,
      default: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否必填
    required: {
      type: Boolean,
      default: false
    },
    // 输入框宽度
    width: {
      type: [String, Number],
      default: '100%'
    },
    // 输入框高度
    height: {
      type: [String, Number],
      default: 48
    }
  },
  computed: {
    inputId() {
      return `input-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value)
    },
    handleFocus(event) {
      this.$emit('focus', event)
    },
    handleBlur(event) {
      this.$emit('blur', event)
    }
  },
  emits: ['update:modelValue', 'focus', 'blur']
}
</script>

<style scoped>
.input-wrapper {
  width: 100%;
}

.input-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 400;
  font-family: inherit;
}

.input-container {
  position: relative;
  width: v-bind(typeof width === 'number' ? width + 'px' : width);
}

.base-input {
  width: 100%;
  height: v-bind(height + 'px');
  background-color: rgb(15, 15, 15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 400;
  padding: 0 16px;
  cursor: text;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.103);
  position: relative;
  overflow: hidden;
  transition-duration: .3s;
  font-family: inherit;
  font-size: 14px;
  border-radius: 4px;
  box-sizing: border-box;
}

.base-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

.base-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: rgb(10, 10, 10);
}

.base-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background-color: rgb(20, 20, 20);
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.base-input:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.3);
  background-color: rgb(18, 18, 18);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .base-input {
    min-height: 44px; /* 移动端最小触摸目标 */
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .input-label {
    font-size: 16px;
  }
}
</style>
