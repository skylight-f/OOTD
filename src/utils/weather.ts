/**
 * 天气服务 - 封装和风天气 API + Mock 数据
 *
 * 使用方式：
 *   import { getWeatherInfo } from '@/utils/weather'
 *   const weather = await getWeatherInfo()
 *
 * 切换到真实 API：
 *   1. 在 dev.qweather.com 注册并获取 Key
 *   2. 将 QWEATHER_KEY 替换为你的 Key
 *   3. USE_MOCK 会自动变为 false
 */

// ============================================================
// 配置
// ============================================================

/** 和风天气 API Key（填入你的 Key 后自动切换到真实数据） */
const QWEATHER_KEY = ''

/** 是否使用 Mock 数据（无 Key 时自动为 true） */
const USE_MOCK = !QWEATHER_KEY

/** 和风天气开发版 API 地址 */
const API_BASE = 'https://devapi.qweather.com/v7'

/** 和风天气 GeoAPI 地址 */
const GEO_BASE = 'https://geoapi.qweather.com/v2'

/** 默认城市（定位失败时的兜底） */
const DEFAULT_CITY = '上海'

// ============================================================
// 类型定义
// ============================================================

export interface WeatherInfo {
  /** 城市名 */
  city: string
  /** 天气概要（如"多云转小雨，体感偏凉"） */
  summary: string
  /** 当前温度 */
  temperature: number
  /** 今日最低温 */
  low: number
  /** 今日最高温 */
  high: number
  /** 天气标签（如"通勤日"、"适合叠穿"） */
  tags: string[]
  /** 天气状况文本（晴/多云/阴/小雨等） */
  condition: string
  /** 体感温度 */
  feelsLike: number
  /** 湿度百分比 */
  humidity: number
  /** 风向 */
  windDir: string
  /** 风力等级 */
  windScale: string
}

export interface ClothingRecommendation {
  title: string
  description: string
  scene: string
  items: Array<{
    name: string
    role: string
    reason: string
  }>
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_CONDITIONS = [
  { condition: '晴', summary: '晴空万里，适合外出', temperature: 28, low: 22, high: 32, tags: ['晴天', '注意防晒', '适合户外'], feelsLike: 30, humidity: 45 },
  { condition: '多云', summary: '多云间晴，温度适宜', temperature: 23, low: 18, high: 27, tags: ['通勤日', '适合叠穿'], feelsLike: 22, humidity: 55 },
  { condition: '小雨', summary: '小雨绵绵，记得带伞', temperature: 16, low: 13, high: 19, tags: ['记得带伞', '适合叠穿', '注意保暖'], feelsLike: 14, humidity: 82 },
  { condition: '阴', summary: '阴天微凉，适合穿搭', temperature: 19, low: 15, high: 22, tags: ['通勤日', '适合叠穿'], feelsLike: 18, humidity: 65 },
  { condition: '大雨', summary: '大雨倾盆，注意出行安全', temperature: 14, low: 11, high: 17, tags: ['记得带伞', '注意防滑', '减少外出'], feelsLike: 12, humidity: 90 },
  { condition: '雷阵雨', summary: '午后雷阵雨，注意防范', temperature: 26, low: 21, high: 30, tags: ['午后有雨', '注意防雷', '适合叠穿'], feelsLike: 28, humidity: 70 },
  { condition: '雪', summary: '雪花纷飞，注意保暖', temperature: 2, low: -2, high: 5, tags: ['注意保暖', '注意防滑', '减少外出'], feelsLike: -1, humidity: 60 },
  { condition: '雾', summary: '大雾弥漫，能见度低', temperature: 18, low: 14, high: 21, tags: ['注意行车安全', '适合叠穿'], feelsLike: 17, humidity: 95 },
]

/** 生成随机 Mock 天气数据 */
function generateMockWeather(): WeatherInfo {
  const idx = Math.floor(Math.random() * MOCK_CONDITIONS.length)
  const mock = MOCK_CONDITIONS[idx]
  const day = new Date().getDay()
  const dayTag = day >= 1 && day <= 5 ? '通勤日' : '周末'

  return {
    city: DEFAULT_CITY,
    summary: mock.summary,
    temperature: mock.temperature + Math.floor(Math.random() * 5 - 2),
    low: mock.low,
    high: mock.high,
    tags: [dayTag, ...mock.tags.slice(0, 2)],
    condition: mock.condition,
    feelsLike: mock.feelsLike,
    humidity: mock.humidity,
    windDir: ['东风', '南风', '西风', '北风', '东南风'][Math.floor(Math.random() * 5)],
    windScale: String(Math.floor(Math.random() * 4) + 1)
  }
}

// ============================================================
// 和风天气 API 调用
// ============================================================

/** 通过经纬度反查城市信息 */
async function fetchCityByLocation(
  longitude: number,
  latitude: number
): Promise<{ id: string; name: string }> {
  const url = `${GEO_BASE}/geo/v2/city/lookup?location=${longitude},${latitude}&key=${QWEATHER_KEY}&number=1`
  const res = await new Promise<wx.RequestSuccessCallbackResult>((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      success: (r) => resolve(r),
      fail: reject
    })
  })

  const data = res.data as { code: string; location?: Array<{ id: string; name: string }> }
  if (data.code === '200' && data.location && data.location.length > 0) {
    const loc = data.location[0]
    return { id: loc.id, name: loc.name }
  }

  return { id: '101020100', name: DEFAULT_CITY }
}

