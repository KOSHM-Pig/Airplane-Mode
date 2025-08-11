// 机场数据接口
export interface Airport {
  id: string
  code: string // IATA代码，用于显示
  name: string
  city: string
  country: string
  iataCode: string
  icaoCode: string
  longitude: number
  latitude: number
  elevation: number // 海拔高度（米）
  timezone: string
  description: string
}

// 全球主要机场数据（20个）
export const airports: Airport[] = [
  // 中国
  {
    id: 'PEK',
    code: 'PEK',
    name: '北京首都国际机场',
    city: '北京',
    country: '中国',
    iataCode: 'PEK',
    icaoCode: 'ZBAA',
    longitude: 116.5974,
    latitude: 40.0801,
    elevation: 35,
    timezone: 'Asia/Shanghai',
    description: '中国最繁忙的国际机场之一'
  },
  {
    id: 'PVG',
    code: 'PVG',
    name: '上海浦东国际机场',
    city: '上海',
    country: '中国',
    iataCode: 'PVG',
    icaoCode: 'ZSPD',
    longitude: 121.8057,
    latitude: 31.1443,
    elevation: 4,
    timezone: 'Asia/Shanghai',
    description: '上海主要国际机场'
  },
  {
    id: 'XIY',
    code: 'XIY',
    name: '西安咸阳国际机场',
    city: '西安',
    country: '中国',
    iataCode: 'XIY',
    icaoCode: 'ZLXY',
    longitude: 108.7539,
    latitude: 34.4471,
    elevation: 479,
    timezone: 'Asia/Shanghai',
    description: '西北地区重要航空枢纽'
  },
  {
    id: 'CAN',
    code: 'CAN',
    name: '广州白云国际机场',
    city: '广州',
    country: '中国',
    iataCode: 'CAN',
    icaoCode: 'ZGGG',
    longitude: 113.2990,
    latitude: 23.3924,
    elevation: 11,
    timezone: 'Asia/Shanghai',
    description: '华南地区最大的航空枢纽'
  },
  {
    id: 'SZX',
    code: 'SZX',
    name: '深圳宝安国际机场',
    city: '深圳',
    country: '中国',
    iataCode: 'SZX',
    icaoCode: 'ZGSZ',
    longitude: 113.8111,
    latitude: 22.6393,
    elevation: 4,
    timezone: 'Asia/Shanghai',
    description: '华南地区重要的国际机场'
  },
  {
    id: 'CTU',
    code: 'CTU',
    name: '成都双流国际机场',
    city: '成都',
    country: '中国',
    iataCode: 'CTU',
    icaoCode: 'ZUUU',
    longitude: 103.9470,
    latitude: 30.5785,
    elevation: 495,
    timezone: 'Asia/Shanghai',
    description: '西南地区最大的航空枢纽'
  },
  {
    id: 'NKG',
    code: 'NKG',
    name: '南京禄口国际机场',
    city: '南京',
    country: '中国',
    iataCode: 'NKG',
    icaoCode: 'ZSNJ',
    longitude: 118.8620,
    latitude: 31.7420,
    elevation: 15,
    timezone: 'Asia/Shanghai',
    description: '江苏省主要国际机场'
  },
  {
    id: 'HGH',
    code: 'HGH',
    name: '杭州萧山国际机场',
    city: '杭州',
    country: '中国',
    iataCode: 'HGH',
    icaoCode: 'ZSHC',
    longitude: 120.4340,
    latitude: 30.2295,
    elevation: 7,
    timezone: 'Asia/Shanghai',
    description: '浙江省主要国际机场'
  },
  {
    id: 'WUH',
    code: 'WUH',
    name: '武汉天河国际机场',
    city: '武汉',
    country: '中国',
    iataCode: 'WUH',
    icaoCode: 'ZHHH',
    longitude: 114.2081,
    latitude: 30.7838,
    elevation: 113,
    timezone: 'Asia/Shanghai',
    description: '华中地区重要航空枢纽'
  },
  {
    id: 'CSX',
    code: 'CSX',
    name: '长沙黄花国际机场',
    city: '长沙',
    country: '中国',
    iataCode: 'CSX',
    icaoCode: 'ZGHA',
    longitude: 113.2197,
    latitude: 28.1892,
    elevation: 68,
    timezone: 'Asia/Shanghai',
    description: '湖南省主要国际机场'
  },
  {
    id: 'SJW',
    code: 'SJW',
    name: '石家庄正定国际机场',
    city: '石家庄',
    country: '中国',
    iataCode: 'SJW',
    icaoCode: 'ZBSJ',
    longitude: 114.6970,
    latitude: 38.2807,
    elevation: 233,
    timezone: 'Asia/Shanghai',
    description: '河北省主要国际机场'
  },
  {
    id: 'TNA',
    code: 'TNA',
    name: '济南遥墙国际机场',
    city: '济南',
    country: '中国',
    iataCode: 'TNA',
    icaoCode: 'ZSJN',
    longitude: 117.2159,
    latitude: 36.8570,
    elevation: 22,
    timezone: 'Asia/Shanghai',
    description: '山东省主要国际机场'
  },

  // 日本
  {
    id: 'NRT',
    code: 'NRT',
    name: '东京成田国际机场',
    city: '东京',
    country: '日本',
    iataCode: 'NRT',
    icaoCode: 'RJAA',
    longitude: 140.3929,
    latitude: 35.7647,
    elevation: 43,
    timezone: 'Asia/Tokyo',
    description: '东京主要国际机场'
  },
  {
    id: 'KIX',
    code: 'KIX',
    name: '大阪关西国际机场',
    city: '大阪',
    country: '日本',
    iataCode: 'KIX',
    icaoCode: 'RJBB',
    longitude: 135.2441,
    latitude: 34.4347,
    elevation: 5,
    timezone: 'Asia/Tokyo',
    description: '建在人工岛上的国际机场'
  },
  
  // 欧洲
  {
    id: 'CDG',
    code: 'CDG',
    name: '巴黎戴高乐机场',
    city: '巴黎',
    country: '法国',
    iataCode: 'CDG',
    icaoCode: 'LFPG',
    longitude: 2.5479,
    latitude: 49.0097,
    elevation: 119,
    timezone: 'Europe/Paris',
    description: '欧洲最繁忙的机场之一'
  },
  {
    id: 'LHR',
    code: 'LHR',
    name: '伦敦希思罗机场',
    city: '伦敦',
    country: '英国',
    iataCode: 'LHR',
    icaoCode: 'EGLL',
    longitude: -0.4543,
    latitude: 51.4700,
    elevation: 25,
    timezone: 'Europe/London',
    description: '世界最繁忙的国际机场之一'
  },
  {
    id: 'FRA',
    code: 'FRA',
    name: '法兰克福机场',
    city: '法兰克福',
    country: '德国',
    iataCode: 'FRA',
    icaoCode: 'EDDF',
    longitude: 8.5622,
    latitude: 50.0379,
    elevation: 111,
    timezone: 'Europe/Berlin',
    description: '欧洲重要的航空枢纽'
  },
  {
    id: 'AMS',
    code: 'AMS',
    name: '阿姆斯特丹史基浦机场',
    city: '阿姆斯特丹',
    country: '荷兰',
    iataCode: 'AMS',
    icaoCode: 'EHAM',
    longitude: 4.7683,
    latitude: 52.3105,
    elevation: -3,
    timezone: 'Europe/Amsterdam',
    description: '荷兰主要国际机场'
  },
  
  // 美洲
  {
    id: 'JFK',
    code: 'JFK',
    name: '纽约肯尼迪国际机场',
    city: '纽约',
    country: '美国',
    iataCode: 'JFK',
    icaoCode: 'KJFK',
    longitude: -73.7781,
    latitude: 40.6413,
    elevation: 4,
    timezone: 'America/New_York',
    description: '纽约主要国际机场'
  },
  {
    id: 'LAX',
    code: 'LAX',
    name: '洛杉矶国际机场',
    city: '洛杉矶',
    country: '美国',
    iataCode: 'LAX',
    icaoCode: 'KLAX',
    longitude: -118.4085,
    latitude: 33.9425,
    elevation: 38,
    timezone: 'America/Los_Angeles',
    description: '美国西海岸最大的机场'
  },
  {
    id: 'YYZ',
    code: 'YYZ',
    name: '多伦多皮尔逊国际机场',
    city: '多伦多',
    country: '加拿大',
    iataCode: 'YYZ',
    icaoCode: 'CYYZ',
    longitude: -79.6248,
    latitude: 43.6777,
    elevation: 173,
    timezone: 'America/Toronto',
    description: '加拿大最繁忙的机场'
  },

  // 亚洲其他
  {
    id: 'SIN',
    code: 'SIN',
    name: '新加坡樟宜机场',
    city: '新加坡',
    country: '新加坡',
    iataCode: 'SIN',
    icaoCode: 'WSSS',
    longitude: 103.9915,
    latitude: 1.3644,
    elevation: 22,
    timezone: 'Asia/Singapore',
    description: '世界最佳机场之一'
  },
  {
    id: 'ICN',
    code: 'ICN',
    name: '首尔仁川国际机场',
    city: '首尔',
    country: '韩国',
    iataCode: 'ICN',
    icaoCode: 'RKSI',
    longitude: 126.4407,
    latitude: 37.4602,
    elevation: 7,
    timezone: 'Asia/Seoul',
    description: '韩国主要国际机场'
  },
  {
    id: 'BKK',
    code: 'BKK',
    name: '曼谷素万那普机场',
    city: '曼谷',
    country: '泰国',
    iataCode: 'BKK',
    icaoCode: 'VTBS',
    longitude: 100.7501,
    latitude: 13.6900,
    elevation: 2,
    timezone: 'Asia/Bangkok',
    description: '东南亚重要航空枢纽'
  },

  // 中东
  {
    id: 'DXB',
    code: 'DXB',
    name: '迪拜国际机场',
    city: '迪拜',
    country: '阿联酋',
    iataCode: 'DXB',
    icaoCode: 'OMDB',
    longitude: 55.3644,
    latitude: 25.2532,
    elevation: 19,
    timezone: 'Asia/Dubai',
    description: '中东最繁忙的国际机场'
  },

  // 澳洲
  {
    id: 'SYD',
    code: 'SYD',
    name: '悉尼金斯福德·史密斯机场',
    city: '悉尼',
    country: '澳大利亚',
    iataCode: 'SYD',
    icaoCode: 'YSSY',
    longitude: 151.1772,
    latitude: -33.9399,
    elevation: 21,
    timezone: 'Australia/Sydney',
    description: '澳大利亚最繁忙的机场'
  },

  // 非洲
  {
    id: 'CAI',
    code: 'CAI',
    name: '开罗国际机场',
    city: '开罗',
    country: '埃及',
    iataCode: 'CAI',
    icaoCode: 'HECA',
    longitude: 31.4056,
    latitude: 30.1219,
    elevation: 74,
    timezone: 'Africa/Cairo',
    description: '非洲重要的航空枢纽'
  },

  // 南美
  {
    id: 'GRU',
    code: 'GRU',
    name: '圣保罗瓜鲁柳斯国际机场',
    city: '圣保罗',
    country: '巴西',
    iataCode: 'GRU',
    icaoCode: 'SBGR',
    longitude: -46.4730,
    latitude: -23.4356,
    elevation: 750,
    timezone: 'America/Sao_Paulo',
    description: '南美洲最繁忙的机场'
  }
]

// 为所有机场添加code属性（临时修复）
airports.forEach(airport => {
  if (!airport.code) {
    (airport as any).code = airport.iataCode
  }
})

// 获取所有机场
export const getAllAirports = (): Airport[] => {
  return airports
}

// 根据ID查找机场
export const getAirportById = (id: string): Airport | undefined => {
  return airports.find(airport => airport.id === id)
}

// 根据IATA代码查找机场
export const getAirportByIATA = (iataCode: string): Airport | undefined => {
  return airports.find(airport => airport.iataCode === iataCode)
}

// 计算两个机场之间的距离（公里）
export const calculateDistance = (airport1: Airport, airport2: Airport): number => {
  const R = 6371 // 地球半径（公里）
  const dLat = (airport2.latitude - airport1.latitude) * Math.PI / 180
  const dLon = (airport2.longitude - airport1.longitude) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(airport1.latitude * Math.PI / 180) * Math.cos(airport2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 计算两个坐标之间的距离（公里）
export const calculateDistanceByCoords = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 估算飞行时间（小时）
export const estimateFlightTime = (distance: number): number => {
  const averageSpeed = 600 // 平均巡航速度 600km/h
  return distance / averageSpeed
}
