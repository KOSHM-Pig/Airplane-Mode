import * as Cesium from 'cesium'
import { calculateDistance, estimateFlightTime, getAirportById, type Airport } from '../data/airports'
import { CameraAnimationService } from './CameraAnimationService'

// 飞行路线接口
export interface FlightRoute {
  id: string
  name: string
  startPos: {
    longitude: number
    latitude: number
    height: number
  }
  endPos: {
    longitude: number
    latitude: number
    height: number
  }
  cruiseHeight: number
  duration: number // 飞行时间（秒）
  averageSpeed: number // 平均速度（km/h）
  departureAirport?: Airport
  arrivalAirport?: Airport
}

// 飞行状态接口
export interface FlightStatus {
  isFlying: boolean
  progress: number // 0-100
  remainingTime: string
  currentSpeed: number
  currentAltitude: number
  elapsedTime: number
}

// 飞行服务类
export class FlightService {
  private viewer: Cesium.Viewer
  private airplaneEntity: Cesium.Entity | null = null
  private currentRoute: FlightRoute | null = null
  private startTime: number = 0
  private statusUpdateInterval: number | null = null
  private cameraAnimationService: CameraAnimationService
  private flightStatus: FlightStatus = {
    isFlying: false,
    progress: 0,
    remainingTime: '00:00:00',
    currentSpeed: 0,
    currentAltitude: 0,
    elapsedTime: 0
  }

