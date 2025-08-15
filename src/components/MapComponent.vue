<template>
  <div class="map-container">
    <div id="gaode-map" class="map"></div>

    <!-- 预加载遮罩 -->
    <div v-if="isPreloading" class="preload-overlay">
      <div class="preload-content">
        <div class="preload-spinner"></div>
        <div class="preload-text">{{ preloadText }}</div>
        <div class="preload-progress">
          <div class="progress-bar" :style="{ width: preloadProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 飞行控制按钮 -->
    <div class="flight-controls">
      <BaseButton
        :text="isFlying ? '停止飞行' : '开始飞行'"
        :width="120"
        :height="44"
        @click="toggleFlight"
        :disabled="isPreloading"
      />
    </div>

    <!-- 缩放控制按钮 -->
    <div class="zoom-controls">
      <BaseButton
        text="+"
        :width="50"
        :height="50"
        @click="zoomIn"
      />
      <BaseButton
        text="-"
        :width="50"
        :height="50"
        @click="zoomOut"
      />
    </div>

    <!-- 图层选择器 - 只有地图准备就绪后才显示 -->
    <div v-if="isMapReady" class="layer-selector-control">
      <LayerSelector
        :map="map"
        :isDarkMode="isDarkMode"
        @layerChanged="onLayerChanged"
      />
    </div>

    <!-- 飞行倒计时 - 左下角，只在飞行时显示 -->
    <div v-if="isMapReady && isFlying" class="countdown-control">
      <FlightCountdown
        ref="countdownRef"
        :duration="flightDurationSeconds"
        :autoStart="true"
        @finished="onCountdownFinished"
        @tick="onCountdownTick"
      />
    </div>

    <!-- 2D/3D切换按钮 -->
    <div class="view-mode-control">
      <BaseButton
        :text="is3DMode ? '2D' : '3D'"
        :width="50"
        :height="50"
        @click="toggleViewMode"
      />
    </div>
  </div>
</template>

