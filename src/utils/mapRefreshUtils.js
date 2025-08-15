/**
 * 地图刷新工具 - 基于高德地图官方示例
 * 专注于飞行过程中的动态地图刷新
 * 参考: https://lbs.amap.com/demo/javascript-api-v2/example/map/change-map-center
 */

// 刷新方法枚举
export const REFRESH_METHODS = {
  SET_CENTER: 'setCenter',           // 设置地图中心点 - 飞行过程中主要使用
  SET_ZOOM: 'setZoom',              // 设置地图缩放级别
  SET_ZOOM_AND_CENTER: 'setZoomAndCenter', // 同时设置缩放和中心点
  FLIGHT_REFRESH: 'flightRefresh'    // 飞行过程中的动态刷新
}

// 地图样式枚举 - 基于官方文档
export const MAP_STYLES = {
  NORMAL: 'amap://styles/normal',     // 标准样式
  DARK: 'amap://styles/dark',         // 暗黑样式
  GREY: 'amap://styles/grey',         // 灰色样式
  LIGHT: 'amap://styles/light',       // 浅色样式
  WHITESMOKE: 'amap://styles/whitesmoke' // 白烟样式
}

// 图层类型到地图样式的映射
export const LAYER_TO_STYLE_MAP = {
  standard: MAP_STYLES.NORMAL,
  dark: MAP_STYLES.DARK,
  satellite: MAP_STYLES.NORMAL,  // 卫星图使用标准样式
  roadnet: MAP_STYLES.NORMAL     // 路网图使用标准样式
}

/**
 * 地图样式管理器类 - 基于官方文档的销毁重建方式
 */
export class MapStyleManager {
  constructor(mapContainer, initMapCallback) {
    this.mapContainer = mapContainer // 地图容器ID
    this.initMapCallback = initMapCallback // 地图初始化回调函数
    this.currentStyle = MAP_STYLES.DARK // 当前样式
    this.mapInstance = null // 地图实例引用

    console.log('✅ 地图样式管理器初始化完成')
  }

  /**
   * 设置地图实例引用
   */
  setMapInstance(mapInstance) {
    this.mapInstance = mapInstance
  }

  /**
   * 切换地图样式 - 销毁重建方式
   * @param {string} newStyle - 新的地图样式
   * @param {Object} options - 可选参数
   * @returns {Promise<boolean>} 切换是否成功
   */
  async switchStyle(newStyle, options = {}) {
    if (!this.mapInstance) {
      console.error('❌ 地图实例不存在')
      return false
    }

    if (this.currentStyle === newStyle) {
      console.log(`⚠️ 样式未变化: ${newStyle}`)
      return true
    }

    try {
      console.log(`🔄 切换地图样式: ${this.currentStyle} → ${newStyle}`)

      // 保存当前地图状态
      const mapState = this.saveMapState()

      // 销毁当前地图
      this.destroyMap()

      // 更新当前样式
      this.currentStyle = newStyle

      // 重新初始化地图
      await this.recreateMap(mapState, options)

      console.log(`✅ 地图样式切换完成: ${newStyle}`)
      return true

    } catch (error) {
      console.error('❌ 地图样式切换失败:', error)
      return false
    }
  }

  /**
   * 根据图层类型切换样式
   * @param {string} layerType - 图层类型
   * @returns {Promise<boolean>} 切换是否成功
   */
  async switchStyleByLayer(layerType) {
    const newStyle = LAYER_TO_STYLE_MAP[layerType] || MAP_STYLES.NORMAL
    return await this.switchStyle(newStyle)
  }

  /**
   * 保存当前地图状态
   */
  saveMapState() {
    if (!this.mapInstance) return null

    try {
      return {
        center: this.mapInstance.getCenter(),
        zoom: this.mapInstance.getZoom(),
        pitch: this.mapInstance.getPitch ? this.mapInstance.getPitch() : 0,
        rotation: this.mapInstance.getRotation ? this.mapInstance.getRotation() : 0,
        viewMode: this.mapInstance.getViewMode ? this.mapInstance.getViewMode() : '3D'
      }
    } catch (error) {
      console.warn('⚠️ 保存地图状态失败:', error)
      return null
    }
  }

