<template>
  <div id="cesiumContainer" class="cesium-container">
    <!-- 可折叠设置按钮 - 右上角 -->
    <CollapsibleSettings
      :quality-settings="settingsController.qualitySettings"
      :map-sources="settingsController.mapSources"
      :current-quality="settingsController.currentQuality.value"
      :current-map-source="settingsController.currentMapSource.value"
      @quality-change="handleQualityChange"
      @map-source-change="handleMapSourceChange"
      @toggle2D="toggle2DView"
    />

    <!-- 黑场过渡遮罩 -->
    <div
      class="transition-overlay"
      :class="{ active: isTransitioning }"
    ></div>

    <!-- 飞行控制器组件 -->
    <FlightController
      :viewer="viewer"
      @start-transition="startTransition"
      @end-transition="endTransition"
    />




  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'
import { onMounted, onUnmounted, ref } from 'vue'
import { getSettingsController } from '../composables/useSettingsController'
import {
    MAP_SOURCES,
    QUALITY_SETTINGS,
    getDefaultQuality,
    validateQualitySetting,
    type QualitySetting
} from '../config/qualitySettings'
import CollapsibleSettings from './CollapsibleSettings.vue'
import FlightController from './FlightController.vue'

const viewer = ref<Cesium.Viewer | null>(null)
const currentMapSource = ref('Cesium卫星')
const resolutionScale = ref(1.0)
const currentQuality = ref('省流')
const isTransitioning = ref(false)

// 初始化设置控制器
const settingsController = getSettingsController()

// 使用统一的配置
const qualitySettings = ref(QUALITY_SETTINGS)
const mapSources = ref(MAP_SOURCES)