<script>
import { StatusBar } from '@capacitor/status-bar'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  calculateAnimationSpeed,
  calculateCenter,
  calculateDistance,
  DEFAULT_ROUTE,
  FLIGHT_CONFIG,
  FLIGHT_ROUTES,
  formatFlightTime,
  REFRESH_TIME
} from '../config/flightConfig.js'
import {
  AirplanePositionManager,
  calculateBearing,
  createAirplaneIcon
} from '../utils/AirplaneIcon.js'
import {
  createMapRefreshManager,
  quickFlightRefresh
} from '../utils/mapRefreshUtils.js'
import BaseButton from './BaseButton.vue'
import FlightCountdown from './FlightCountdown.vue'
import LayerSelector from './LayerSelector.vue'
export default {
  name: 'MapComponent',
  components: {
    BaseButton,
    LayerSelector,
    FlightCountdown
  },
  setup() {
    let map = null
    let airplaneMarker = null
    let routeLine = null // 动态红线，从飞机到目的地
    let animationId = null
    let cameraTransitionId = null
    let currentProgress = 0
    let airplanePositionManager = null
    let lastRouteLineUpdateTime = 0 // 红线更新时间控制
    let mapRefreshManager = null // 地图刷新管理器
    let userZoomLevel = 7 // 用户当前缩放级别，默认为7
    let zoomEndTimer = null // 缩放结束定时器
    let isProgrammaticZoom = false // 标记是否为程序设置的缩放

    const isFlying = ref(false)
    const is3DMode = ref(true) // 默认为3D模式
    const isMapReady = ref(false) // 地图是否准备就绪

    // 双图层切换状态
    const isDarkMode = ref(true) // 当前是否为暗黑模式
    let satelliteLayer = null // 卫星图层
    let roadNetLayer = null // 路网图层

    // 倒计时相关
    const countdownRef = ref(null)
    const flightDurationSeconds = computed(() => {
      return Math.round(animationConfig.flightTimeMinutes * 60)
    })

    // 预加载相关状态
    const isPreloading = ref(false)
    const preloadText = ref('准备飞行...')
    const preloadProgress = ref(0)

    // 用户位置
    const userLocation = ref(null)

    // 使用配置文件中的航线数据
    const currentRoute = FLIGHT_ROUTES[DEFAULT_ROUTE]
    const flightRoute = currentRoute.path

    // 计算实际距离和动画速度
    const routeDistance = calculateDistance(currentRoute.departure.coordinates, currentRoute.arrival.coordinates)
    const animationConfig = calculateAnimationSpeed(routeDistance, FLIGHT_CONFIG.speed.kmPerHour, FLIGHT_CONFIG.speed.animationFPS)

    console.log(`航线信息: ${currentRoute.name}`)
    console.log(`距离: ${routeDistance.toFixed(0)}公里`)
    console.log(`预计飞行时间: ${formatFlightTime(animationConfig.flightTimeMinutes)}`)
    console.log(`飞行速度: ${FLIGHT_CONFIG.speed.kmPerHour}km/h`)



    const initMap = () => {
      // 创建地图实例 - 移动端优化配置
      map = new window.AMap.Map('gaode-map', {
        zoom: 7, // 固定缩放级别为7
        center: calculateCenter(currentRoute.departure.coordinates, currentRoute.arrival.coordinates),
        viewMode: '3D', // 3D视图
        lang: 'zh_cn',
        mapStyle: 'amap://styles/dark', // 默认暗黑样式
        // 3D地图专用配置
        pitch: 30, // 地图俯仰角度，降低角度让飞机更容易看到在航线上
        rotation: 0, // 初始地图旋转角度，设为0避免混乱
        rotateEnable: true, // 是否开启地图旋转交互
        pitchEnable: true, // 是否开启地图倾斜交互
        // 移动端优化配置
        dragEnable: true, // 允许拖拽
        zoomEnable: true, // 允许缩放
        doubleClickZoom: false, // 禁用双击缩放，避免误操作
        keyboardEnable: false, // 禁用键盘操作
        scrollWheel: false, // 禁用滚轮缩放
        touchZoom: true, // 启用触摸缩放
        touchZoomCenter: 1, // 触摸缩放以触摸中心为准
        // 动画配置 - 确保地图平移过程中使用动画，有助于动态加载
        animateEnable: true, // 地图平移过程中是否使用动画
        // 瓦片缓存配置 - 提高地图加载性能
        cacheSize: 64, // 增加瓦片缓存数量，默认是16
        // 移除默认控件，使用自定义控件
        showIndoorMap: false,
        expandZoomRange: true,
        zooms: [3, 20]
      })

      // 启用定位
      map.plugin('AMap.Geolocation', () => {
        const geolocation = new window.AMap.Geolocation({
          enableHighAccuracy: true, // 是否使用高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 定位结果缓存0毫秒
          convert: true, // 自动偏移坐标
          showButton: false, // 不显示定位按钮
          showMarker: true, // 显示定位标记
          showCircle: true, // 显示精度圆
          panToLocation: true, // 定位成功后将定位到的位置作为地图中心点
          zoomToAccuracy: true // 定位成功后调整地图视野范围使定位位置及精度范围视野内可见
        })

        geolocation.getCurrentPosition((status, result) => {
          if (status === 'complete') {
            userLocation.value = result.position
            console.log('定位成功:', result)
          } else {
            console.log('定位失败:', result)
          }
        })
      })

      // 地图点击事件
      map.on('click', (e) => {
        console.log('点击位置:', e.lnglat.getLng(), e.lnglat.getLat())
      })

      // 地图双击事件
      map.on('dblclick', (e) => {
        console.log('双击位置:', e.lnglat.getLng(), e.lnglat.getLat())
        console.log('双击事件触发，地图自动刷新')
      })

      // 监听地图俯仰角变化，确保飞机始终在航线上
      map.on('pitchchange', () => {
        if (isFlying.value && airplaneMarker) {
          // 延迟一点执行，让俯仰角变化完成
          setTimeout(() => {
            ensurePlaneOnRoute()
          }, 100)
        }
      })

      // 监听地图缩放结束事件 - 只处理用户手势缩放
      map.on('zoomend', () => {
        // 如果是程序设置的缩放，跳过处理
        if (isProgrammaticZoom) {
          isProgrammaticZoom = false // 重置标记
          return
        }

        // 清除之前的定时器，避免频繁触发
        if (zoomEndTimer) {
          clearTimeout(zoomEndTimer)
        }

        // 延迟处理，确保缩放操作完全结束
        zoomEndTimer = setTimeout(() => {
          const currentZoom = map.getZoom()
          const roundedZoom = Math.round(currentZoom)

          // 只有当缩放级别真正发生变化时才处理
          if (Math.abs(userZoomLevel - roundedZoom) >= 1) {
            userZoomLevel = roundedZoom
            console.log(`🔍 双指缩放完成 - 缩放级别变化为: ${roundedZoom}`)

            // 使用用户缩放级别进行地图刷新
            if (mapRefreshManager && isFlying.value) {
              mapRefreshManager.refreshByUserZoomGesture(userZoomLevel)
            }
          }
        }, 200) // 200ms延迟，确保缩放操作完全结束
      })

      // 保留原有的zoomchange监听，但只用于飞机位置调整
      map.on('zoomchange', () => {
        if (isFlying.value && airplaneMarker) {
          setTimeout(() => {
            ensurePlaneOnRoute()
          }, 100)
        }
      })

      // 修改天空图层颜色为浅灰色
      const changeSkyColor = () => {
        // 方法1: 直接查找并修改天空图层
        const layers = map.getLayers()
        let skyLayerFound = false

        layers.forEach(layer => {
          if (layer.CLASS_NAME === 'AMap.SkyLayer' ||
              layer.type === 'sky' ||
              layer.name === 'sky') {
            try {
              // 尝试移除天空图层
              map.remove(layer)
              skyLayerFound = true
              console.log('已移除天空图层')
            } catch (e) {
              console.log('移除天空图层失败:', e)
            }
          }
        })

        // 方法2: 通过CSS强制覆盖天空颜色
        const mapContainer = document.getElementById('gaode-map')
        if (mapContainer) {
          // 添加CSS样式来覆盖天空颜色
          const style = document.createElement('style')
          style.id = 'sky-color-override'
          style.textContent = `
            #gaode-map {
              background-color: rgb(42,42,42) !important;
            }
            #gaode-map canvas {
              background: rgb(42,42,42) !important;
            }
            #gaode-map .amap-container {
              background: rgb(42,42,42) !important;
            }
            /* WebGL天空颜色覆盖 */
            #gaode-map canvas[style*="position: absolute"] {
              filter: brightness(0.2) contrast(1.2) !important;
            }
          `

          // 移除旧的样式（如果存在）
          const oldStyle = document.getElementById('sky-color-override')
          if (oldStyle) {
            oldStyle.remove()
          }

          document.head.appendChild(style)
          console.log('已应用CSS天空颜色覆盖')
        }
      }

      // 地图完全加载后执行
      map.on('complete', changeSkyColor)

      // 也在延迟后执行，确保所有图层都加载完成
      setTimeout(changeSkyColor, 2000)

      console.log('高德地图初始化完成')

      // 初始化地图刷新管理器
      mapRefreshManager = createMapRefreshManager(map)

      // 创建图层 - 按照官方文档
      satelliteLayer = new window.AMap.TileLayer.Satellite()
      roadNetLayer = new window.AMap.TileLayer.RoadNet()
      console.log('✅ 卫星图层和路网图层创建完成')

      // 设置地图准备就绪
      isMapReady.value = true
      console.log('✅ 地图准备就绪，可以显示控件')

      // 地图准备就绪后，启动倒计时
      setTimeout(() => {
        startCountdown()
      }, 1000)

      // 测试官方API刷新功能
      setTimeout(() => {
        if (mapRefreshManager) {
          console.log('测试官方API刷新功能...')
          const success = mapRefreshManager.refreshByAPICombo()
          console.log('官方API刷新测试结果:', success)
        }
      }, 2000)

      // 初始化飞机图层
      initFlightLayer()
    }

    // 初始化飞机图层和动态航线
    const initFlightLayer = () => {
      // 不创建固定航线，改为动态红线
      // 航线将在飞行过程中动态更新

      // 创建飞机标记
      // 计算飞机朝向：由于SVG中飞机头朝上，需要调整角度
      const bearing = calculateBearing(flightRoute[0], flightRoute[1])

      // 初始化飞机位置管理器，使用动态途径点
      airplanePositionManager = new AirplanePositionManager(map, is3DMode)
      // 根据航线距离动态调整途径点数量
      const routeDistance = calculateDistance(flightRoute[0], flightRoute[1]) // 返回米
      const routeDistanceKm = routeDistance / 1000 // 转换为公里
      const waypointCount = Math.max(20, Math.min(100, Math.floor(routeDistanceKm / 10))) // 每10公里一个途径点
      airplanePositionManager.setRoute(flightRoute[0], flightRoute[1], waypointCount)

      console.log(`航线距离: ${routeDistanceKm.toFixed(1)}公里，生成 ${waypointCount} 个途径点`)

      // 使用新的位置管理器获取初始位置
      const initialPlanePos = airplanePositionManager.calculatePlanePosition(0) // 进度为0，即起点
      const initialPosition = is3DMode.value ? initialPlanePos.position3D : initialPlanePos.position2D

      airplaneMarker = new window.AMap.Marker({
        position: initialPosition,
        icon: createAirplaneIcon({ size: FLIGHT_CONFIG.airplane.size * 2 }), // 使用2倍大小的plane.svg
        anchor: 'center',
        angle: bearing, // SVG飞机头朝上，直接使用计算的角度
        zIndex: 1000, // 确保飞机在最上层
        offset: new window.AMap.Pixel(0, 0), // 确保飞机居中对齐
        // 3D模式下的额外配置
        extData: {
          is3D: is3DMode.value,
          onRoute: true // 标记飞机在航线上
        }
      })
      map.add(airplaneMarker)

      console.log('飞机图层初始化完成，使用高精度位置计算')
    }

    // 创建或更新动态红线（从飞机到目的地）- 参考官方文档优化
    const updateDynamicRouteLine = (currentPosition) => {
      const destination = flightRoute[1] // 目的地

      // 如果红线已存在，先移除
      if (routeLine) {
        map.remove(routeLine)
      }

      // 根据官方文档创建路径数组
      const path = [
        new window.AMap.LngLat(currentPosition[0], currentPosition[1]),
        new window.AMap.LngLat(destination[0], destination[1])
      ]

      // 创建新的红线 - 使用官方文档推荐的属性
      routeLine = new window.AMap.Polyline({
        path: path,                    // 路径数组
        strokeWeight: 2,               // 线条宽度
        strokeColor: '#FF0000',        // 线条颜色（红色）
        strokeOpacity: 0.8,            // 线条透明度
        strokeStyle: 'solid',          // 线条样式
        lineJoin: 'round',             // 折线拐点连接处样式（圆角）
        lineCap: 'round',              // 线条端点样式（圆角）
        zIndex: 15,                    // 层级
        showDir: false                 // 不显示方向箭头
      })

      map.add(routeLine)
    }





    // 相机过渡到飞行视角 - 优化版本
    const transitionToFlightView = (targetPosition) => {
      const config = FLIGHT_CONFIG.camera

      // 缩短过渡时间，让响应更快
      const transitionDuration = 1200 // 从2000ms缩短到1200ms

      // 平滑过渡到飞行视角，在3D模式下使用较小的俯仰角
      const pitchAngle = is3DMode.value ? 30 : 0 // 3D模式下使用30度俯仰角，更容易看到飞机在航线上
      map.setZoomAndCenter(config.flightZoom, targetPosition, false, transitionDuration)
      map.setPitch(pitchAngle, false, transitionDuration)
      map.setRotation(config.rotation, false, transitionDuration)

      // 初始化相机跟随位置
      previousCameraPosition = targetPosition.slice()

      console.log(`相机过渡到飞行视角: 俯仰角${pitchAngle}度，过渡时间${transitionDuration}ms`)
    }

    // 从1000米高空俯视过渡到飞行跟随视角
    const transitionFromOverviewToFlightView = (targetPosition) => {
      const config = FLIGHT_CONFIG.camera

      // 过渡时间
      const transitionTime = 1500 // 1.5秒过渡时间，让用户看清楚过渡过程

      if (is3DMode.value) {
        // 3D模式：从高空俯视（缩放9，俯仰60°）过渡到飞行跟随视角（缩放11，俯仰30°）
        map.setZoomAndCenter(config.flightZoom, targetPosition, true, transitionTime)
        map.setPitch(config.pitch, true, transitionTime) // 从60°过渡到30°
        map.setRotation(config.rotation, true, transitionTime)

        console.log(`相机从1000米高空俯视过渡到飞行跟随视角: 俯仰角${config.pitch}度，缩放${config.flightZoom}，过渡时间${transitionTime}ms`)
      } else {
        // 2D模式：从缩放9过渡到缩放11
        map.setZoomAndCenter(config.flightZoom, targetPosition, true, transitionTime)
        console.log(`相机从高空俯视过渡到2D飞行视角，过渡时间${transitionTime}ms`)
      }

      // 初始化相机跟随位置
      previousCameraPosition = targetPosition.slice()
    }

    // 相机回到初始视角 - 优化版本
    const transitionToInitialView = () => {
      const config = FLIGHT_CONFIG.camera
      const center = calculateCenter(currentRoute.departure.coordinates, currentRoute.arrival.coordinates)

      // 缩短过渡时间，让回到初始视角更快
      const transitionDuration = 1500 // 从2000ms缩短到1500ms

      // 平滑过渡回初始视角
      map.setZoomAndCenter(config.initialZoom, center, false, transitionDuration)
      map.setPitch(0, false, transitionDuration)
      map.setRotation(0, false, transitionDuration)

      console.log(`相机回到初始视角，过渡时间${transitionDuration}ms`)
    }

    // 飞行动画函数 - 平滑优化版本
    let lastMapUpdateTime = 0
    let lastPlaneUpdateTime = 0
    let previousCameraPosition = null
    let targetCameraPosition = null

    // 优化的更新间隔配置
    const MAP_UPDATE_INTERVAL = 100 // 相机更新间隔（毫秒），提高到100ms让跟随更流畅
    const PLANE_UPDATE_INTERVAL = 50 // 飞机位置更新间隔（毫秒），提高到50ms让飞机移动更平滑

    // 平滑插值函数
    const smoothLerp = (start, end, factor) => {
      return start + (end - start) * factor
    }

    // 使用新的位置管理器计算飞机位置
    const calculatePlanePositionOnRoute = (progress) => {
      if (airplanePositionManager) {
        return airplanePositionManager.calculatePlanePosition(progress)
      }

      // 降级处理：如果位置管理器未初始化，使用简单计算
      const startPoint = flightRoute[0]
      const endPoint = flightRoute[1]

      const lng = startPoint[0] + (endPoint[0] - startPoint[0]) * progress
      const lat = startPoint[1] + (endPoint[1] - startPoint[1]) * progress
      const position2D = [lng, lat]

      return {
        position2D,
        position3D: position2D,
        progress,
        coordinates: { lng, lat },
        altitude: 0
      }
    }

    // 确保飞机始终在航线上的辅助函数
    const ensurePlaneOnRoute = () => {
      if (!airplaneMarker || !map) return

      // 获取当前飞机位置
      const currentPos = airplaneMarker.getPosition()
      if (!currentPos) return

      // 在3D模式下，检查并调整飞机高度
      if (is3DMode.value) {
        const currentPitch = map.getPitch() || 30
        const baseAltitude = FLIGHT_CONFIG.camera.flightAltitude || 1000
        const altitudeMultiplier = 1 + (currentPitch / 90) * 0.5
        const requiredAltitude = baseAltitude * altitudeMultiplier

        // 如果当前高度与所需高度差异较大，重新设置位置
        if (currentPos.getAltitude && Math.abs(currentPos.getAltitude() - requiredAltitude) > 100) {
          const adjustedPos = new window.AMap.LngLat(
            currentPos.getLng(),
            currentPos.getLat(),
            requiredAltitude
          )
          airplaneMarker.setPosition(adjustedPos)
        }
      }
    }

    const animateFlight = () => {
      if (!isFlying.value || currentProgress >= 1) {
        if (currentProgress >= 1) {
          // 飞行结束
          isFlying.value = false
          currentProgress = 0

          // 重置相机跟随状态
          previousCameraPosition = null
          targetCameraPosition = null
          lastMapUpdateTime = 0
          lastPlaneUpdateTime = 0
          lastRouteLineUpdateTime = 0

          // 清理红线
          if (routeLine) {
            map.remove(routeLine)
            routeLine = null
          }

          // 相机回到初始视角，缩短延迟时间
          setTimeout(() => {
            transitionToInitialView()
          }, 800) // 缩短到800ms让结束更流畅

          console.log(`飞行完成！从${currentRoute.departure.name}到${currentRoute.arrival.name}`)
          return
        }
        return
      }

      const startPoint = flightRoute[0] // 起点
      const endPoint = flightRoute[1]   // 终点

      // 计算当前位置（线性插值）
      const lat = startPoint[1] + (endPoint[1] - startPoint[1]) * currentProgress
      const lng = startPoint[0] + (endPoint[0] - startPoint[0]) * currentProgress
      const currentPosition = [lng, lat]

      const currentTime = Date.now()

      // 更新飞机位置 - 使用高精度位置计算
      if ((currentTime - lastPlaneUpdateTime) >= PLANE_UPDATE_INTERVAL) {
        // 使用位置管理器计算精确位置
        const planePosition = calculatePlanePositionOnRoute(currentProgress)

        // 根据模式设置飞机位置
        if (is3DMode.value) {
          // 3D模式：使用3D位置
          airplaneMarker.setPosition(planePosition.position3D)
        } else {
          // 2D模式：使用2D位置
          airplaneMarker.setPosition(planePosition.position2D)
        }

        // 计算并设置飞机朝向角度（基于航线方向）
        const angle = calculateBearing(startPoint, endPoint)
        airplaneMarker.setAngle(angle)

        // 验证飞机位置是否在航线上
        if (airplanePositionManager) {
          airplanePositionManager.validateAndCorrectPosition(airplaneMarker)
        }

        // 更新动态红线（从飞机当前位置到目的地）- 控制更新频率
        const ROUTE_LINE_UPDATE_INTERVAL = 200 // 红线更新间隔200ms
        if ((currentTime - lastRouteLineUpdateTime) >= ROUTE_LINE_UPDATE_INTERVAL) {
          const currentPos = planePosition.position2D
          updateDynamicRouteLine(currentPos)
          lastRouteLineUpdateTime = currentTime
        }

        lastPlaneUpdateTime = currentTime
      }

      // 平滑相机跟随飞机
      if (FLIGHT_CONFIG.camera.followPlane && (currentTime - lastMapUpdateTime) >= MAP_UPDATE_INTERVAL) {
        // 初始化相机位置
        if (!previousCameraPosition) {
          previousCameraPosition = currentPosition.slice()
        }

        // 设置目标相机位置
        targetCameraPosition = currentPosition.slice()

        // 使用平滑插值计算相机位置
        const smoothingFactor = 0.3 // 平滑因子，0.3表示每次移动30%的距离
        const smoothCameraLng = smoothLerp(previousCameraPosition[0], targetCameraPosition[0], smoothingFactor)
        const smoothCameraLat = smoothLerp(previousCameraPosition[1], targetCameraPosition[1], smoothingFactor)
        const smoothCameraPosition = [smoothCameraLng, smoothCameraLat]

        // 更新相机位置
        if (is3DMode.value) {
          // 3D模式下使用更短的过渡时间，让跟随更流畅
          const currentZoom = map.getZoom()
          map.setZoomAndCenter(currentZoom, smoothCameraPosition, false, 300) // 缩短到300ms
        } else {
          // 2D模式下使用panTo，也缩短过渡时间
          map.panTo(smoothCameraPosition, 200)
        }

        // 更新上一次相机位置
        previousCameraPosition = smoothCameraPosition.slice()
        lastMapUpdateTime = currentTime

        // 动态刷新地图以确保图层正确显示（每3秒刷新一次）
        if (currentTime % REFRESH_TIME < 100) {

          console.log('🔄 开始飞行动态刷新地图...')
          console.log(`📍 当前飞行进度: ${(currentProgress * 100).toFixed(1)}%`)
          console.log(`📍 当前飞机位置: [${currentPosition[0].toFixed(6)}, ${currentPosition[1].toFixed(6)}]`)
          console.log(`📍 当前地图中心: [${map.getCenter().lng.toFixed(6)}, ${map.getCenter().lat.toFixed(6)}]`)
          console.log(`📍 当前地图缩放: ${map.getZoom().toFixed(2)}`)

          // 使用用户缩放级别进行地图刷新，避免卡顿
          console.log(`📍 用户缩放级别: ${userZoomLevel.toFixed(2)}`)

          if (mapRefreshManager) {
            const refreshStart = performance.now()
            // 使用用户当前缩放级别进行刷新
            const success = mapRefreshManager.refreshByUserZoomGesture(userZoomLevel)
            const refreshTime = performance.now() - refreshStart

            console.log(`✅ 用户缩放动态刷新地图 - 成功: ${success}, 耗时: ${refreshTime.toFixed(2)}ms`)

            // 获取刷新统计信息
            const stats = mapRefreshManager.getRefreshStats()
            console.log(`📊 刷新统计 - 总次数: ${stats.refreshCount}, 上次刷新: ${new Date(stats.lastRefreshTime).toLocaleTimeString()}`)
          } else {
            console.log('⚠️ mapRefreshManager 不存在，使用降级方案')
            // 降级使用用户缩放快速刷新
            const refreshStart = performance.now()
            const success = quickFlightRefresh(map, userZoomLevel)
            const refreshTime = performance.now() - refreshStart

            console.log(`✅ 用户缩放快速刷新地图 - 成功: ${success}, 耗时: ${refreshTime.toFixed(2)}ms`)
          }

          console.log('🔄 飞行动态刷新地图完成\n')
        }

        // 确保飞机始终在航线上（特别是在3D模式下俯仰角变化时）
        ensurePlaneOnRoute()
      }

      // 更新进度（使用根据实际距离计算的速度）
      currentProgress += animationConfig.speedPerFrame

      // 继续动画
      animationId = requestAnimationFrame(animateFlight)
    }

    // 简单的飞行路径预加载 - 依赖高德地图自身的动态加载
    const preloadFlightPath = async () => {
      if (!map || !flightRoute || flightRoute.length < 2) return

      // 开始预加载，显示遮罩
      isPreloading.value = true
      preloadProgress.value = 0
      preloadText.value = '准备飞行路径...'

      const startPoint = flightRoute[0]
      const endPoint = flightRoute[1]

      console.log('开始简单预加载飞行路径...')

      // 简单预加载：快速浏览一下飞行路径
      const preloadPoints = [
        startPoint,
        [
          startPoint[0] + (endPoint[0] - startPoint[0]) * 0.25,
          startPoint[1] + (endPoint[1] - startPoint[1]) * 0.25
        ],
        [
          startPoint[0] + (endPoint[0] - startPoint[0]) * 0.5,
          startPoint[1] + (endPoint[1] - startPoint[1]) * 0.5
        ],
        [
          startPoint[0] + (endPoint[0] - startPoint[0]) * 0.75,
          startPoint[1] + (endPoint[1] - startPoint[1]) * 0.75
        ],
        endPoint
      ]

      // 快速浏览路径点
      for (let i = 0; i < preloadPoints.length; i++) {
        const point = preloadPoints[i]

        // 更新进度
        const progress = Math.round((i / preloadPoints.length) * 80)
        preloadProgress.value = progress
        preloadText.value = `预览飞行路径 ${progress}%`

        // 简单设置地图中心，让高德自己加载
        map.setCenter(point, false)

        // 短暂等待
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // 准备飞行
      preloadProgress.value = 85
      preloadText.value = '准备起飞...'
      await new Promise(resolve => setTimeout(resolve, 300))

      // 设置1000米高空俯视视角
      preloadProgress.value = 90
      preloadText.value = '设置俯视视角...'

      // 回到起点，设置高空俯视视角
      map.setCenter(startPoint, false)
      if (is3DMode.value) {
        // 1000米高空俯视：更高的缩放级别，更大的俯仰角
        map.setZoom(9, false) // 降低缩放级别以显示更大范围（1000米高空效果）
        map.setPitch(60, false) // 增大俯仰角，模拟从高空俯视
      } else {
        // 2D模式下也降低缩放级别
        map.setZoom(9, false)
      }

      preloadProgress.value = 95
      preloadText.value = '高空俯视视角就绪...'
      await new Promise(resolve => setTimeout(resolve, 200))

      // 完成预加载
      preloadProgress.value = 100
      preloadText.value = '起飞！'
      await new Promise(resolve => setTimeout(resolve, 300))

      // 隐藏遮罩
      isPreloading.value = false

      console.log('飞行路径预加载完成，依赖高德动态加载')
    }



    // 切换飞行状态
    const toggleFlight = async () => {
      if (isFlying.value) {
        // 停止飞行
        isFlying.value = false
        if (animationId) {
          cancelAnimationFrame(animationId)
          animationId = null
        }

        // 重置相机跟随状态
        previousCameraPosition = null
        targetCameraPosition = null
        lastMapUpdateTime = 0
        lastPlaneUpdateTime = 0
        lastRouteLineUpdateTime = 0

        // 清理红线
        if (routeLine) {
          map.remove(routeLine)
          routeLine = null
        }

        // 相机回到初始视角
        transitionToInitialView()
        console.log('飞行已停止')
      } else {
        // 预加载飞行路径（在开始飞行前）
        await preloadFlightPath()

        // 重置所有状态
        currentProgress = 0
        previousCameraPosition = null
        targetCameraPosition = null
        lastMapUpdateTime = 0
        lastPlaneUpdateTime = 0
        lastRouteLineUpdateTime = 0

        // 开始飞行
        isFlying.value = true

        // 重新初始化位置管理器（确保使用最新状态）
        if (airplanePositionManager) {
          const routeDistance = calculateDistance(flightRoute[0], flightRoute[1]) // 返回米
          const routeDistanceKm = routeDistance / 1000 // 转换为公里
          const waypointCount = Math.max(20, Math.min(100, Math.floor(routeDistanceKm / 10)))
          airplanePositionManager.setRoute(flightRoute[0], flightRoute[1], waypointCount)
        }

        // 设置飞机初始位置 - 使用高精度位置计算
        const initialPlanePosition = calculatePlanePositionOnRoute(0) // 进度为0，即起点
        if (is3DMode.value) {
          airplaneMarker.setPosition(initialPlanePosition.position3D)
        } else {
          airplaneMarker.setPosition(initialPlanePosition.position2D)
        }

        // 创建初始红线（从起点到终点）
        updateDynamicRouteLine(initialPlanePosition.position2D)

        // 从1000米高空俯视过渡到飞行跟随视角
        setTimeout(() => {
          transitionFromOverviewToFlightView(initialPlanePosition.position2D)
        }, 300) // 缩短到300ms让响应更快

        console.log(`开始飞行！${currentRoute.name}`)
        console.log('已启用平滑相机跟随')
        console.log(`飞行模式: ${is3DMode.value ? '3D' : '2D'}`)
        console.log(`从1000米高空俯视过渡到飞行跟随视角`)
        console.log(`飞机初始高度: ${initialPlanePosition.altitude}米`)

        // 显示路径统计信息
        if (airplanePositionManager && airplanePositionManager.calculator) {
          const stats = airplanePositionManager.calculator.getPathStats()
          console.log(`球面路径统计:`)
          console.log(`- 路径类型: ${stats.pathType}`)
          console.log(`- 总点数: ${stats.totalPoints}`)
          console.log(`- 段数: ${stats.segments}`)
          console.log(`- 平均段距离: ${stats.avgSegmentDistanceKm.toFixed(2)}公里`)
        }
        animateFlight()
      }
    }

    // 缩放控制函数 - 每次1级别变化，与动态刷新配合
    const zoomIn = () => {
      if (map) {
        // 获取当前缩放级别，增加1级
        const currentZoom = map.getZoom()
        const newZoom = Math.min(20, Math.round(currentZoom) + 1) // 确保是整数级别

        // 标记为程序设置的缩放，避免触发zoomend事件处理
        isProgrammaticZoom = true

        // 设置新的缩放级别
        map.setZoom(newZoom)

        // 更新用户缩放级别
        userZoomLevel = newZoom
        console.log(`🔍 右侧按钮放大 - 缩放级别: ${currentZoom.toFixed(1)} → ${newZoom}`)

        // 直接进行地图刷新（不通过zoomend事件）
        if (mapRefreshManager) {
          mapRefreshManager.refreshByUserZoomGesture(userZoomLevel)
        }
      }
    }

    const zoomOut = () => {
      if (map) {
        // 获取当前缩放级别，减少1级
        const currentZoom = map.getZoom()
        const newZoom = Math.max(3, Math.round(currentZoom) - 1) // 确保是整数级别

        // 标记为程序设置的缩放，避免触发zoomend事件处理
        isProgrammaticZoom = true

        // 设置新的缩放级别
        map.setZoom(newZoom)

        // 更新用户缩放级别
        userZoomLevel = newZoom
        console.log(`🔍 右侧按钮缩小 - 缩放级别: ${currentZoom.toFixed(1)} → ${newZoom}`)

        // 直接进行地图刷新（不通过zoomend事件）
        if (mapRefreshManager) {
          mapRefreshManager.refreshByUserZoomGesture(userZoomLevel)
        }
      }
    }

    // 切换2D/3D视图模式
    const toggleViewMode = () => {
      if (!map) return

      is3DMode.value = !is3DMode.value

      // 保存当前地图状态
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()

      // 保存当前地图样式
      const currentMapStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/normal'

      // 销毁当前地图
      map.destroy()

      // 重新创建地图实例
      map = new window.AMap.Map('gaode-map', {
        zoom: currentZoom,
        center: currentCenter,
        viewMode: is3DMode.value ? '3D' : '2D', // 根据状态设置视图模式
        lang: 'zh_cn',
        mapStyle: currentMapStyle, // 保持当前地图样式
        // 3D地图专用配置
        pitch: is3DMode.value ? 50 : 0, // 地图俯仰角度
        rotation: is3DMode.value ? -15 : 0, // 地图旋转角度
        rotateEnable: is3DMode.value, // 是否开启地图旋转交互
        pitchEnable: is3DMode.value, // 是否开启地图倾斜交互
        // 移动端优化配置
        dragEnable: true, // 允许拖拽
        zoomEnable: true, // 允许缩放
        doubleClickZoom: false, // 禁用双击缩放，避免误操作
        keyboardEnable: false, // 禁用键盘操作
        scrollWheel: false, // 禁用滚轮缩放
        touchZoom: true, // 启用触摸缩放
        touchZoomCenter: 1, // 触摸缩放以触摸中心为准
        // 动画配置 - 确保地图平移过程中使用动画，有助于动态加载
        animateEnable: true, // 地图平移过程中是否使用动画
        // 瓦片缓存配置 - 提高地图加载性能
        cacheSize: 64, // 增加瓦片缓存数量，默认是16
        // 移除默认控件，使用自定义控件
        showIndoorMap: false,
        expandZoomRange: true,
        zooms: [3, 20]
      })

      // 重新初始化飞机图层
      initFlightLayer()

      // 重新创建图层
      satelliteLayer = new window.AMap.TileLayer.Satellite()
      roadNetLayer = new window.AMap.TileLayer.RoadNet()

      // 如果当前是卫星模式，重新添加图层
      if (!isDarkMode.value) {
        map.add([satelliteLayer, roadNetLayer])
        console.log('✅ 卫星图层已恢复')
      }

      // 重新创建地图刷新管理器
      mapRefreshManager = createMapRefreshManager(map)

      // 刷新地图确保视图模式切换正确显示
      if (mapRefreshManager) {
        setTimeout(() => {
          mapRefreshManager.smartRefresh()
          console.log('视图模式切换后地图刷新完成')
        }, 300)
      }

      console.log(`切换到${is3DMode.value ? '3D' : '2D'}模式，地图样式: ${currentMapStyle}`)
    }

    // 简单的双图层切换 - 按照官方文档
    const toggleLayer = () => {
      if (!map || !satelliteLayer || !roadNetLayer) {
        console.warn('⚠️ 地图或图层未准备就绪')
        return
      }

      if (isDarkMode.value) {
        // 当前是暗黑模式，切换到卫星模式
        console.log('� 切换到卫星模式')

        // 添加卫星图层和路网图层
        map.add([satelliteLayer, roadNetLayer])

        // 设置为标准样式
        map.setMapStyle('amap://styles/normal')

        isDarkMode.value = false
        console.log('✅ 已切换到卫星模式')
      } else {
        // 当前是卫星模式，切换回暗黑模式
        console.log('🔄 切换到暗黑模式')

        // 移除卫星图层和路网图层
        map.remove([satelliteLayer, roadNetLayer])

        // 设置为暗黑样式
        map.setMapStyle('amap://styles/dark')

        isDarkMode.value = true
        console.log('✅ 已切换到暗黑模式')
      }
    }

    // 处理图层变化 - 简单切换
    const onLayerChanged = (layerInfo) => {
      console.log(`🔄 图层切换请求: ${layerInfo.name}`)
      toggleLayer()
    }

    // 倒计时完成事件
    const onCountdownFinished = () => {
      console.log('� 飞行时间结束，自动停止飞行')
      if (isFlying.value) {
        toggleFlight()
      }
    }

    // 倒计时每秒事件
    const onCountdownTick = (timeLeft) => {
      console.log(`⏰ 倒计时: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`)
    }

    // 开始倒计时
    const startCountdown = () => {
      if (countdownRef.value) {
        countdownRef.value.start()
        console.log('⏰ 飞行倒计时已开始')
      }
    }

    // 停止倒计时
    const stopCountdown = () => {
      if (countdownRef.value) {
        countdownRef.value.stop()
        console.log('⏰ 飞行倒计时已停止')
      }
    }

    onMounted(async () => {
      // 在移动设备上确保状态栏隐藏
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          await StatusBar.hide()
          console.log('📱 状态栏已隐藏')
        } catch (error) {
          console.warn('📱 状态栏隐藏失败:', error)
        }
      }

      // 确保高德地图API已加载
      if (window.AMap) {
        initMap()
      } else {
        window.onload = () => {
          initMap()
        }
      }
    })

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (cameraTransitionId) {
        clearTimeout(cameraTransitionId)
      }
      if (zoomEndTimer) {
        clearTimeout(zoomEndTimer)
      }
      if (mapRefreshManager) {
        mapRefreshManager.destroy()
        mapRefreshManager = null
      }
      if (map) {
        map.destroy()
      }
    })

    return {
      map: computed(() => map),
      isFlying,
      is3DMode,
      isMapReady,
      isDarkMode,
      isPreloading,
      preloadText,
      preloadProgress,
      countdownRef,
      flightDurationSeconds,
      toggleFlight,
      zoomIn,
      zoomOut,
      toggleViewMode,
      onLayerChanged,
      onCountdownFinished,
      onCountdownTick,
      startCountdown,
      stopCountdown
    }
  }
}
</script>

