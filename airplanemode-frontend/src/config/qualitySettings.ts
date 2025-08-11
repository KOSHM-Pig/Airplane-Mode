// 统一的画质设置配置模块
export interface QualitySetting {
  name: string
  description: string
  resolutionScale: number
  maximumScreenSpaceError: number
  tileCacheSize: number
  fxaa: boolean
  mapLevel: number
  maxRequests: number
  loadingDescendantLimit: number
}

export interface MapSource {
  name: string
  description: string
  type: 'cesium' | 'bing' | 'url'
  assetId?: number
  style?: string
  url?: string
  maximumLevel: number
  subdomains?: string[]
}

// 统一的画质设置配置
export const QUALITY_SETTINGS: QualitySetting[] = [
  {
    name: '省流',
    description: '省流模式 - 最少瓦片请求（弱网络推荐）',
    resolutionScale: 0.3,
    maximumScreenSpaceError: 16.0,
    tileCacheSize: 5,
    fxaa: false,
    mapLevel: 6,
    maxRequests: 1,
    loadingDescendantLimit: 1
  },
  {
    name: '标准',
    description: '标准画质 - 流畅优先（移动端推荐）',
    resolutionScale: 0.4,
    maximumScreenSpaceError: 8.0,
    tileCacheSize: 15,
    fxaa: false,
    mapLevel: 8,
    maxRequests: 2,
    loadingDescendantLimit: 1
  },
  {
    name: '高清',
    description: '高清画质 - 平衡模式',
    resolutionScale: 0.6,
    maximumScreenSpaceError: 4.0,
    tileCacheSize: 25,
    fxaa: false,
    mapLevel: 10,
    maxRequests: 3,
    loadingDescendantLimit: 2
  },
  {
    name: '超清',
    description: '超清画质 - 质量优先（高端设备）',
    resolutionScale: 0.8,
    maximumScreenSpaceError: 2.0,
    tileCacheSize: 40,
    fxaa: false,
    mapLevel: 12,
    maxRequests: 4,
    loadingDescendantLimit: 3
  }
]

// 统一的地图源配置
export const MAP_SOURCES: MapSource[] = [
  {
    name: 'Cesium卫星',
    description: 'Cesium Ion官方卫星影像（推荐）',
    type: 'cesium',
    assetId: 2,
    maximumLevel: 18
  },
  {
    name: 'Cesium地形',
    description: 'Cesium Ion官方地形图',
    type: 'cesium',
    assetId: 3,
    maximumLevel: 16
  },
  {
    name: 'Bing卫星',
    description: 'Bing Maps卫星影像',
    type: 'bing',
    style: 'Aerial',
    maximumLevel: 19
  },
  {
    name: 'Bing道路',
    description: 'Bing Maps道路地图',
    type: 'bing',
    style: 'Road',
    maximumLevel: 19
  },
  {
    name: 'OpenStreetMap',
    description: 'OpenStreetMap开源地图',
    type: 'url',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maximumLevel: 14
  },
  {
    name: '高德卫星',
    description: '高德卫星影像图',
    type: 'url',
    url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    maximumLevel: 14
  }
]

// 获取画质设置的工具函数
export function getQualityByName(name: string): QualitySetting | undefined {
  return QUALITY_SETTINGS.find(q => q.name === name)
}

// 获取地图源的工具函数
export function getMapSourceByName(name: string): MapSource | undefined {
  return MAP_SOURCES.find(s => s.name === name)
}

// 获取默认画质设置
export function getDefaultQuality(isMobile: boolean = false): QualitySetting {
  if (isMobile) {
    return getQualityByName('标准') || QUALITY_SETTINGS[1]
  } else {
    return getQualityByName('高清') || QUALITY_SETTINGS[2]
  }
}

// 获取默认地图源
export function getDefaultMapSource(): MapSource {
  return getMapSourceByName('Cesium卫星') || MAP_SOURCES[0]
}

// 验证画质设置
export function validateQualitySetting(quality: any): quality is QualitySetting {
  return quality && 
         typeof quality.name === 'string' &&
         typeof quality.resolutionScale === 'number' &&
         typeof quality.maximumScreenSpaceError === 'number' &&
         typeof quality.tileCacheSize === 'number' &&
         typeof quality.mapLevel === 'number' &&
         typeof quality.maxRequests === 'number' &&
         typeof quality.loadingDescendantLimit === 'number'
}

// 验证地图源设置
export function validateMapSource(source: any): source is MapSource {
  return source &&
         typeof source.name === 'string' &&
         typeof source.type === 'string' &&
         typeof source.maximumLevel === 'number'
}