  /**
   * 销毁当前地图
   */
  destroyMap() {
    if (this.mapInstance) {
      try {
        this.mapInstance.destroy()
        console.log('🗑️ 地图已销毁')
      } catch (error) {
        console.warn('⚠️ 地图销毁失败:', error)
      }
      this.mapInstance = null
    }
  }

  /**
   * 重新创建地图
   */
  async recreateMap(mapState, options = {}) {
    return new Promise((resolve, reject) => {
      // 短暂延迟确保DOM更新
      setTimeout(() => {
        try {
          // 调用初始化回调，传入当前样式
          const newMapInstance = this.initMapCallback(this.currentStyle, mapState)

          if (newMapInstance) {
            this.mapInstance = newMapInstance

            // 恢复地图状态
            if (mapState) {
              this.restoreMapState(mapState)
            }

            resolve(newMapInstance)
          } else {
            reject(new Error('地图初始化回调返回空实例'))
          }
        } catch (error) {
          reject(error)
        }
      }, options.delay || 100)
    })
  }

  /**
   * 恢复地图状态
   */
  restoreMapState(mapState) {
    if (!this.mapInstance || !mapState) return

    try {
      // 恢复基本状态
      if (mapState.center) {
        this.mapInstance.setCenter(mapState.center)
      }
      if (mapState.zoom) {
        this.mapInstance.setZoom(mapState.zoom)
      }

      // 恢复3D状态（如果支持）
      if (this.mapInstance.setPitch && mapState.pitch !== undefined) {
        this.mapInstance.setPitch(mapState.pitch)
      }
      if (this.mapInstance.setRotation && mapState.rotation !== undefined) {
        this.mapInstance.setRotation(mapState.rotation)
      }

      console.log('✅ 地图状态已恢复')
    } catch (error) {
      console.warn('⚠️ 恢复地图状态失败:', error)
    }
  }

  /**
   * 获取当前样式
   */
  getCurrentStyle() {
    return this.currentStyle
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.destroyMap()
    this.mapContainer = null
    this.initMapCallback = null
    console.log('🗑️ 地图样式管理器已销毁')
  }
}

/**
 * 地图刷新管理器类
 * 基于官方示例的setCenter、setZoom、setZoomAndCenter方法
 */
export class MapRefreshManager {
  constructor(map) {
    this.map = map
    this.refreshCount = 0
    this.lastRefreshTime = 0
    this.refreshHistory = []

    // 默认刷新范围配置（使用飞行配置中的缩放级别）
    this.config = {
      // 使用飞行配置中的缩放级别（14）
      fixedZoom: 14,
      // 缩放级别范围 [3,20] - 支持更大范围
      zoomRange: {
        min: 3,
        max: 20
      },
      // 坐标范围 - 基于官方示例的上海区域
      coordinateRange: {
        lng: {
          min: 121.138398,
          max: 121.728226
        },
        lat: {
          min: 30.972688,
          max: 31.487611
        }
      }
    }

    console.log('地图刷新管理器初始化完成 - 基于官方API示例')
  }

  /**
   * 飞行过程中的动态地图刷新 - 根据用户缩放手势动态调整
   * 使用飞行配置中的缩放级别12，根据用户手势进行微调
   */
  refreshByUserZoomGesture(userZoom = null) {
    if (!this.map) return false

    try {
      // 使用飞行配置中的基础缩放级别（12）
      const baseZoom = this.config.fixedZoom

      // 如果用户有缩放手势，使用用户的缩放级别
      let targetZoom = baseZoom
      if (userZoom !== null && userZoom !== undefined) {
        // 限制在合理范围内
        targetZoom = Math.max(this.config.zoomRange.min, Math.min(this.config.zoomRange.max, userZoom))
      }

      // 使用官方API setZoom方法
      this.map.setZoom(targetZoom)

      this._recordRefresh('userZoomGesture', { baseZoom, targetZoom, userZoom })
      console.log(`✈️ 用户缩放手势刷新 - 缩放级别设为 ${targetZoom.toFixed(2)} (用户手势: ${userZoom ? userZoom.toFixed(2) : '无'})`)

      return true
    } catch (error) {
      console.error('用户缩放手势刷新失败:', error)
      return false
    }
  }

