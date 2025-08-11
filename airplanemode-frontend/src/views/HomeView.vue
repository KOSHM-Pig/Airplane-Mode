<template>
  <main class="app-main">
    <!-- Cesium地球视图 - 铺满整个屏幕 -->
    <CesiumViewer />
  </main>
</template>

<script setup lang="ts">
import CesiumViewer from '../components/CesiumViewer.vue';
</script>

<style scoped>
.app-main {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