/** 获取实时天气数据 */
async function fetchRealWeather(
  longitude: number,
  latitude: number
): Promise<WeatherInfo> {
  // 1. 先查城市
  const city = await fetchCityByLocation(longitude, latitude)
  const location = `${longitude},${latitude}`

  // 2. 并行请求实时天气 + 今日预报
  const [nowRes, dayRes] = await Promise.all([
    new Promise<wx.RequestSuccessCallbackResult>((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/weather/now?location=${location}&key=${QWEATHER_KEY}`,
        method: 'GET',
        success: (r) => resolve(r),
        fail: reject
      })
    }),
    new Promise<wx.RequestSuccessCallbackResult>((resolve, reject) => {
      wx.request({
        url: `${API_BASE}/weather/3d?location=${location}&key=${QWEATHER_KEY}`,
        method: 'GET',
        success: (r) => resolve(r),
        fail: reject
      })
    })
  ])

  const nowData = nowRes.data as { code: string; now?: { text: string; temp: string; feelsLike: string; humidity: string; windDir: string; windScale: string } }
  const dayData = dayRes.data as { code: string; daily?: Array<{ tempMin: string; tempMax: string }> }

  if (nowData.code !== '200' || dayData.code !== '200') {
    throw new Error(`和风天气 API 错误: now=${nowData.code}, 3d=${dayData.code}`)
  }

  const now = nowData.now!
  const today = dayData.daily![0]

  return {
    city: city.name,
    summary: buildSummary(now.text, Number(now.temp), Number(now.feelsLike), Number(now.humidity)),
    temperature: Math.round(Number(now.temp)),
    low: Math.round(Number(today.tempMin)),
    high: Math.round(Number(today.tempMax)),
    tags: buildTags(now.text, Number(now.temp), Number(today.tempMin), Number(today.tempMax)),
    condition: now.text,
    feelsLike: Math.round(Number(now.feelsLike)),
    humidity: Number(now.humidity),
    windDir: now.windDir,
    windScale: now.windScale
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 根据天气数据生成概要描述 */
function buildSummary(
  condition: string,
  temp: number,
  feelsLike: number,
  humidity: number
): string {
  const feelDiff = Math.abs(temp - feelsLike)
  let feelText = ''
  if (feelDiff >= 3) {
    feelText = feelsLike < temp ? '，体感偏凉' : '，体感偏暖'
  }

  let humidityText = ''
  if (humidity > 80) {
    humidityText = '，湿度较高'
  } else if (humidity < 40) {
    humidityText = '，空气偏干'
  }

  return `${condition}${feelText}${humidityText}`
}

/** 根据天气生成标签 */
function buildTags(
  condition: string,
  temp: number,
  low: number,
  high: number
): string[] {
  const tags: string[] = []
  const now = new Date()
  const day = now.getDay()

  // 工作日/周末
  if (day >= 1 && day <= 5) {
    tags.push('通勤日')
  } else {
    tags.push('周末')
  }

  // 天气相关
  if (condition.includes('雨')) tags.push('记得带伞')
  if (condition.includes('雪')) tags.push('注意防滑')
  if (condition.includes('晴') && temp > 26) tags.push('注意防晒')

  // 温差
  const tempRange = high - low
  if (tempRange >= 8) {
    tags.push('温差大')
  } else if (tempRange >= 5) {
    tags.push('适合叠穿')
  }

  // 温度
  if (temp < 10) tags.push('注意保暖')
  if (temp >= 28) tags.push('轻薄透气')

  return tags.slice(0, 3)
}

// ============================================================
// 对外接口
// ============================================================

/**
 * 获取天气信息（主入口）
 * 自动判断使用 Mock 或真实 API
 */
export async function getWeatherInfo(
  longitude?: number,
  latitude?: number
): Promise<WeatherInfo> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300))
    return generateMockWeather()
  }

  if (!longitude || !latitude) {
    throw new Error('使用真实 API 时需要提供经纬度')
  }

  return fetchRealWeather(longitude, latitude)
}

/** 查询当前是否为 Mock 模式 */
export function isMockMode(): boolean {
  return USE_MOCK
}

/** 获取默认城市名 */
export function getDefaultCity(): string {
  return DEFAULT_CITY
}