onMounted(() => {
  console.log('🚀 [AirplaneMode] 开始初始化Cesium...')

  // 移动端WebGL兼容性检测和优化（参考CSDN文章）
  const checkWebGLSupport = () => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

    if (!gl) {
      console.error('❌ [AirplaneMode] WebGL不支持，请检查浏览器设置')
      console.log('💡 [AirplaneMode] 解决方案（参考Chrome Flags设置）：')
      console.log('1. 在Chrome地址栏输入: chrome://flags/')
      console.log('2. 启用 "Override software rendering list" 为 Enabled')
      console.log('3. 启用 "WebGL Draft Extensions" 为 Enabled')
      console.log('4. 设置 "Choose ANGLE graphics backend" 为 OpenGL')
      console.log('5. 禁用 "Block insecure private network requests" 为 Disabled')
      return false
    }

    // 检测WebGL扩展支持
    const extensions = {
      depthTexture: gl.getExtension('WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture'),
      textureFloat: gl.getExtension('OES_texture_float'),
      anisotropic: gl.getExtension('EXT_texture_filter_anisotropic'),
      debugRenderer: gl.getExtension('WEBGL_debug_renderer_info')
    }

    console.log('🎮 [AirplaneMode] WebGL兼容性检测:', {
      webgl2: gl instanceof WebGL2RenderingContext,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      renderer: extensions.debugRenderer ? gl.getParameter(extensions.debugRenderer.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      vendor: extensions.debugRenderer ? gl.getParameter(extensions.debugRenderer.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      devicePixelRatio: window.devicePixelRatio,
      screen: { width: screen.width, height: screen.height },
      extensions: {
        depthTexture: !!extensions.depthTexture,
        textureFloat: !!extensions.textureFloat,
        anisotropic: !!extensions.anisotropic
      }
    })

    return true
  }

  if (!checkWebGLSupport()) {
    console.error('❌ [AirplaneMode] WebGL初始化失败，应用无法启动')
    return
  }

  try {
    // 设置Cesium Ion访问令牌
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MWU0NGIwMS1hZWQyLTRlODktYmExMi04NzJjOGYyMTE5Y2EiLCJpZCI6MjkxMjMzLCJpYXQiOjE3NDQzNjQ4ODF9.huZ7JqhHqnuhQWzjP6qxJIS6LCUPpbArJqZd1JzTfUA'

    // 创建Cesium Viewer - 激进的纹理优化
    viewer.value = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      scene3DOnly: true,
      creditContainer: document.createElement('div'), // 隐藏版权信息
      // 移动端WebGL优化设置（参考CSDN文章）
      contextOptions: {
        webgl: {
          alpha: false,
          depth: true,
          stencil: false,
          antialias: false, // 禁用抗锯齿避免纹理问题
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          // 移动端特定优化
          premultipliedAlpha: false
        }
      },
      // 启用高DPI支持
      useBrowserRecommendedResolution: false
    })

    // 隐藏版权信息
    if (viewer.value.cesiumWidget.creditContainer) {
      (viewer.value.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'
    }

    // 高分辨率和性能优化设置
    const scene = viewer.value.scene

    // 设置像素比例以支持高DPI设备
    const pixelRatio = window.devicePixelRatio || 1

    // 检测设备类型
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    // 根据设备类型设置默认画质
    const defaultQuality = getDefaultQuality(isMobileDevice)
    currentQuality.value = defaultQuality.name
    settingsController.currentQuality.value = defaultQuality.name

    // 应用默认画质设置
    if (defaultQuality) {
      const scale = Math.min(defaultQuality.resolutionScale * pixelRatio, 2.5)
      viewer.value.resolutionScale = scale
      resolutionScale.value = scale
      scene.globe.maximumScreenSpaceError = defaultQuality.maximumScreenSpaceError
      scene.globe.tileCacheSize = defaultQuality.tileCacheSize
      scene.postProcessStages.fxaa.enabled = defaultQuality.fxaa
    }

    // 移动端激进性能优化设置（参考CSDN文章优化方案）
    scene.postProcessStages.fxaa.enabled = false // 禁用FXAA避免纹理问题
    scene.globe.enableLighting = false // 关闭光照以提高性能
    scene.fog.enabled = false // 关闭雾效
    scene.skyAtmosphere.show = false // 关闭大气效果
    scene.sun.show = false // 关闭太阳
    scene.moon.show = false // 关闭月亮
    scene.skyBox.show = false // 关闭天空盒
    scene.globe.showGroundAtmosphere = false // 关闭地面大气

    // 激进的瓦片请求优化（解决卡顿核心问题）
    scene.globe.preloadSiblings = false // 关闭预加载
    scene.globe.preloadAncestors = false // 关闭祖先预加载
    scene.globe.loadingDescendantLimit = 1 // 极限限制同时加载的瓦片数量
    scene.globe.tileCacheSize = 15 // 更小的瓦片缓存避免内存压力

    // 瓦片加载策略优化 - 关键性能设置
    scene.globe.maximumScreenSpaceError = 16 // 更大的误差容忍度，大幅减少瓦片请求
    scene.globe.enableLighting = false // 禁用光照计算减少GPU负担

    // 进一步减少瓦片加载频率
    scene.globe.skipLevelOfDetail = true // 跳过细节层级
    scene.globe.baseColor = Cesium.Color.BLACK // 设置基础颜色减少渲染负担

    // 网络请求限制 - 大幅减少并发请求
    Cesium.RequestScheduler.maximumRequests = 1 // 极限限制最大并发请求数
    Cesium.RequestScheduler.maximumRequestsPerServer = 1 // 极限限制每服务器请求数
    Cesium.RequestScheduler.throttleRequests = true // 启用请求节流

    // 移动端渲染优化 - 修复requestAnimationFrame警告
    scene.requestRenderMode = true // 按需渲染
    scene.maximumRenderTimeChange = 33.33 // 限制为30FPS (1000ms/30 = 33.33ms)

    // 设置更保守的渲染时间限制
    scene.debugShowFramesPerSecond = false // 禁用FPS显示减少开销

    // 进一步优化渲染性能
    scene.targetFrameRate = 30 // 目标帧率设为30FPS以减少CPU负担

    // 减少渲染负担的关键设置
    scene.logarithmicDepthBuffer = false // 禁用对数深度缓冲区
    scene.fxaa = false // 禁用FXAA抗锯齿
    scene.highDynamicRange = false // 禁用HDR

    // 禁用不必要的渲染特效
    scene.bloomEffect = false // 禁用泛光效果
    scene.silhouetteSize = 0 // 禁用轮廓效果

    // 强制禁用可能导致纹理问题的功能
    scene.globe.depthTestAgainstTerrain = false // 禁用深度测试
    scene.globe.shadows = Cesium.ShadowMode.DISABLED // 禁用阴影

    // 移动端特定的WebGL状态优化
    try {
      const canvas = viewer.value.canvas
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        // 强制设置纹理参数避免渲染警告
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        console.log('🔧 [AirplaneMode] 已设置移动端WebGL状态优化')
      }
    } catch (error) {
      console.warn('⚠️ [AirplaneMode] WebGL状态设置失败:', error)
    }

    // 简化的缓存管理 - 移除有问题的定时器
    console.log('🔧 [AirplaneMode] 使用简化的缓存管理策略')

    console.log('🔧 [AirplaneMode] 已应用移动端激进性能优化设置 + 智能瓦片缓存管理')

    // WebGL和纹理优化 - 专门针对Cesium纹理管理
    try {
      const canvas = viewer.value.canvas
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (gl) {
        // 强制启用GPU扩展
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        const textureFloat = gl.getExtension('OES_texture_float')
        const textureFloatLinear = gl.getExtension('OES_texture_float_linear')
        const depthTexture = gl.getExtension('WEBGL_depth_texture')
        const anisotropic = gl.getExtension('EXT_texture_filter_anisotropic')

        // 纹理优化设置
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        console.log('🎮 [AirplaneMode] GPU硬件加速信息:', {
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
          version: gl.getParameter(gl.VERSION),
          maxTextureSize: maxTextureSize,
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          isWebGL2: gl instanceof WebGL2RenderingContext,
          extensions: {
            textureFloat: !!textureFloat,
            textureFloatLinear: !!textureFloatLinear,
            depthTexture: !!depthTexture,
            anisotropic: !!anisotropic
          }
        })

        // 通过WebGL直接优化纹理参数
        // 设置默认纹理参数以避免纹理警告
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        console.log('🔧 [AirplaneMode] WebGL纹理参数已优化')

        // 设置纹理过滤优化
        if (anisotropic) {
          const maxAnisotropy = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
          console.log('🔧 [AirplaneMode] 各向异性过滤支持，最大级别:', maxAnisotropy)
        }
      }
    } catch (error) {
      console.warn('❌ [AirplaneMode] 无法获取WebGL信息:', error)
    }

    // Cesium纹理优化设置
    scene.globe.imageryLayers.layerAdded.addEventListener((layer) => {
      console.log('🗺️ [AirplaneMode] 地图层已添加，优化纹理设置')
      // 优化纹理过滤
      if (layer.imageryProvider) {
        layer.imageryProvider.defaultAlpha = 1.0
        layer.imageryProvider.defaultBrightness = 1.0
        layer.imageryProvider.defaultContrast = 1.0
        layer.imageryProvider.defaultGamma = 1.0
        layer.imageryProvider.defaultSaturation = 1.0
      }
    })

    // 激进的地图源初始化 - 完全避免纹理问题
    const imageryLayers = viewer.value.imageryLayers

    // 移除默认的Cesium Ion图像层
    imageryLayers.removeAll()

    // 暂时不加载任何地图源，使用纯色背景
    console.log('🗺️ [AirplaneMode] 暂时使用无地图模式避免纹理问题')

    // 瓦片请求节流控制
    const setupTileRequestThrottling = () => {
      let requestCount = 0
      let lastRequestTime = Date.now()

      // 监控网络请求，添加智能节流
      const originalFetch = window.fetch
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input :
                   input instanceof Request ? input.url :
                   input instanceof URL ? input.href : ''

        // 只对瓦片请求进行节流
        if (url.includes('/tiles/') || url.includes('.png') || url.includes('.jpg')) {
          const now = Date.now()

          // 限制请求频率：每200ms最多2个瓦片请求
          if (now - lastRequestTime < 200 && requestCount >= 2) {
            console.log('🚦 [AirplaneMode] 瓦片请求被节流:', url)
            return Promise.reject(new Error('Tile request throttled'))
          }

          if (now - lastRequestTime >= 200) {
            requestCount = 0
            lastRequestTime = now
          }

          requestCount++
        }

        return originalFetch.call(this, input, init)
      }

      console.log('🚦 [AirplaneMode] 已启用瓦片请求节流控制')
    }

    setupTileRequestThrottling()

    // 简化的性能优化
    console.log('🎯 [AirplaneMode] 已启用基础性能优化')

    // 网络状态自适应瓦片加载
    const setupNetworkAdaptiveTileLoading = () => {
      // 检测网络状态
      const getNetworkQuality = () => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
        if (connection) {
          const effectiveType = connection.effectiveType
          console.log('📶 [AirplaneMode] 网络类型:', effectiveType)

          switch (effectiveType) {
            case 'slow-2g':
            case '2g':
              return 'poor'
            case '3g':
              return 'good'
            case '4g':
            default:
              return 'excellent'
          }
        }
        return 'unknown'
      }

      const networkQuality = getNetworkQuality()

      // 根据网络质量调整瓦片设置
      if (networkQuality === 'poor') {
        scene.globe.maximumScreenSpaceError = 16 // 更大的误差容忍度
        scene.globe.tileCacheSize = 10 // 更小的缓存
        Cesium.RequestScheduler.maximumRequests = 1 // 极限限制请求
        console.log('📶 [AirplaneMode] 检测到弱网络，启用极限省流模式')
      } else if (networkQuality === 'good') {
        scene.globe.maximumScreenSpaceError = 8
        scene.globe.tileCacheSize = 20
        Cesium.RequestScheduler.maximumRequests = 2
        console.log('📶 [AirplaneMode] 检测到中等网络，启用平衡模式')
      } else {
        scene.globe.maximumScreenSpaceError = 4
        scene.globe.tileCacheSize = 30
        Cesium.RequestScheduler.maximumRequests = 3
        console.log('📶 [AirplaneMode] 检测到良好网络，启用标准模式')
      }
    }

    setupNetworkAdaptiveTileLoading()

    // 延迟加载地图源，避免初始化时的请求风暴
    setTimeout(() => {
      try {
        const defaultSource = mapSources.value.find(source => source.name === currentMapSource.value)
        if (defaultSource) {
          try {
            if (defaultSource.type === 'cesium') {
              // 使用Cesium Ion地图源 - 异步加载
              Cesium.createWorldImageryAsync().then(provider => {
                imageryLayers.addImageryProvider(provider)
                console.log('🗺️ [AirplaneMode] 延迟加载Cesium地图源:', defaultSource.name)
              }).catch(error => {
                console.warn('Cesium地图源加载失败，使用备用地图源:', error)
                // 备用地图源
                const fallbackProvider = new Cesium.UrlTemplateImageryProvider({
                  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  maximumLevel: 10,
                  credit: 'OpenStreetMap'
                })
                imageryLayers.addImageryProvider(fallbackProvider)
              })
            } else if (defaultSource.type === 'bing') {
              // 使用Bing Maps地图源
              const provider = new Cesium.BingMapsImageryProvider({
                mapStyle: defaultSource.style === 'Aerial' ? Cesium.BingMapsStyle.AERIAL : Cesium.BingMapsStyle.ROAD
              })
              imageryLayers.addImageryProvider(provider)
              console.log('🗺️ [AirplaneMode] 延迟加载Bing地图源:', defaultSource.name)
            } else if (defaultSource.url) {
              // 使用URL模板地图源
              const subdomains = (defaultSource as any).subdomains || []
              const provider = new Cesium.UrlTemplateImageryProvider({
                url: defaultSource.url,
                maximumLevel: 10,
                credit: defaultSource.name,
                subdomains: subdomains,
                tileWidth: 256,
                tileHeight: 256,
                hasAlphaChannel: false,
                minimumLevel: 0
              })
              imageryLayers.addImageryProvider(provider)
              console.log('🗺️ [AirplaneMode] 延迟加载URL地图源:', defaultSource.name)
            }
          } catch (error) {
            console.error('地图源加载失败:', error)
          }
        }
      } catch (error) {
        console.warn('地图源加载失败，继续使用无地图模式:', error)
      }
    }, 3000) // 3秒后加载

    // 设置初始视角（北京上空）
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.4074, 39.9042, 10000000.0), // 北京
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
      }
    })

    // 限制相机高度（平板端限制）
    if (isMobileDevice) {
      viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 1000 // 最低1km
      viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 20000000 // 最高20,000km
    }

    console.log('Cesium initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Cesium:', error)
  }
})

