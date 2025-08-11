import { reactive, ref } from 'vue'
import {
    MAP_SOURCES,
    QUALITY_SETTINGS,
    getDefaultMapSource,
    getDefaultQuality,
    type MapSource,
    type QualitySetting
} from '../config/qualitySettings'

// 设置控制器
export function useSettingsController() {
  // 状态管理
  const defaultQuality = getDefaultQuality()
  const defaultMapSource = getDefaultMapSource()

  const currentQuality = ref(defaultQuality.name)
  const currentMapSource = ref(defaultMapSource.name)
  const resolutionScale = ref(defaultQuality.resolutionScale)

  // 使用统一的配置
  const qualitySettings = reactive<QualitySetting[]>(QUALITY_SETTINGS)
  const mapSources = reactive<MapSource[]>(MAP_SOURCES)

  // 获取当前画质设置
  const getCurrentQuality = (): QualitySetting | undefined => {
    return qualitySettings.find(q => q.name === currentQuality.value)
  }

  // 获取当前地图源
  const getCurrentMapSource = (): MapSource | undefined => {
    return mapSources.find(s => s.name === currentMapSource.value)
  }

  // 设置画质
  const setQuality = (quality: QualitySetting): boolean => {
    try {
      currentQuality.value = quality.name
      resolutionScale.value = quality.resolutionScale

      console.log(`🎨 [SettingsController] 画质已切换到: ${quality.name}`)
      console.log(`📊 [SettingsController] 分辨率缩放: ${quality.resolutionScale}`)

      return true
    } catch (error) {
      console.error('❌ [SettingsController] 画质设置失败:', error)
      return false
    }
  }

  // 设置地图源
  const setMapSource = (source: MapSource): boolean => {
    try {
      currentMapSource.value = source.name
      
      console.log(`🗺️ [SettingsController] 地图源已切换到: ${source.name}`)
      console.log(`🔗 [SettingsController] 提供商: ${source.provider}`)
      
      return true
    } catch (error) {
      console.error('❌ [SettingsController] 地图源设置失败:', error)
      return false
    }
  }

  // 重置设置
  const resetSettings = (): void => {
    const defaultQuality = getDefaultQuality()
    const defaultMapSource = getDefaultMapSource()

    currentQuality.value = defaultQuality.name
    currentMapSource.value = defaultMapSource.name
    resolutionScale.value = defaultQuality.resolutionScale

    console.log('🔄 [SettingsController] 设置已重置')
  }

  // 获取设置摘要
  const getSettingsSummary = () => {
    return {
      quality: getCurrentQuality(),
      mapSource: getCurrentMapSource(),
      resolutionScale: resolutionScale.value
    }
  }

  // 验证设置
  const validateSettings = (): boolean => {
    const quality = getCurrentQuality()
    const mapSource = getCurrentMapSource()
    
    if (!quality) {
      console.warn('⚠️ [SettingsController] 无效的画质设置')
      return false
    }
    
    if (!mapSource) {
      console.warn('⚠️ [SettingsController] 无效的地图源设置')
      return false
    }
    
    return true
  }

  // 导出设置
  const exportSettings = () => {
    return {
      quality: currentQuality.value,
      mapSource: currentMapSource.value,
      resolutionScale: resolutionScale.value,
      timestamp: new Date().toISOString()
    }
  }

  // 导入设置
  const importSettings = (settings: any): boolean => {
    try {
      if (settings.quality) {
        const quality = qualitySettings.find(q => q.name === settings.quality)
        if (quality) setQuality(quality)
      }
      
      if (settings.mapSource) {
        const mapSource = mapSources.find(s => s.name === settings.mapSource)
        if (mapSource) setMapSource(mapSource)
      }
      
      console.log('📥 [SettingsController] 设置导入成功')
      return true
    } catch (error) {
      console.error('❌ [SettingsController] 设置导入失败:', error)
      return false
    }
  }

  return {
    // 状态
    currentQuality,
    currentMapSource,
    resolutionScale,
    qualitySettings,
    mapSources,
    
    // 方法
    getCurrentQuality,
    getCurrentMapSource,
    setQuality,
    setMapSource,
    resetSettings,
    getSettingsSummary,
    validateSettings,
    exportSettings,
    importSettings
  }
}

// 单例模式，确保全局唯一
let settingsControllerInstance: ReturnType<typeof useSettingsController> | null = null

export function getSettingsController() {
  if (!settingsControllerInstance) {
    settingsControllerInstance = useSettingsController()
  }
  return settingsControllerInstance
}
