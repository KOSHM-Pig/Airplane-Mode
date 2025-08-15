// 飞机飞行配置文件

export const FLIGHT_CONFIG = {
  // 飞行速度配置（调整为更平滑的动画）
  speed: {
    kmPerHour: 500,        // 飞机巡航速度 500km/h（降低速度让动画更平滑）
    animationFPS: 30       // 动画帧率（降低帧率减少抖动）
  },

  // 当前使用的速度（将根据实际距离动态计算）
  currentSpeed: 0.0001,
  
  // 飞机图标配置
  airplane: {
    size: 32,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 1
  },
  
  // 航线样式配置
  route: {
    strokeColor: '#00BFFF',  // 天蓝色，更明显
    strokeWeight: 3,         // 稍微细一点
    strokeOpacity: 0.8,
    strokeStyle: 'solid'
  },
  
  // 地图视角配置（简化版）
  camera: {
    followPlane: true,       // 是否跟随飞机
    initialZoom: 6,          // 初始缩放级别
    flightZoom: 12,          // 飞行时的缩放级别
    flightAltitude: 200,     // 飞行高度（米）
    transitionDuration: 1200, // 视角过渡时间（毫秒）
    pitch: 30,               // 飞行时的俯仰角度
    rotation: 0,             // 飞行时的旋转角度
    // 平滑跟随配置
    smoothFollow: {
      enabled: true,         // 启用平滑跟随
      factor: 0.3,          // 平滑因子（0-1，越小越平滑）
      updateInterval: 100,   // 相机更新间隔（毫秒）
      transitionTime: 300    // 单次相机移动过渡时间（毫秒）
    }
  }
}

export const REFRESH_TIME = 3000 // 20秒刷新一次

// 航线数据配置
export const FLIGHT_ROUTES = {
  // 西安到北京直飞航线
  'XI_AN_TO_BEIJING': {
    name: '西安 → 北京',
    departure: {
      name: '西安咸阳国际机场',
      code: 'XIY',
      coordinates: [108.940175, 34.341568]
    },
    arrival: {
      name: '北京首都国际机场',
      code: 'PEK',
      coordinates: [116.584556, 40.074366]
    },
    // 直飞路线（只有起点和终点）
    path: [
      [108.940175, 34.341568], // 西安咸阳国际机场
      [116.584556, 40.074366]  // 北京首都国际机场
    ],
    // 距离将通过calculateDistance函数动态计算
    get distance() {
      return calculateDistance(this.departure.coordinates, this.arrival.coordinates)
    },
    // 飞行时间将根据700km/h速度动态计算
    get flightTime() {
      return (this.distance / 700) * 60 // 分钟
    }
  },
  
  // 可以添加更多航线
  'BEIJING_TO_SHANGHAI': {
    name: '北京 → 上海',
    departure: {
      name: '北京首都国际机场',
      code: 'PEK',
      coordinates: [116.584556, 40.074366]
    },
    arrival: {
      name: '上海浦东国际机场',
      code: 'PVG',
      coordinates: [121.805214, 31.142989]
    },
    path: [
      [116.584556, 40.074366], // 北京首都国际机场
      [121.805214, 31.142989]  // 上海浦东国际机场
    ],
    get distance() {
      return calculateDistance(this.departure.coordinates, this.arrival.coordinates)
    },
    get flightTime() {
      return (this.distance / 700) * 60 // 分钟
    }
  },

  'GUANGZHOU_TO_SHENZHEN': {
    name: '广州 → 深圳',
    departure: {
      name: '广州白云国际机场',
      code: 'CAN',
      coordinates: [113.298786, 23.392436]
    },
    arrival: {
      name: '深圳宝安国际机场',
      code: 'SZX',
      coordinates: [113.810833, 22.639444]
    },
    path: [
      [113.298786, 23.392436], // 广州白云国际机场
      [113.810833, 22.639444]  // 深圳宝安国际机场
    ],
    get distance() {
      return calculateDistance(this.departure.coordinates, this.arrival.coordinates)
    },
    get flightTime() {
      return (this.distance / 700) * 60 // 分钟
    }
  }
}

// 默认使用的航线
export const DEFAULT_ROUTE = 'XI_AN_TO_BEIJING'

// 飞机图标SVG模板
export const AIRPLANE_ICON_SVG = `
<svg width="{size}" height="{size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <g fill="{color}" stroke="{strokeColor}" stroke-width="{strokeWidth}">
    <path d="M16 2 L20 14 L30 16 L20 18 L16 30 L12 18 L2 16 L12 14 Z"/>
  </g>
</svg>
`

// 工具函数：计算两点间的中心点
export function calculateCenter(point1, point2) {
  return [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2
  ]
}

// 工具函数：计算两点间的距离（公里）
export function calculateDistance(point1, point2) {
  const R = 6371 // 地球半径（公里）
  const dLat = (point2[1] - point1[1]) * Math.PI / 180
  const dLon = (point2[0] - point1[0]) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 工具函数：计算飞行角度
export function calculateBearing(point1, point2) {
  const dLon = (point2[0] - point1[0]) * Math.PI / 180
  const lat1 = point1[1] * Math.PI / 180
  const lat2 = point2[1] * Math.PI / 180

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  return Math.atan2(y, x) * 180 / Math.PI
}

// 工具函数：根据实际距离和飞行速度计算动画速度
export function calculateAnimationSpeed(distanceKm, speedKmPerHour = 700, fps = 60) {
  // 计算飞行总时间（秒）
  const flightTimeSeconds = (distanceKm / speedKmPerHour) * 3600

  // 计算总帧数
  const totalFrames = flightTimeSeconds * fps

  // 每帧的进度增量（0到1之间）
  const speedPerFrame = 1 / totalFrames

  return {
    speedPerFrame,
    flightTimeSeconds,
    flightTimeMinutes: flightTimeSeconds / 60,
    totalFrames
  }
}

// 工具函数：格式化飞行时间显示
export function formatFlightTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  } else {
    return `${mins}分钟`
  }
}