// 飞行功能已移至FlightController组件



// 移动端优化的动态画质设置
const setResolution = (quality: QualitySetting) => {
  console.log('🎮 [CesiumViewer] setResolution 被调用，quality:', quality)

  // 验证输入参数
  if (!validateQualitySetting(quality)) {
    console.error('❌ [CesiumViewer] 无效的画质设置对象:', quality)
    return
  }

  if (!viewer.value) {
    console.warn('⚠️ [CesiumViewer] viewer.value 为空，跳过画质设置')
    return
  }

  if (currentQuality.value === quality.name) {
    console.log('🎮 [CesiumViewer] 画质相同，跳过设置')
    return
  }

  const scene = viewer.value.scene
  if (!scene) {
    console.warn('⚠️ [CesiumViewer] scene 为空，跳过画质设置')
    return
  }

  const pixelRatio = window.devicePixelRatio || 1

  // 移动端保守的分辨率设置
  const qualityResolutionScale = quality.resolutionScale || 0.6 // 默认值
  const scale = Math.min(qualityResolutionScale * Math.min(pixelRatio, 2.0), 1.5) // 移动端最高1.5倍

  if (isNaN(scale) || scale <= 0) {
    console.error('❌ [CesiumViewer] 计算出的scale无效:', scale, '使用默认值0.6')
    viewer.value.resolutionScale = 0.6
    resolutionScale.value = 0.6
  } else {
    viewer.value.resolutionScale = scale
    resolutionScale.value = scale
  }

  // 更新地形设置 - 添加安全检查
  if (scene?.globe) {
    scene.globe.maximumScreenSpaceError = quality.maximumScreenSpaceError || 8
    scene.globe.tileCacheSize = quality.tileCacheSize || 20
    scene.globe.loadingDescendantLimit = quality.loadingDescendantLimit || 1
  }

  // 更新网络请求限制
  Cesium.RequestScheduler.maximumRequests = quality.maxRequests
  Cesium.RequestScheduler.maximumRequestsPerServer = Math.max(1, Math.floor(quality.maxRequests / 2))

  // 移动端禁用FXAA避免纹理问题
  scene.postProcessStages.fxaa.enabled = false

  // 动态调整地图源级别
  const imageryLayers = viewer.value.imageryLayers
  if (imageryLayers.length > 0) {
    const currentLayer = imageryLayers.get(0)
    if (currentLayer && currentLayer.imageryProvider) {
      // 重新加载地图源以应用新的级别限制
      const currentSource = mapSources.value.find(source => source.name === currentMapSource.value)
      if (currentSource && currentSource.type === 'url' && currentSource.url) {
        imageryLayers.removeAll()
        const subdomains = (currentSource as any).subdomains || []
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: currentSource.url,
          maximumLevel: Math.min(quality.mapLevel, currentSource.maximumLevel),
          credit: currentSource.name,
          subdomains: subdomains,
          tileWidth: 256,
          tileHeight: 256,
          hasAlphaChannel: false,
          minimumLevel: 0
        })
        imageryLayers.addImageryProvider(provider)
      }
    }
  }

  // 同步更新两个状态
  currentQuality.value = quality.name
  settingsController.currentQuality.value = quality.name

  console.log(`🎮 [AirplaneMode] 切换到画质: ${quality.name}, 分辨率: ${scale.toFixed(2)}x, 地图级别: ${quality.mapLevel}`)
}