<style scoped>
.map-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
}

/* 预加载遮罩样式 */
.preload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

.preload-content {
  text-align: center;
  color: white;
  max-width: 300px;
  padding: 40px 20px;
}

.preload-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #00BFFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.preload-text {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.preload-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00BFFF, #0080FF);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 强制覆盖天空颜色为深灰色 RGB(42,42,42) */
#gaode-map {
  background: rgb(42,42,42) !important;
}

/* 覆盖所有canvas元素的天空颜色 */
#gaode-map canvas {
  background: rgb(42,42,42) !important;
}

/* WebGL渲染的天空颜色滤镜 */
#gaode-map canvas[style*="position"] {
  filter: brightness(0.2) contrast(1.2) !important;
}

/* 地图容器背景 */
.map :deep(.amap-container) {
  background: rgb(42,42,42) !important;
}

/* 3D视图特殊处理 */
.map :deep(.amap-3d-container) {
  background: rgb(42,42,42) !important;
}

.flight-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 999;
}

.zoom-controls {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-selector-control {
  position: absolute;
  bottom: 80px; /* 在2D/3D按钮上方 */
  right: 20px;
  z-index: 999;
}

.view-mode-control {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .flight-controls {
    top: 16px;
    right: 16px;
  }

  .zoom-controls {
    right: 16px;
  }

  .layer-selector-control {
    bottom: 72px; /* 在2D/3D按钮上方 */
    right: 16px;
  }

  .view-mode-control {
    bottom: 16px;
    right: 16px;
  }
}

.map-controls {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.zoom-controls {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.zoom-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}

.zoom-btn:first-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.control-3d {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-3d:active {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(0.95);
}

.control-3d-icon {
  font-size: 12px;
  font-weight: bold;
  color: white;
  letter-spacing: 0.5px;
}

.compass-control {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.compass-control:active {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(0.95);
}

.compass-icon {
  font-size: 20px;
  color: white;
}

/* 移动端触摸优化 */
@media (max-width: 768px) {
  .map-controls {
    right: 12px;
  }

  .zoom-btn,
  .control-3d,
  .compass-control {
    width: 40px;
    height: 40px;
  }

  .zoom-btn {
    font-size: 18px;
  }

  .control-3d-icon {
    font-size: 11px;
  }

  .compass-icon {
    font-size: 18px;
  }
}

/* 图层选择器控件 - 放在右下角，2D/3D按钮上方 */
.layer-selector-control {
  position: absolute;
  bottom: 90px; /* 在2D/3D按钮上方 */
  right: 20px;
  z-index: 1000;
}

/* 倒计时控件 */
.countdown-control {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layer-selector-control {
    bottom: 70px; /* 在移动端2D/3D按钮上方 */
    right: 12px;
  }

  .countdown-control {
    bottom: 12px;
    left: 12px;
  }
}
</style>