  // 预定义航线
  private routes: FlightRoute[] = [
    {
      id: 'xian-paris',
      name: '西安→巴黎',
      startPos: { longitude: 108.9402, latitude: 34.3416, height: 500 }, // 西安咸阳国际机场
      endPos: { longitude: 2.3522, latitude: 48.8566, height: 500 }, // 巴黎戴高乐机场
      cruiseHeight: 11000, // 11km巡航高度
      duration: 11 * 60 * 60, // 11小时
      averageSpeed: 650 // 650km/h
    },
    {
      id: 'beijing-tokyo',
      name: '北京→东京',
      startPos: { longitude: 116.4074, latitude: 39.9042, height: 500 }, // 北京首都国际机场
      endPos: { longitude: 139.6917, latitude: 35.6895, height: 500 }, // 东京成田国际机场
      cruiseHeight: 10000, // 10km巡航高度
      duration: 3 * 60 * 60, // 3小时
      averageSpeed: 550 // 550km/h
    }
  ]

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.cameraAnimationService = new CameraAnimationService(viewer)
  }

  // 获取航线信息
  getRouteById(routeId: string): FlightRoute | null {
    return this.routes.find(route => route.id === routeId) || null
  }

  // 获取所有航线
  getAllRoutes(): FlightRoute[] {
    return this.routes
  }

  // 根据机场ID创建动态航线
  createCustomRoute(departureId: string, arrivalId: string): FlightRoute | null {
    const departure = getAirportById(departureId)
    const arrival = getAirportById(arrivalId)

    if (!departure || !arrival) {
      console.error('❌ [FlightService] 无法找到指定的机场')
      return null
    }

    // 计算距离和飞行时间
    const distance = calculateDistance(departure, arrival)
    const flightTimeHours = estimateFlightTime(distance)
    const duration = Math.round(flightTimeHours * 3600) // 转换为秒

    // 根据距离确定巡航高度
    let cruiseHeight: number
    if (distance < 1000) {
      cruiseHeight = 8000 // 短途：8km
    } else if (distance < 5000) {
      cruiseHeight = 10000 // 中途：10km
    } else {
      cruiseHeight = 11000 // 长途：11km
    }

    const route: FlightRoute = {
      id: `${departureId}-${arrivalId}`,
      name: `${departure.iataCode} → ${arrival.iataCode}`,
      startPos: {
        longitude: departure.longitude,
        latitude: departure.latitude,
        height: departure.elevation + 100 // 机场海拔 + 100米起飞高度
      },
      endPos: {
        longitude: arrival.longitude,
        latitude: arrival.latitude,
        height: arrival.elevation + 100 // 机场海拔 + 100米降落高度
      },
      cruiseHeight,
      duration,
      averageSpeed: Math.round(distance / flightTimeHours), // 根据距离和时间计算平均速度
      departureAirport: departure,
      arrivalAirport: arrival
    }

    return route
  }

  // 开始自定义航线飞行
  async startCustomFlight(departureId: string, arrivalId: string): Promise<boolean> {
    try {
      // 停止当前飞行（但不停止相机动画，稍后会重新启动）
      this.stopFlightWithoutCameraStop()

      // 创建自定义航线
      const customRoute = this.createCustomRoute(departureId, arrivalId)
      if (!customRoute) {
        return false
      }

      console.log(`🛫 [FlightService] 开始自定义飞行: ${customRoute.name}`)
      console.log(`📏 距离: ${Math.round(calculateDistance(customRoute.departureAirport!, customRoute.arrivalAirport!))} km`)
      console.log(`⏱️ 预计飞行时间: ${Math.round(customRoute.duration / 3600)}小时${Math.round((customRoute.duration % 3600) / 60)}分钟`)

      // 执行飞行
      return await this.executeFlight(customRoute)
    } catch (error) {
      console.error('❌ [FlightService] 自定义飞行启动失败:', error)
      return false
    }
  }

  // 获取飞行状态
  getFlightStatus(): FlightStatus {
    return { ...this.flightStatus }
  }

  // 开始飞行（预定义航线）
  async startFlight(routeId: string): Promise<boolean> {
    const route = this.getRouteById(routeId)
    if (!route) {
      console.error('🛫 [FlightService] 未找到航线:', routeId)
      return false
    }

    return await this.executeFlight(route)
  }

  // 执行飞行（通用方法）
  private async executeFlight(route: FlightRoute): Promise<boolean> {
    if (this.flightStatus.isFlying) {
      console.warn('🛫 [FlightService] 已有飞行在进行中')
      return false
    }

    console.log(`🛫 [FlightService] 开始飞行: ${route.name}`)

    try {
      // 设置飞行状态
      this.currentRoute = route
      this.flightStatus.isFlying = true
      this.startTime = Date.now()

      // 创建飞行路径
      this.createFlightPath(route)

      // 开始状态更新
      this.startStatusUpdate()

      return true
    } catch (error) {
      console.error('🛫 [FlightService] 飞行启动失败:', error)
      this.flightStatus.isFlying = false
      this.currentRoute = null
      return false
    }
  }

  // 停止飞行
  stopFlight(): void {
    console.log('🛫 [FlightService] 停止飞行')

    // 停止相机动画
    this.cameraAnimationService.stopAnimation()

    this.stopFlightWithoutCameraStop()
  }

  // 停止飞行但不停止相机动画（用于重新开始飞行时）
  private stopFlightWithoutCameraStop(): void {
    console.log('🛫 [FlightService] 停止飞行（保留相机动画）')

    // 停止状态更新
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
      this.statusUpdateInterval = null
    }

    // 重置飞行状态
    this.flightStatus = {
      isFlying: false,
      progress: 0,
      remainingTime: '00:00:00',
      currentSpeed: 0,
      currentAltitude: 0,
      elapsedTime: 0
    }

    // 移除飞机实体
    if (this.airplaneEntity && this.viewer) {
      this.viewer.entities.remove(this.airplaneEntity)
      this.airplaneEntity = null
    }

    // 清理航线路径
    if (this.viewer) {
      const entitiesToRemove = []
      for (let i = 0; i < this.viewer.entities.values.length; i++) {
        const entity = this.viewer.entities.values[i]
        if (entity.name === 'flight-route-line') {
          entitiesToRemove.push(entity)
        }
      }

      entitiesToRemove.forEach(entity => {
        this.viewer!.entities.remove(entity)
      })

      if (entitiesToRemove.length > 0) {
        console.log(`🛫 [FlightService] 已清理 ${entitiesToRemove.length} 个航线路径`)
      }
    }

    // 停止相机跟踪
    if (this.viewer) {
      this.viewer.trackedEntity = undefined
    }

    // 清理当前航线
    this.currentRoute = null
  }

  // 创建3D飞机实体（实时计算位置）
  private createFlightPath(route: FlightRoute): void {
    if (!this.viewer) {
      console.error('🛫 [FlightService] Viewer未初始化')
      throw new Error('Viewer未初始化')
    }

    try {
      console.log('🛫 [FlightService] 开始创建3D飞机实体')
      
      // 预设航线点（起点到终点平均分配）
      const routePoints: Cesium.Cartesian3[] = []
      const numPoints = 100 // 预设100个点

      const geodesic = new Cesium.EllipsoidGeodesic(
        Cesium.Cartographic.fromDegrees(route.startPos.longitude, route.startPos.latitude),
        Cesium.Cartographic.fromDegrees(route.endPos.longitude, route.endPos.latitude)
      )

      for (let i = 0; i <= numPoints; i++) {
        const factor = i / numPoints
        const interpolatedCarto = geodesic.interpolateUsingFraction(factor)

        // 计算高度（起飞-巡航-降落）
        let height: number
        if (factor < 0.15) {
          height = Cesium.Math.lerp(route.startPos.height, route.cruiseHeight, factor / 0.15)
        } else if (factor > 0.85) {
          height = Cesium.Math.lerp(route.cruiseHeight, route.endPos.height, (factor - 0.85) / 0.15)
        } else {
          height = route.cruiseHeight
        }

        const point = Cesium.Cartesian3.fromRadians(interpolatedCarto.longitude, interpolatedCarto.latitude, height)
        routePoints.push(point)
      }

      // 使用预设航线点的位置属性
      const positionProperty = new Cesium.SampledPositionProperty()

      // 设置飞行开始时间和结束时间
      const startTime = Cesium.JulianDate.now()
      const endTime = Cesium.JulianDate.addSeconds(startTime, route.duration, new Cesium.JulianDate())

      // 为每个航线点设置时间和位置
      for (let i = 0; i < routePoints.length; i++) {
        const time = Cesium.JulianDate.addSeconds(
          startTime,
          (i / (routePoints.length - 1)) * route.duration,
          new Cesium.JulianDate()
        )
        positionProperty.addSample(time, routePoints[i])
      }

      console.log('⏰ [FlightService] 飞行时间设置:', {
        startTime: Cesium.JulianDate.toIso8601(startTime),
        endTime: Cesium.JulianDate.toIso8601(endTime),
        duration: route.duration
      })

      // 设置插值算法为线性插值
      positionProperty.setInterpolationOptions({
        interpolationDegree: 1,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      })

      // 使用VelocityOrientationProperty自动计算朝向（基于预设点的速度方向）
      const orientationProperty = new Cesium.VelocityOrientationProperty(positionProperty)

      // 创建3D飞机实体（使用实时计算的位置和朝向）
      this.airplaneEntity = this.viewer.entities.add({
        position: positionProperty,
        orientation: orientationProperty,
        
        // 使用public目录中的飞机模型
        model: {
          uri: '/Airplane.glb',
          scale: 50.0,
          minimumPixelSize: 64,
          maximumScale: 20000,
          show: true
        },

        // 飞机标签
        label: {
          text: '✈️ ' + route.name,
          font: '16px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -40),
          show: true
        },

        // 飞行轨迹
        path: {
          show: true,
          leadTime: 0,
          trailTime: 1800, // 显示30分钟的轨迹
          width: 4,
          resolution: 60,
          material: Cesium.Color.CYAN.withAlpha(0.8)
        }
      })

      console.log('🛫 [FlightService] 3D飞机实体创建完成')

      // 添加大圆弧航线（白灰色）- 与飞机路径高度一致
      const routeLinePoints = []
      for (let i = 0; i <= 50; i++) {
        const factor = i / 50
        const geodesic = new Cesium.EllipsoidGeodesic(
          Cesium.Cartographic.fromDegrees(route.startPos.longitude, route.startPos.latitude),
          Cesium.Cartographic.fromDegrees(route.endPos.longitude, route.endPos.latitude)
        )
        const interpolatedCarto = geodesic.interpolateUsingFraction(factor)

        // 计算与飞机相同的高度（起飞-巡航-降落）
        let height: number
        if (factor < 0.15) {
          height = Cesium.Math.lerp(route.startPos.height, route.cruiseHeight, factor / 0.15)
        } else if (factor > 0.85) {
          height = Cesium.Math.lerp(route.cruiseHeight, route.endPos.height, (factor - 0.85) / 0.15)
        } else {
          height = route.cruiseHeight
        }

        routeLinePoints.push(Cesium.Cartesian3.fromRadians(interpolatedCarto.longitude, interpolatedCarto.latitude, height))
      }
      
      this.viewer.entities.add({
        name: 'flight-route-line',
        polyline: {
          positions: routeLinePoints,
          width: 3,
          material: Cesium.Color.LIGHTGRAY.withAlpha(0.8),
          clampToGround: false
        }
      })
      console.log('🛫 [FlightService] 已添加大圆弧航线路径')
      console.log('🛫 [FlightService] 航线路径点数量:', routeLinePoints.length)
      console.log('🛫 [FlightService] 起点高度:', route.startPos.height, '终点高度:', route.endPos.height, '巡航高度:', route.cruiseHeight)

      // 配置时钟
      this.viewer.clock.startTime = startTime.clone()
      this.viewer.clock.stopTime = endTime.clone()
      this.viewer.clock.currentTime = startTime.clone()
      this.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP
      this.viewer.clock.multiplier = 1 // 加速10倍，更接近真实感

      console.log('⏰ [FlightService] 时钟配置完成:', {
        currentTime: Cesium.JulianDate.toIso8601(this.viewer.clock.currentTime),
        startTime: Cesium.JulianDate.toIso8601(this.viewer.clock.startTime),
        stopTime: Cesium.JulianDate.toIso8601(this.viewer.clock.stopTime),
        multiplier: this.viewer.clock.multiplier
      })

      // 强制启用时钟动画和渲染
      this.viewer.clock.shouldAnimate = true
      this.viewer.scene.requestRender()

      // 确保场景持续渲染
      this.viewer.scene.globe.enableLighting = false // 禁用光照以提高性能
      this.viewer.scene.requestRenderMode = false // 禁用按需渲染，确保持续渲染

      // 禁用Cesium内置相机跟踪，使用自定义相机动画
      this.viewer.trackedEntity = undefined

      // 启动自定义相机动画
      this.cameraAnimationService.startFlightAnimation(this.airplaneEntity, startTime)
      console.log('🛫 [FlightService] 启用自定义相机动画')

      // 启动时钟动画
      this.viewer.clock.shouldAnimate = true

      // 调试：检查飞机位置
      setTimeout(() => {
        if (this.airplaneEntity) {
          const currentPos = this.airplaneEntity.position?.getValue(this.viewer.clock.currentTime)
          if (currentPos) {
            const cartographic = Cesium.Cartographic.fromCartesian(currentPos)
            console.log('🛫 [FlightService] 飞机当前位置:', {
              lon: Cesium.Math.toDegrees(cartographic.longitude).toFixed(4),
              lat: Cesium.Math.toDegrees(cartographic.latitude).toFixed(4),
              height: cartographic.height.toFixed(0)
            })
          } else {
            console.log('❌ [FlightService] 无法获取飞机位置')
          }
        }
      }, 1000)

      console.log('🛫 [FlightService] 飞行路径创建完成，时钟已启动')
    
    } catch (error) {
      console.error('🛫 [FlightService] 创建飞行路径失败:', error)
      // 清理可能已创建的实体
      if (this.airplaneEntity && this.viewer) {
        this.viewer.entities.remove(this.airplaneEntity)
        this.airplaneEntity = null
      }
      throw error
    }
  }

  // 开始状态更新
  private startStatusUpdate(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
    }

    this.statusUpdateInterval = setInterval(() => {
      this.updateFlightStatus()
    }, 1000) as unknown as number
  }

  // 更新飞行状态（只更新状态信息，位置由CallbackProperty实时计算）
  private updateFlightStatus(): void {
    if (!this.currentRoute || !this.flightStatus.isFlying) {
      return
    }

    const elapsed = (Date.now() - this.startTime) / 1000
    const progress = Math.min(elapsed / this.currentRoute.duration, 1.0)

    this.flightStatus.progress = Math.round(progress * 100)
    this.flightStatus.elapsedTime = elapsed
    
    // 计算剩余时间
    const remaining = Math.max(this.currentRoute.duration - elapsed, 0)
    this.flightStatus.remainingTime = this.formatTime(remaining)

    // 计算当前速度
    this.flightStatus.currentSpeed = Math.round(this.currentRoute.averageSpeed * (0.8 + Math.random() * 0.4))
    
    // 计算当前高度（与CallbackProperty中的逻辑保持一致）
    let height: number
    if (progress < 0.15) {
      // 起飞阶段：0-15%
      height = Cesium.Math.lerp(this.currentRoute.startPos.height, this.currentRoute.cruiseHeight, progress / 0.15)
    } else if (progress > 0.85) {
      // 降落阶段：85-100%
      height = Cesium.Math.lerp(this.currentRoute.cruiseHeight, this.currentRoute.endPos.height, (progress - 0.85) / 0.15)
    } else {
      // 巡航阶段：15-85%
      height = this.currentRoute.cruiseHeight
    }
    
    this.flightStatus.currentAltitude = Math.round(height)

    // 检查是否完成飞行
    if (progress >= 1.0) {
      console.log('🛬 [FlightService] 飞行完成')
      this.stopFlight()
    }
  }

  // 格式化时间
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}
