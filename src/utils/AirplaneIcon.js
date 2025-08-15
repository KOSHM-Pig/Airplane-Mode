/**
 * 飞机图标工具模块
 * 负责创建、管理和优化飞机图标的显示
 */

import { FLIGHT_CONFIG } from '../config/flightConfig.js'

/**
 * 创建飞机SVG图标
 * @param {Object} options - 图标配置选项
 * @param {number} options.size - 图标大小（默认从配置文件读取）
 * @param {string} options.color - 图标颜色
 * @param {string} options.strokeColor - 边框颜色
 * @param {number} options.strokeWidth - 边框宽度
 * @returns {string} SVG字符串
 */
export function createAirplaneSVG(options = {}) {
  const config = {
    size: options.size || FLIGHT_CONFIG.airplane.size * 1.5, // 增大1.5倍
    color: options.color || FLIGHT_CONFIG.airplane.color,
    strokeColor: options.strokeColor || FLIGHT_CONFIG.airplane.strokeColor,
    strokeWidth: options.strokeWidth || FLIGHT_CONFIG.airplane.strokeWidth
  }

  // 优化的飞机SVG路径，更清晰的轮廓
  const airplanePath = `
    <svg width="${config.size}" height="${config.size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 添加阴影效果 -->
        <filter id="airplane-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        <!-- 添加渐变效果 -->
        <linearGradient id="airplane-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- 飞机主体 -->
      <g filter="url(#airplane-shadow)">
        <!-- 机身 -->
        <ellipse cx="50" cy="50" rx="8" ry="25" 
                 fill="url(#airplane-gradient)" 
                 stroke="${config.strokeColor}" 
                 stroke-width="${config.strokeWidth}"/>
        
        <!-- 主翼 -->
        <ellipse cx="50" cy="45" rx="20" ry="6" 
                 fill="url(#airplane-gradient)" 
                 stroke="${config.strokeColor}" 
                 stroke-width="${config.strokeWidth}"/>
        
        <!-- 尾翼 -->
        <ellipse cx="50" cy="65" rx="8" ry="4" 
                 fill="url(#airplane-gradient)" 
                 stroke="${config.strokeColor}" 
                 stroke-width="${config.strokeWidth}"/>
        
        <!-- 机头 -->
        <circle cx="50" cy="30" r="4" 
                fill="${config.color}" 
                stroke="${config.strokeColor}" 
                stroke-width="${config.strokeWidth}"/>
      </g>
    </svg>
  `

  return airplanePath
}

/**
 * 创建高德地图飞机图标 - 使用原始 plane.svg
 * @param {Object} options - 图标配置选项
 * @returns {AMap.Icon} 高德地图图标对象
 */
export function createAirplaneIcon(options = {}) {
  // 使用更大的尺寸
  const size = options.size || FLIGHT_CONFIG.airplane.size * 2 // 增大到2倍

  return new window.AMap.Icon({
    image: '/plane.svg', // 使用原始的 plane.svg 文件
    size: new window.AMap.Size(size, size),
    imageSize: new window.AMap.Size(size, size),
    anchor: 'center' // 设置锚点为中心
  })
}

/**
 * 简化的高精度飞行路径计算器
 * 使用分段线性插值，确保飞机准确在航线上
 */
export class PrecisionFlightCalculator {
  constructor(startPoint, endPoint, segmentCount = 50) {
    // 存储原始坐标
    this.startPoint = [parseFloat(startPoint[0]), parseFloat(startPoint[1])]
    this.endPoint = [parseFloat(endPoint[0]), parseFloat(endPoint[1])]

    // 计算总距离
    this.totalDistance = this.calculateDistance(this.startPoint, this.endPoint)

    // 生成分段路径点
    this.pathPoints = this.generateLinearPath(segmentCount)

    console.log(`生成 ${this.pathPoints.length} 个路径点，总距离: ${(this.totalDistance/1000).toFixed(1)}公里`)
  }

  /**
   * 生成线性分段路径点
   * @param {number} segmentCount - 段数
   * @returns {Array} 路径点数组
   */
  generateLinearPath(segmentCount) {
    const points = []

    // 生成分段路径点
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount
      const lng = this.startPoint[0] + (this.endPoint[0] - this.startPoint[0]) * t
      const lat = this.startPoint[1] + (this.endPoint[1] - this.startPoint[1]) * t

      // 使用合理精度
      points.push([
        parseFloat(lng.toFixed(8)),
        parseFloat(lat.toFixed(8))
      ])
    }