// 切换地图源 - 支持Cesium Ion、Bing和URL模板
const switchMapSource = (source: any) => {
  if (!viewer.value || currentMapSource.value === source.name) return

  const imageryLayers = viewer.value.imageryLayers

  // 移除当前地图层
  imageryLayers.removeAll()

  try {
    if (source.type === 'cesium') {
      // 使用Cesium Ion地图源
      Cesium.createWorldImageryAsync().then(provider => {
        imageryLayers.addImageryProvider(provider)
        currentMapSource.value = source.name
        console.log(`🗺️ [AirplaneMode] 切换到Cesium地图源: ${source.name}`)
      }).catch(error => {
        console.error(`❌ [AirplaneMode] Cesium地图源切换失败: ${source.name}`, error)
      })
    } else if (source.type === 'bing') {
      // 使用Bing Maps地图源
      const provider = new Cesium.BingMapsImageryProvider({
        mapStyle: source.style === 'Aerial' ? Cesium.BingMapsStyle.AERIAL : Cesium.BingMapsStyle.ROAD
      })
      imageryLayers.addImageryProvider(provider)
      currentMapSource.value = source.name
      console.log(`🗺️ [AirplaneMode] 切换到Bing地图源: ${source.name}`)
    } else if (source.url) {
      // 使用URL模板地图源
      const subdomains = source.subdomains || []
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: source.url,
        maximumLevel: Math.min(source.maximumLevel, 14),
        credit: source.name,
        subdomains: subdomains,
        tileWidth: 256,
        tileHeight: 256,
        hasAlphaChannel: false,
        minimumLevel: 0
      })

      imageryLayers.addImageryProvider(provider)
      currentMapSource.value = source.name
      console.log(`🗺️ [AirplaneMode] 切换到URL地图源: ${source.name}`)
    } else {
      console.warn(`⚠️ [AirplaneMode] 不支持的地图源类型: ${source.name}`)
    }
  } catch (error) {
    console.error(`❌ [AirplaneMode] 地图源切换失败: ${source.name}`, error)
  }
}