  /**
   * 设置地图中心点刷新 - 基于官方示例
   * 对应官方示例中的 "设置地图中心点 setCenter" 功能
   */
  refreshBySetCenter(position) {
    if (!this.map || !position) return false

    try {
      const [lng, lat] = position

      // 使用官方API setCenter方法
      this.map.setCenter([lng, lat])

      this._recordRefresh('setCenter', { lng, lat })
      console.log(`🔄 设置地图中心点刷新 - 当前中心点已设为 [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)

      return true
    } catch (error) {
      console.error('设置地图中心点刷新失败:', error)
      return false
    }
  }

  /**
   * 设置地图缩放级别刷新 - 基于官方示例
   * 对应官方示例中的 "设置地图层级 setZoom" 功能
   */
  refreshBySetZoom(zoom) {
    if (!this.map || typeof zoom !== 'number') return false

    try {
      // 使用官方API setZoom方法
      this.map.setZoom(zoom)

      this._recordRefresh('setZoom', { zoom })
      console.log(`🔄 设置地图缩放级别刷新 - 当前层级已设为${zoom}级`)

      return true
    } catch (error) {
      console.error('设置地图缩放级别刷新失败:', error)
      return false
    }
  }

  /**
   * 设置地图缩放和中心点组合刷新 - 基于官方示例
   * 对应官方示例中的 "设置地图层级与中心点 setZoomAndCenter" 功能
   */
  refreshBySetZoomAndCenter(zoom, position) {
    if (!this.map || typeof zoom !== 'number' || !position) return false

    try {
      const [lng, lat] = position

      // 使用官方API setZoomAndCenter方法 - 同时设置地图层级与中心点
      this.map.setZoomAndCenter(zoom, [lng, lat])

      this._recordRefresh('setZoomAndCenter', { zoom, lng, lat })
      console.log(`🔄 设置地图缩放和中心点刷新 - 层级已设为${zoom}级，中心点已设为 [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)

      return true
    } catch (error) {
      console.error('设置地图缩放和中心点刷新失败:', error)
      return false
    }
  }

  /**
   * 飞行过程中的API组合刷新 - 基于当前飞机位置
   * 使用官方示例的方法，但以飞机位置为基准
   */
  refreshByAPICombo(flightPosition = null, flightZoom = null) {
    if (!this.map) return false

    try {
      const startTime = performance.now()

      // 获取当前地图状态作为基准
      const currentCenter = this.map.getCenter()
      const currentZoom = this.map.getZoom()

      // 使用飞机位置或当前中心点
      const basePosition = flightPosition || [currentCenter.lng, currentCenter.lat]
      const baseZoom = flightZoom || currentZoom

      // 第一步：设置地图层级 (官方示例方法1)
      this.map.setZoom(baseZoom)

      // 短暂延迟，让第一步生效
      setTimeout(() => {
        // 第二步：设置地图中心点 (官方示例方法2)
        this.map.setCenter(basePosition)

        // 再次短暂延迟
        setTimeout(() => {
          // 第三步：同时设置地图层级与中心点 (官方示例方法3)
          this.map.setZoomAndCenter(baseZoom, basePosition)

          const endTime = performance.now()
          this._recordRefresh('apiCombo', {
            zoom: baseZoom,
            lng: basePosition[0],
            lat: basePosition[1],
            duration: endTime - startTime
          })

          console.log(`🔄 飞行API组合刷新完成 - 耗时: ${(endTime - startTime).toFixed(2)}ms`)
          console.log(`   步骤1: setZoom(${baseZoom})`)
          console.log(`   步骤2: setCenter([${basePosition[0].toFixed(6)}, ${basePosition[1].toFixed(6)}])`)
          console.log(`   步骤3: setZoomAndCenter(${baseZoom}, [${basePosition[0].toFixed(6)}, ${basePosition[1].toFixed(6)}])`)
        }, 100)
      }, 100)

      return true
    } catch (error) {
      console.error('飞行API组合刷新失败:', error)
      return false
    }
  }

  /**
   * 智能刷新 - 根据飞行状态选择最佳刷新方法
   */
  smartRefresh(flightPosition = null, flightZoom = null) {
    if (!this.map) return false

    try {
      // 获取当前地图状态
      const currentZoom = this.map.getZoom()
      const currentCenter = this.map.getCenter()

      // 根据刷新历史选择方法
      const recentMethods = this.refreshHistory.slice(-3).map(h => h.method)

      let selectedMethod
      let methodParams = {}

      // 如果有用户缩放，优先使用用户缩放刷新
      if (flightZoom !== null && flightZoom !== undefined) {
        selectedMethod = REFRESH_METHODS.FLIGHT_REFRESH
        methodParams = { userZoom: flightZoom }
      } else {
        // 避免连续使用相同方法
        if (recentMethods.length >= 2 && recentMethods.every(m => m === recentMethods[0])) {
          // 如果最近都是同一种方法，切换到设置中心点方法
          selectedMethod = REFRESH_METHODS.SET_CENTER
          methodParams = { position: [currentCenter.lng, currentCenter.lat] }
        } else {
          // 默认使用设置中心点方法
          selectedMethod = REFRESH_METHODS.SET_CENTER
          methodParams = { position: [currentCenter.lng, currentCenter.lat] }
        }
      }

      console.log(`🧠 智能刷新选择方法: ${selectedMethod}`)
      return this._executeRefreshMethod(selectedMethod, methodParams)

    } catch (error) {
      console.error('智能刷新失败:', error)
      return false
    }
  }

  /**
   * 执行指定的刷新方法
   */
  _executeRefreshMethod(method, params = {}) {
    switch (method) {
      case REFRESH_METHODS.SET_CENTER:
        return this.refreshBySetCenter(params.position)
      case REFRESH_METHODS.SET_ZOOM:
        return this.refreshBySetZoom(params.zoom)
      case REFRESH_METHODS.SET_ZOOM_AND_CENTER:
        return this.refreshBySetZoomAndCenter(params.zoom, params.position)
      case REFRESH_METHODS.FLIGHT_REFRESH:
        return this.refreshByUserZoomGesture(params.userZoom)
      default:
        console.warn(`未知的刷新方法: ${method}`)
        return this.refreshBySetCenter([116.397428, 39.90923]) // 默认使用北京坐标
    }
  }

  /**
   * 记录刷新历史
   */
  _recordRefresh(method, params = {}) {
    this.refreshCount++
    this.lastRefreshTime = Date.now()

    const record = {
      method,
      params,
      timestamp: this.lastRefreshTime,
      count: this.refreshCount
    }

    this.refreshHistory.push(record)

    // 只保留最近10次记录
    if (this.refreshHistory.length > 10) {
      this.refreshHistory.shift()
    }
  }

  /**
   * 获取刷新统计信息
   */
  getRefreshStats() {
    return {
      refreshCount: this.refreshCount,
      lastRefreshTime: this.lastRefreshTime,
      history: this.refreshHistory.slice(),
      methodStats: this._getMethodStats()
    }
  }

  /**
   * 获取方法使用统计
   */
  _getMethodStats() {
    const stats = {}
    this.refreshHistory.forEach(record => {
      stats[record.method] = (stats[record.method] || 0) + 1
    })
    return stats
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.map = null
    this.refreshHistory = []
    console.log('地图刷新管理器已销毁')
  }
}

/**
 * 创建地图样式管理器实例
 * @param {string} mapContainer - 地图容器ID
 * @param {Function} initMapCallback - 地图初始化回调函数
 * @returns {MapStyleManager} 样式管理器实例
 */
export function createMapStyleManager(mapContainer, initMapCallback) {
  if (!mapContainer || !initMapCallback) {
    console.warn('创建地图样式管理器失败: 参数不完整')
    return null
  }

  return new MapStyleManager(mapContainer, initMapCallback)
}

/**
 * 创建地图刷新管理器实例
 * @param {Object} map - 高德地图实例
 * @returns {MapRefreshManager} 刷新管理器实例
 */
export function createMapRefreshManager(map) {
  if (!map) {
    console.warn('创建地图刷新管理器失败: 地图实例为空')
    return null
  }

  return new MapRefreshManager(map)
}

/**
 * 用户缩放手势快速刷新 - 基于官方示例的setZoom方法
 * 每次刷新1个级别，响应用户的缩放操作
 * @param {Object} map - 高德地图实例
 * @param {number} userZoom - 用户缩放级别（可选）
 * @returns {boolean} 刷新是否成功
 */
export function quickFlightRefresh(map, userZoom = null) {
  if (!map) return false

  try {
    // 如果用户有缩放手势，直接使用用户的缩放级别
    let targetZoom
    if (userZoom !== null && userZoom !== undefined) {
      // 限制在合理范围内
      targetZoom = Math.max(3, Math.min(20, userZoom))
    } else {
      // 没有用户手势时，使用飞行配置中的缩放级别12
      targetZoom = 12
    }

    // 使用官方API setZoom方法
    map.setZoom(targetZoom)

    console.log(`⚡ 用户缩放快速刷新 - 缩放级别设为: ${targetZoom.toFixed(0)} (用户手势: ${userZoom ? userZoom.toFixed(0) : '飞行配置12级'})`)
    return true
  } catch (error) {
    console.error('用户缩放快速刷新失败:', error)
    return false
  }
}

/**
 * 飞行过程中的批量缩放刷新 - 缓慢连续调整缩放级别
 * @param {Object} map - 高德地图实例
 * @param {number} steps - 刷新步数，默认5步
 * @param {number} interval - 刷新间隔（毫秒），默认500ms
 * @returns {Promise<boolean>} 刷新是否成功
 */
export async function batchFlightRefresh(map, steps = 5, interval = 500) {
  if (!map) return false

  try {
    console.log(`🔄 开始飞行批量缩放刷新 - 共${steps}步，间隔${interval}ms`)

    const baseZoom = map.getZoom()

    for (let i = 0; i < steps; i++) {
      // 每步进行微小的缩放调整
      const zoomDelta = 0.02 * (i + 1) // 逐渐增加变化量
      const direction = i % 2 === 0 ? 1 : -1 // 交替方向
      const newZoom = Math.max(11, Math.min(18, baseZoom + (zoomDelta * direction)))

      // 使用官方API setZoom方法
      map.setZoom(newZoom)
      console.log(`   步骤${i + 1}: setZoom(${newZoom.toFixed(3)})`)

      // 等待间隔（最后一次不需要等待）
      if (i < steps - 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    }

    // 最后恢复到原始缩放级别
    map.setZoom(baseZoom)
    console.log(`   恢复原始缩放: setZoom(${baseZoom.toFixed(2)})`)

    console.log(`✅ 飞行批量缩放刷新完成`)
    return true
  } catch (error) {
    console.error('飞行批量缩放刷新失败:', error)
    return false
  }
}

/**
 * 获取官方示例的默认配置
 * @returns {Object} 配置对象
 */
export function getOfficialExampleConfig() {
  return {
    // 来自官方示例的缩放范围
    zoomRange: {
      min: 11,
      max: 18,
      description: 'zoom范围[11,18] - 来自官方示例'
    },
    // 来自官方示例的坐标范围（上海区域）
    coordinateRange: {
      lng: {
        min: 121.138398,
        max: 121.728226,
        description: '经度范围[121.138398, 121.728226] - 来自官方示例'
      },
      lat: {
        min: 30.972688,
        max: 31.487611,
        description: '纬度范围[30.972688, 31.487611] - 来自官方示例'
      }
    },
    // 官方示例的核心方法
    officialMethods: [
      'setZoom',           // 设置地图层级
      'setCenter',         // 设置地图中心点
      'setZoomAndCenter'   // 同时设置地图层级与中心点
    ],
    // 官方示例URL
    exampleUrl: 'https://lbs.amap.com/demo/javascript-api-v2/example/map/change-map-center'
  }
}

// 默认导出
export default {
  MapStyleManager,
  MapRefreshManager,
  createMapStyleManager,
  createMapRefreshManager,
  quickFlightRefresh,
  batchFlightRefresh,
  getOfficialExampleConfig,
  MAP_STYLES,
  LAYER_TO_STYLE_MAP,
  REFRESH_METHODS
}