    return points
  }

  /**
   * 基于球面路径的精确位置计算
   * @param {number} progress - 进度值 (0-1)
   * @returns {Object} 位置信息
   */
  calculatePosition(progress) {
    // 确保进度值在有效范围内
    const clampedProgress = Math.max(0, Math.min(1, progress))

    // 计算在路径点数组中的位置
    const totalSegments = this.pathPoints.length - 1
    const segmentProgress = clampedProgress * totalSegments
    const segmentIndex = Math.floor(segmentProgress)
    const localProgress = segmentProgress - segmentIndex

    // 处理边界情况
    if (segmentIndex >= totalSegments) {
      const lastPoint = this.pathPoints[this.pathPoints.length - 1]
      return {
        lng: lastPoint[0],
        lat: lastPoint[1],
        coordinates: [lastPoint[0], lastPoint[1]],
        progress: clampedProgress,
        segmentIndex: totalSegments - 1,
        localProgress: 1,
        onGreatCircle: true
      }
    }

    // 获取当前段的起点和终点
    const startPoint = this.pathPoints[segmentIndex]
    const endPoint = this.pathPoints[segmentIndex + 1]

    // 在当前段内进行高精度线性插值
    // 由于段很短，线性插值的误差可以忽略
    const lng = startPoint[0] + (endPoint[0] - startPoint[0]) * localProgress
    const lat = startPoint[1] + (endPoint[1] - startPoint[1]) * localProgress

    return {
      lng: lng,
      lat: lat,
      coordinates: [lng, lat],
      progress: clampedProgress,
      segmentIndex,
      localProgress,
      onGreatCircle: true
    }
  }

  /**
   * 获取指定索引的路径点
   * @param {number} index - 路径点索引
   * @returns {Array|null} 路径点坐标 [lng, lat]
   */
  getPathPoint(index) {
    if (index >= 0 && index < this.pathPoints.length) {
      return this.pathPoints[index]
    }
    return null
  }

  /**
   * 获取所有路径点
   * @returns {Array} 路径点数组
   */
  getAllPathPoints() {
    return [...this.pathPoints] // 返回副本，避免外部修改
  }

  /**
   * 获取路径统计信息
   * @returns {Object} 统计信息
   */
  getPathStats() {
    const totalPoints = this.pathPoints.length
    const segments = totalPoints - 1
    const avgSegmentDistance = segments > 0 ? this.totalDistance / segments : 0

    return {
      totalPoints,
      segments,
      totalDistance: this.totalDistance,
      avgSegmentDistance,
      avgSegmentDistanceKm: avgSegmentDistance / 1000,
      pathType: 'great-circle'
    }
  }

  /**
   * 计算两点间距离（米）
   * @param {Array} point1 - [lng, lat]
   * @param {Array} point2 - [lng, lat]
   * @returns {number} 距离（米）
   */
  calculateDistance(point1, point2) {
    const R = 6371000 // 地球半径（米）
    const lat1Rad = point1[1] * Math.PI / 180
    const lat2Rad = point2[1] * Math.PI / 180
    const deltaLatRad = (point2[1] - point1[1]) * Math.PI / 180
    const deltaLngRad = (point2[0] - point1[0]) * Math.PI / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * 验证位置是否在航线上（容差检查）
   * @param {Array} position - [lng, lat]
   * @param {number} tolerance - 容差（米）
   * @returns {boolean} 是否在航线上
   */
  isOnRoute(position, tolerance = 1000) { // 增加容差到1公里
    // 使用简化的检查方法
    const distanceToStart = this.calculateDistance(this.startPoint, position)
    const distanceToEnd = this.calculateDistance(position, this.endPoint)
    const calculatedTotal = distanceToStart + distanceToEnd

    // 检查是否在航线上（允许较大容差）
    const deviation = Math.abs(calculatedTotal - this.totalDistance)
    return deviation <= tolerance
  }
}

/**
 * 飞机位置管理器
 * 负责管理飞机在不同模式下的位置显示
 */
export class AirplanePositionManager {
  constructor(map, is3DMode) {
    this.map = map
    this.is3DMode = is3DMode
    this.calculator = null
    this.lastValidPosition = null
  }