// 2D视图切换
const toggle2DView = () => {
  if (!viewer.value) return

  const scene = viewer.value.scene

  // 切换到2D视图
  scene.morphTo2D(2.0)

  console.log('🗺️ [AirplaneMode] 切换到2D视图')
}

// 处理画质变化
const handleQualityChange = (quality: any) => {
  console.log('🎮 [CesiumViewer] 收到画质变化请求:', quality)
  // 直接使用传入的quality对象，不通过settingsController
  setResolution(quality)
}

// 处理地图源变化
const handleMapSourceChange = (source: any) => {
  if (settingsController.setMapSource(source)) {
    switchMapSource(source)
  }
}

// 过渡控制函数
const startTransition = () => {
  console.log('🎬 [CesiumViewer] 开始黑场过渡')
  isTransitioning.value = true
}

const endTransition = () => {
  console.log('🎬 [CesiumViewer] 结束黑场过渡')
  isTransitioning.value = false
}

onUnmounted(() => {
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
  }
})
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: sans-serif;
  position: relative;
  /* 高DPI优化 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

/* 确保在所有设备上都能正确显示 */
@media (max-width: 768px) {
  .cesium-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    touch-action: none;
    -webkit-overflow-scrolling: touch;
  }

  /* 移动设备上的可折叠设置 */
  .collapsible-settings {
    top: 10px;
    right: 10px;
  }

  .settings-toggle-btn {
    width: 45px;
    height: 45px;
  }

  .settings-options {
    right: 55px;
    min-width: calc(100vw - 80px);
    max-width: calc(100vw - 80px);
  }






}

