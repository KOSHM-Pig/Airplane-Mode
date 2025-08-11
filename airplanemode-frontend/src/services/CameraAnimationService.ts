import * as Cesium from 'cesium'

/**
 * 相机动画服务
 * 负责处理飞行过程中的相机动画效果
 */
export class CameraAnimationService {
  private viewer: Cesium.Viewer
  private airplane: Cesium.Entity | null = null
  private isAnimating = false
  private animationFrameId: number | null = null
  private startTime: Cesium.JulianDate | null = null
  private takeoffDuration = 30 // 起飞阶段持续时间（秒）

  // 用户可调整的相机高度参数
  private userCameraHeight = 1200 // 默认3km（确保1km以上距离）
  private minCameraHeight = 500  // 最小1km（确保最小距离）
  private maxCameraHeight = 20000 // 最大20km
  private isUserControlEnabled = true

  // 鼠标/触摸事件监听器
  private wheelHandler: ((event: WheelEvent) => void) | null = null
  private touchStartHandler: ((event: TouchEvent) => void) | null = null
  private touchMoveHandler: ((event: TouchEvent) => void) | null = null
  private lastTouchDistance = 0

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.setupUserControls()
  }

  /**
   * 设置用户控制
   */
  private setupUserControls() {
    const canvas = this.viewer.scene.canvas

    // 滚轮事件（电脑端）
    this.wheelHandler = (event: WheelEvent) => {
      if (!this.isUserControlEnabled || !this.isAnimating) return

      event.preventDefault()

      // 根据滚轮方向调整高度
      const delta = event.deltaY > 0 ? 200 : -200 // 每次滚动200m
      this.adjustCameraHeight(delta)
    }

    // 触摸事件（移动端双指缩放）
    this.touchStartHandler = (event: TouchEvent) => {
      if (!this.isUserControlEnabled || !this.isAnimating) return

      if (event.touches.length === 2) {
        const touch1 = event.touches[0]
        const touch2 = event.touches[1]
        this.lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
      }
    }

    this.touchMoveHandler = (event: TouchEvent) => {
      if (!this.isUserControlEnabled || !this.isAnimating) return

      if (event.touches.length === 2) {
        event.preventDefault()

        const touch1 = event.touches[0]
        const touch2 = event.touches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )

        if (this.lastTouchDistance > 0) {
          const delta = (this.lastTouchDistance - currentDistance) * 10 // 缩放敏感度
          this.adjustCameraHeight(delta)
        }

        this.lastTouchDistance = currentDistance
      }
    }

    // 添加事件监听器
    canvas.addEventListener('wheel', this.wheelHandler, { passive: false })
    canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false })
    canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false })

    console.log('📷 [CameraAnimation] 用户控制已设置')
  }

  /**
   * 调整相机高度
   * @param delta 高度变化量（米）
   */
  private adjustCameraHeight(delta: number) {
    this.userCameraHeight = Math.max(
      this.minCameraHeight,
      Math.min(this.maxCameraHeight, this.userCameraHeight + delta)
    )

    console.log(`📷 [CameraAnimation] 相机高度调整为: ${this.userCameraHeight.toFixed(0)}m`)
  }

  /**
   * 开始飞行相机动画
   * @param airplane 飞机实体
   * @param flightStartTime 飞行开始时间
   */
  startFlightAnimation(airplane: Cesium.Entity, flightStartTime: Cesium.JulianDate) {
    this.airplane = airplane
    this.startTime = flightStartTime.clone()

    // 停止之前的动画
    this.stopAnimation()

    // 禁用Cesium默认的相机控制
    this.viewer.scene.screenSpaceCameraController.enableRotate = false
    this.viewer.scene.screenSpaceCameraController.enableTranslate = false
    this.viewer.scene.screenSpaceCameraController.enableZoom = false
    this.viewer.scene.screenSpaceCameraController.enableTilt = false
    this.viewer.scene.screenSpaceCameraController.enableLook = false

    this.isAnimating = true
    console.log('📷 [CameraAnimation] 开始飞行相机动画，已禁用默认相机控制')

    // 开始动画循环
    this.animate()
  }

  /**
   * 停止相机动画
   */
  stopAnimation() {
    this.isAnimating = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // 恢复Cesium默认的相机控制
    this.viewer.scene.screenSpaceCameraController.enableRotate = true
    this.viewer.scene.screenSpaceCameraController.enableTranslate = true
    this.viewer.scene.screenSpaceCameraController.enableZoom = true
    this.viewer.scene.screenSpaceCameraController.enableTilt = true
    this.viewer.scene.screenSpaceCameraController.enableLook = true

    console.log('📷 [CameraAnimation] 相机动画已停止，已恢复默认相机控制')
  }

  /**
   * 启用/禁用用户控制
   * @param enabled 是否启用
   */
  setUserControlEnabled(enabled: boolean) {
    this.isUserControlEnabled = enabled
    console.log(`📷 [CameraAnimation] 用户控制${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 设置相机高度范围
   * @param min 最小高度（米）
   * @param max 最大高度（米）
   */
  setCameraHeightRange(min: number, max: number) {
    this.minCameraHeight = min
    this.maxCameraHeight = max
    // 确保当前高度在范围内
    this.userCameraHeight = Math.max(min, Math.min(max, this.userCameraHeight))
    console.log(`📷 [CameraAnimation] 相机高度范围设置为: ${min}m - ${max}m`)
  }

  /**
   * 获取当前相机高度
   */
  getCurrentCameraHeight(): number {
    return this.userCameraHeight
  }

  /**
   * 动画循环
   */
  private animate = () => {
    if (!this.isAnimating || !this.airplane || !this.startTime) {
      return
    }

    try {
      const currentTime = this.viewer.clock.currentTime
      const elapsedSeconds = Cesium.JulianDate.secondsDifference(currentTime, this.startTime)

      // 获取飞机当前位置 - 确保使用相同的时间点
      const airplanePosition = this.airplane.position?.getValue(currentTime)
      if (!airplanePosition) {
        // 如果无法获取位置，可能是时间超出了采样范围，尝试使用当前时钟时间
        const fallbackPosition = this.airplane.position?.getValue(this.viewer.clock.currentTime)
        if (!fallbackPosition) {
          console.log('📷 [CameraAnimation] 无法获取飞机位置，时间:', Cesium.JulianDate.toIso8601(currentTime))
          this.animationFrameId = requestAnimationFrame(this.animate)
          return
        }
        // 使用备用位置继续
        this.processAnimation(fallbackPosition, elapsedSeconds)
      } else {
        this.processAnimation(airplanePosition, elapsedSeconds)
      }

    } catch (error) {
      console.error('📷 [CameraAnimation] 动画更新错误:', error)
    }

    // 继续动画循环
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  /**
   * 处理动画逻辑
   */
  private processAnimation(airplanePosition: Cesium.Cartesian3, elapsedSeconds: number) {
    // 调试信息
    if (Math.floor(elapsedSeconds) % 10 === 0 && elapsedSeconds > 0) {
      console.log(`📷 [CameraAnimation] 动画更新 - 已过时间: ${elapsedSeconds.toFixed(1)}s`)
    }

    // 根据飞行阶段设置不同的相机视角
    if (elapsedSeconds <= this.takeoffDuration) {
      // 起飞阶段：从下往上看飞机起飞
      this.updateTakeoffCamera(airplanePosition, elapsedSeconds)
    } else {
      // 巡航阶段：飞机正上方，用户可调整高度
      this.updateCruiseCamera(airplanePosition)
    }
  }

  /**
   * 更新起飞阶段的相机位置 - 从下往上看飞机起飞
   * @param airplanePosition 飞机位置
   * @param elapsedSeconds 已过时间（秒）
   */
  private updateTakeoffCamera(airplanePosition: Cesium.Cartesian3, elapsedSeconds: number) {
    try {
      // 计算动画进度 (0-1)
      const progress = Math.min(elapsedSeconds / this.takeoffDuration, 1)

      // 获取飞机的地理坐标
      const airplaneCartographic = Cesium.Cartographic.fromCartesian(airplanePosition)

      // 起飞相机：保持1km以上距离，从后方斜上方看，逐渐变成正上方俯视
      // 距离：从飞机后方1.5km逐渐移动到正上方1km
      const startDistance = 1500  // 起始：飞机后方1.5km
      const endDistance = 0       // 结束：飞机正上方
      const distance = Cesium.Math.lerp(startDistance, endDistance, progress)

      // 高度：从飞机上方1km逐渐上升到2km
      const startHeight = 1000
      const endHeight = 2000
      const heightOffset = Cesium.Math.lerp(startHeight, endHeight, progress)

      // 计算相机位置（使用飞机坐标作为基准，最小化偏移）
      let cameraPosition: Cesium.Cartesian3

      if (distance > 0) {
        // 使用Cesium的ENU（East-North-Up）坐标系进行精确计算
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(airplanePosition)

        // 在ENU坐标系中，相机位置在飞机后方（负Y方向）
        const localOffset = new Cesium.Cartesian3(0, -distance, heightOffset)

        // 将本地偏移转换为世界坐标
        cameraPosition = Cesium.Matrix4.multiplyByPoint(transform, localOffset, new Cesium.Cartesian3())
      } else {
        // 直接在飞机正上方
        const airplaneCartographic = Cesium.Cartographic.fromCartesian(airplanePosition)
        cameraPosition = Cesium.Cartesian3.fromRadians(
          airplaneCartographic.longitude,
          airplaneCartographic.latitude,
          airplaneCartographic.height + heightOffset
        )
      }

      // 获取相机的地理坐标用于调试
      const cameraCartographic = Cesium.Cartographic.fromCartesian(cameraPosition)

      // 确保飞机始终在相机正中心 - 计算精确的朝向
      const deltaLon = airplaneCartographic.longitude - cameraCartographic.longitude
      const deltaLat = airplaneCartographic.latitude - cameraCartographic.latitude

      // 计算朝向飞机的精确方向角
      const heading = Math.atan2(deltaLon, deltaLat)

      // 计算俯仰角，确保相机朝向飞机中心
      const horizontalDistance = Math.sqrt(deltaLon * deltaLon + deltaLat * deltaLat) * 111320
      const heightDiff = airplaneCartographic.height - cameraCartographic.height
      const pitch = Math.atan2(heightDiff, horizontalDistance)

      // 使用setView方法，确保飞机在视野正中心
      this.viewer.camera.setView({
        destination: cameraPosition,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: 0
        }
      })

      // 调试信息（减少输出频率）
      if (Math.floor(elapsedSeconds) % 5 === 0 && elapsedSeconds > 0) {
        console.log(`📷 [CameraAnimation] 起飞阶段 ${Math.floor(elapsedSeconds)}s - 进度: ${(progress * 100).toFixed(1)}%`)
        console.log('🛩️ 飞机坐标:', {
          longitude: Cesium.Math.toDegrees(airplaneCartographic.longitude).toFixed(6),
          latitude: Cesium.Math.toDegrees(airplaneCartographic.latitude).toFixed(6),
          height: airplaneCartographic.height.toFixed(0) + 'm'
        })
        console.log('📷 相机坐标:', {
          longitude: Cesium.Math.toDegrees(cameraCartographic.longitude).toFixed(6),
          latitude: Cesium.Math.toDegrees(cameraCartographic.latitude).toFixed(6),
          height: cameraCartographic.height.toFixed(0) + 'm'
        })

        // 计算实际距离验证
        const actualDistance = Math.sqrt(
          Math.pow((deltaLon * 111320 * Math.cos(airplaneCartographic.latitude)), 2) +
          Math.pow((deltaLat * 111320), 2)
        )

        console.log('📐 相机参数:', {
          targetDistance: distance.toFixed(0) + 'm',
          actualDistance: actualDistance.toFixed(0) + 'm',
          heightOffset: heightOffset.toFixed(0) + 'm',
          heading: Cesium.Math.toDegrees(heading).toFixed(1) + '°',
          pitch: Cesium.Math.toDegrees(pitch).toFixed(1) + '°'
        })
        console.log('---')
      }

    } catch (error) {
      console.error('📷 [CameraAnimation] 起飞相机更新错误:', error)
    }
  }

  /**
   * 更新巡航阶段的相机位置
   * @param airplanePosition 飞机位置
   */
  private updateCruiseCamera(airplanePosition: Cesium.Cartesian3) {
    try {
      // 巡航阶段：使用用户自定义高度，相机垂直向下
      const airplaneCartographic = Cesium.Cartographic.fromCartesian(airplanePosition)
      const cameraHeight = airplaneCartographic.height + this.userCameraHeight

      // 只在高度变化较大时输出日志，避免刷屏
      const heightDiff = Math.abs(cameraHeight - (airplaneCartographic.height + 2000))
      if (heightDiff > 100) {
        console.log('📷 [CameraAnimation] 更新巡航相机:', {
          airplaneLon: Cesium.Math.toDegrees(airplaneCartographic.longitude).toFixed(4),
          airplaneLat: Cesium.Math.toDegrees(airplaneCartographic.latitude).toFixed(4),
          airplaneHeight: airplaneCartographic.height.toFixed(0),
          userCameraHeight: this.userCameraHeight.toFixed(0),
          totalCameraHeight: cameraHeight.toFixed(0)
        })
      }

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromRadians(
          airplaneCartographic.longitude,
          airplaneCartographic.latitude,
          cameraHeight
        ),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90), // 垂直向下
          roll: 0
        }
      })

      // 强制渲染
      this.viewer.scene.requestRender()

    } catch (error) {
      console.error('📷 [CameraAnimation] 巡航相机更新错误:', error)
    }
  }





  /**
   * 设置起飞阶段持续时间
   * @param duration 持续时间（秒）
   */
  setTakeoffDuration(duration: number) {
    this.takeoffDuration = duration
    console.log(`📷 [CameraAnimation] 起飞阶段持续时间设置为: ${duration}秒`)
  }

  /**
   * 获取当前动画状态
   */
  isActive(): boolean {
    return this.isAnimating
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stopAnimation()

    // 清理事件监听器
    const canvas = this.viewer.scene.canvas
    if (this.wheelHandler) {
      canvas.removeEventListener('wheel', this.wheelHandler)
      this.wheelHandler = null
    }
    if (this.touchStartHandler) {
      canvas.removeEventListener('touchstart', this.touchStartHandler)
      this.touchStartHandler = null
    }
    if (this.touchMoveHandler) {
      canvas.removeEventListener('touchmove', this.touchMoveHandler)
      this.touchMoveHandler = null
    }

    this.airplane = null
    this.startTime = null
    console.log('📷 [CameraAnimation] 相机动画服务已销毁')
  }
}