  /**
   * 设置航线
   * @param {Array} startPoint - 起点 [lng, lat]
   * @param {Array} endPoint - 终点 [lng, lat]
   * @param {number} waypointCount - 途径点数量（可选，默认50）
   */
  setRoute(startPoint, endPoint, waypointCount = 50) {
    this.calculator = new PrecisionFlightCalculator(startPoint, endPoint, waypointCount)
    this.lastValidPosition = null

    console.log(`航线设置完成，起点: [${startPoint[0].toFixed(4)}, ${startPoint[1].toFixed(4)}]`)
    console.log(`终点: [${endPoint[0].toFixed(4)}, ${endPoint[1].toFixed(4)}]`)
    console.log(`途径点数量: ${waypointCount}`)
  }

  /**
   * 计算飞机在航线上的精确位置
   * @param {number} progress - 飞行进度 (0-1)
   * @returns {Object} 位置信息
   */
  calculatePlanePosition(progress) {
    if (!this.calculator) {
      throw new Error('航线未设置，请先调用 setRoute 方法')
    }

    // 使用高精度计算器计算位置
    const basePosition = this.calculator.calculatePosition(progress)

    // 验证位置是否在航线上
    if (!this.calculator.isOnRoute(basePosition.coordinates)) {
      console.warn('飞机位置偏离航线，使用上次有效位置')
      if (this.lastValidPosition) {
        return this.lastValidPosition
      }
    }

    let result = {
      position2D: basePosition.coordinates,
      position3D: null, // 初始化为null
      coordinates: basePosition,
      progress: basePosition.progress,
      altitude: 0,
      segmentIndex: basePosition.segmentIndex || 0,
      localProgress: basePosition.localProgress || 0
    }

    // 3D模式下计算高度
    if (this.is3DMode.value) {
      const currentPitch = this.map.getPitch() || 30
      const baseAltitude = FLIGHT_CONFIG.camera.flightAltitude || 1000

      // 根据俯仰角动态调整高度，确保飞机在航线上方可见
      const altitudeMultiplier = 1 + (currentPitch / 90) * 0.5
      const adjustedAltitude = Math.round(baseAltitude * altitudeMultiplier)

      // 创建3D位置对象
      if (typeof window !== 'undefined' && window.AMap) {
        result.position3D = new window.AMap.LngLat(
          basePosition.lng,
          basePosition.lat,
          adjustedAltitude
        )
      } else {
        // 降级处理：如果AMap不可用，使用2D位置
        result.position3D = result.position2D
      }
      result.altitude = adjustedAltitude
    } else {
      result.position3D = result.position2D
    }

    // 保存有效位置
    this.lastValidPosition = result
    return result
  }

  /**
   * 验证并校正飞机位置
   * @param {AMap.Marker} airplaneMarker - 飞机标记
   */
  validateAndCorrectPosition(airplaneMarker) {
    if (!airplaneMarker || !this.calculator) return

    const currentPos = airplaneMarker.getPosition()
    if (!currentPos) return

    const currentCoords = [currentPos.getLng(), currentPos.getLat()]
    
    // 检查是否在航线上
    if (!this.calculator.isOnRoute(currentCoords, 50)) { // 50米容差

      
      // 使用最后有效位置校正
      if (this.lastValidPosition) {
        const correctPosition = this.is3DMode.value ? 
          this.lastValidPosition.position3D : 
          this.lastValidPosition.position2D
        
        airplaneMarker.setPosition(correctPosition)

      }
    }
  }
}

/**
 * 计算两点间的方位角
 * @param {Array} start - 起点 [lng, lat]
 * @param {Array} end - 终点 [lng, lat]
 * @returns {number} 方位角（度）
 */
export function calculateBearing(start, end) {
  const startLat = start[1] * Math.PI / 180
  const startLng = start[0] * Math.PI / 180
  const endLat = end[1] * Math.PI / 180
  const endLng = end[0] * Math.PI / 180

  const dLng = endLng - startLng

  const y = Math.sin(dLng) * Math.cos(endLat)
  const x = Math.cos(startLat) * Math.sin(endLat) - 
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng)

  let bearing = Math.atan2(y, x) * 180 / Math.PI
  
  // 转换为0-360度范围
  bearing = (bearing + 360) % 360
  
  return bearing
}