/* 黑场过渡遮罩 */
.transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 1s ease-in-out;
  pointer-events: none;
}

.transition-overlay.active {
  opacity: 1;
  visibility: visible;
  pointer-events: all;
}

/* 高分辨率设备优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .cesium-container {
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    /* 强制硬件加速 */
    will-change: transform;
    /* 优化图像渲染 */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
    image-rendering: crisp-edges;
  }

  /* 确保Canvas使用设备像素比 */
  .cesium-container canvas {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
    image-rendering: crisp-edges;
  }
}





.flight-btn:active:not(:disabled) {
  transform: translateY(0);
}



.control-group-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  opacity: 0.9;
}

.camera-btn {
  padding: 8px 16px;
  background: rgba(0, 188, 212, 0.9);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 188, 212, 0.3);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.camera-btn:hover {
  background: rgba(0, 150, 170, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
}

.camera-btn:active {
  transform: translateY(0);
  background: rgba(0, 120, 140, 0.95);
}

/* 地图源切换按钮样式 */
.map-source-controls {
  position: absolute;
  top: 20px;
  right: 200px;
  z-index: 1000;
  display: flex;
  flex-direction: row;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 300px;
}

.map-source-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.map-source-btn:hover {
  background: rgba(240, 240, 240, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.map-source-btn.active {
  background: rgba(0, 188, 212, 0.9);
  color: white;
  border-color: rgba(0, 188, 212, 0.5);
}

.map-source-btn.active:hover {
  background: rgba(0, 150, 170, 0.95);
}

.map-source-btn:active {
  transform: translateY(0);
}

/* 分辨率控制按钮样式 */
.resolution-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.resolution-label {
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
}

.resolution-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 50px;
}

.resolution-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.resolution-btn.active {
  background: rgba(0, 188, 212, 0.8);
  border-color: rgba(0, 188, 212, 0.8);
  color: white;
}

.resolution-btn.active:hover {
  background: rgba(0, 150, 170, 0.9);
}

.resolution-btn:active {
  transform: translateY(0);
}



/* 移动端适配 */
@media (max-width: 768px) {
  .map-source-controls {
    top: 70px;
    right: 10px;
    max-width: 200px;
    gap: 4px;
  }

  .map-source-btn {
    padding: 4px 8px;
    font-size: 10px;
  }

  .resolution-controls {
    bottom: 10px;
    right: 10px;
    padding: 8px;
  }

  .resolution-label {
    font-size: 11px;
  }

  .resolution-btn {
    padding: 4px 8px;
    font-size: 10px;
    min-width: 40px;
  }


}
</style>