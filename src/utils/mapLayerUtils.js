/**
 * 高德地图图层工具类
 * 基于高德地图API 2.0官方文档
 */

/**
 * 地图图层类型枚举
 */
export const LAYER_TYPES = {
  STANDARD: 'standard',    // 标准地图（非暗黑）
  DARK: 'dark',           // 暗黑地图
  SATELLITE: 'satellite', // 卫星地图
  ROADNET: 'roadnet'      // 路网地图
}

/**
 * 图层配置 - 基于高德地图官方文档
 */
export const LAYER_CONFIGS = {
  [LAYER_TYPES.STANDARD]: {
    name: '标准',
    description: '标准矢量地图',
    icon: '🗺️',
    mapStyle: 'normal'  // 标准样式
  },
  [LAYER_TYPES.DARK]: {
    name: '暗黑',
    description: '暗黑主题地图',
    icon: '🌙',
    mapStyle: 'dark'    // 暗黑样式
  },
  [LAYER_TYPES.SATELLITE]: {
    name: '卫星',
    description: '卫星影像+路网',
    icon: '🛰️',
    mapStyle: 'normal'  // 卫星图层使用标准样式
  },
  [LAYER_TYPES.ROADNET]: {
    name: '路网',
    description: '纯路网图层',
    icon: '🛣️',
    mapStyle: 'normal'  // 路网图层使用标准样式
  }
}

/**
 * 创建标准图层 - 基于官方文档
 * @returns {AMap.TileLayer} 标准图层实例
 */
export function createStandardLayer() {
  return new window.AMap.TileLayer({
    zooms: [3, 20],
    opacity: 1,
    zIndex: 1,
    visible: true
  })
}

/**
 * 创建暗黑图层 - 使用地图样式设置
 * @returns {AMap.TileLayer} 暗黑图层实例
 */
export function createDarkLayer() {
  return new window.AMap.TileLayer({
    zooms: [3, 20],
    opacity: 1,
    zIndex: 1,
    visible: true
  })
}

/**
 * 创建卫星图层 - 基于官方文档
 * @returns {AMap.TileLayer.Satellite} 卫星图层实例
 */
export function createSatelliteLayer() {
  return new window.AMap.TileLayer.Satellite({
    zooms: [3, 20],
    opacity: 1,
    zIndex: 1,
    visible: true
  })
}

/**
 * 创建路网图层 - 基于官方文档
 * @returns {AMap.TileLayer.RoadNet} 路网图层实例
 */
export function createRoadNetLayer() {
  return new window.AMap.TileLayer.RoadNet({
    zooms: [3, 20],
    opacity: 0.8,
    zIndex: 2,
    visible: true
  })
}

/**
 * 地图图层管理器
 */
export class MapLayerManager {
  constructor(map) {
    this.map = map
    this.currentLayers = []
    this.currentLayerType = LAYER_TYPES.STANDARD
  }

  /**
   * 清理当前图层
   */
  clearLayers() {
    if (this.currentLayers.length > 0) {
      this.currentLayers.forEach(layer => {
        if (layer && typeof layer.destroy === 'function') {
          try {
            layer.destroy()
          } catch (error) {
            console.warn('图层销毁失败:', error)
          }
        }
      })
      this.currentLayers = []
    }
  }

  /**
   * 切换到指定图层类型
   * @param {string} layerType 图层类型
   * @returns {Promise<boolean>} 切换是否成功
   */
  async switchToLayer(layerType) {
    if (!this.map || !Object.values(LAYER_TYPES).includes(layerType)) {
      console.error('无效的图层类型或地图实例')
      return false
    }

    try {
      console.log(`开始切换到${LAYER_CONFIGS[layerType].name}图层...`)

      // 清理之前的图层
      this.clearLayers()

      // 根据图层类型创建新图层和设置地图样式
      switch (layerType) {
        case LAYER_TYPES.STANDARD:
          // 标准地图：使用默认的标准图层
          this.currentLayers = [createStandardLayer()]
          // 设置标准地图样式
          this.map.setMapStyle('amap://styles/normal')
          break

        case LAYER_TYPES.DARK:
          // 暗黑地图：使用标准图层但设置暗黑样式
          this.currentLayers = [createDarkLayer()]
          // 设置暗黑地图样式
          this.map.setMapStyle('amap://styles/dark')
          break

        case LAYER_TYPES.SATELLITE:
          // 卫星地图：卫星影像 + 路网标注
          this.currentLayers = [
            createSatelliteLayer(),
            createRoadNetLayer()
          ]
          // 卫星图层使用标准样式
          this.map.setMapStyle('amap://styles/normal')
          break

        case LAYER_TYPES.ROADNET:
          // 路网地图：纯路网图层
          this.currentLayers = [createRoadNetLayer()]
          // 路网图层使用标准样式
          this.map.setMapStyle('amap://styles/normal')
          break

        default:
          console.error('未知的图层类型:', layerType)
          return false
      }

      // 设置图层到地图
      this.map.setLayers(this.currentLayers)
      this.currentLayerType = layerType

      // 等待图层加载
      await this.waitForLayersLoad()

      console.log(`✅ 成功切换到${LAYER_CONFIGS[layerType].name}图层`)
      return true

    } catch (error) {
      console.error('❌ 切换图层失败:', error)
      return false
    }
  }

  /**
   * 等待图层加载完成
   * @returns {Promise<void>}
   */
  waitForLayersLoad() {
    return new Promise((resolve) => {
      // 简单的延时等待，实际项目中可以监听图层的complete事件
      setTimeout(resolve, 300)
    })
  }

  /**
   * 获取当前图层类型
   * @returns {string} 当前图层类型
   */
  getCurrentLayerType() {
    return this.currentLayerType
  }

  /**
   * 获取当前图层配置
   * @returns {Object} 当前图层配置
   */
  getCurrentLayerConfig() {
    return LAYER_CONFIGS[this.currentLayerType]
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.clearLayers()
    this.map = null
  }
}

/**
 * 验证高德地图API是否可用
 * @returns {boolean} API是否可用
 */
export function validateAmapAPI() {
  if (!window.AMap) {
    console.error('高德地图API未加载')
    return false
  }

  if (!window.AMap.TileLayer) {
    console.error('TileLayer类不可用')
    return false
  }

  if (!window.AMap.TileLayer.Satellite) {
    console.error('Satellite图层类不可用')
    return false
  }

  if (!window.AMap.TileLayer.RoadNet) {
    console.error('RoadNet图层类不可用')
    return false
  }

  return true
}
