/**
 * WebDAV 云同步工具
 *
 * 自动同步策略：
 * - 本地数据修改时更新 localTime 并上传到云端
 * - 打开小程序时比较 localTime 和云端 localTime，同步较新的一方
 * - 云端文件格式：{ version, localTime, syncTime, data }
 * - 图片文件同步到 /ootd/images/ 目录
 */

import { exportAllData, importData, getLocalTime, setLocalTime, IMAGE_DIR } from '@/utils/storage'

// ============================================================
// 类型定义
// ============================================================

export interface WebdavConfig {
  /** WebDAV 服务器地址（如 https://dav.jianguoyun.com/dav/） */
  url: string
  /** 用户名 */
  username: string
  /** 应用密码（非主密码） */
  password: string
}

interface SyncResult {
  success: boolean
  message: string
  timestamp?: number
}

interface CloudPayload {
  version: number
  /** 本地数据最后修改时间 */
  localTime: number
  /** 上传到云端的时间 */
  syncTime: number
  /** 实际数据 */
  data: { clothes: any[]; outfits: any[]; version?: number; exportTime?: number }
}

// ============================================================
// 常量
// ============================================================

const CONFIG_KEY = 'OOTD_WEBDAV_CONFIG'
const FILE_PATH = '/ootd/wardrobe.json'
const IMAGE_BASE_DIR = '/ootd/images'

/** 同步锁，防止并发 */
let isSyncing = false

// ============================================================
// 配置管理
// ============================================================

/** 获取已保存的 WebDAV 配置 */
export function getConfig(): WebdavConfig | null {
  try {
    const data = wx.getStorageSync(CONFIG_KEY)
    if (data && typeof data === 'object' && data.url) {
      return data as WebdavConfig
    }
    return null
  } catch {
    return null
  }
}

/** 保存 WebDAV 配置 */
export function saveConfig(config: WebdavConfig): void {
  wx.setStorageSync(CONFIG_KEY, config)
}

/** 清除配置 */
export function clearConfig(): void {
  try {
    wx.removeStorageSync(CONFIG_KEY)
  } catch {
    // ignore
  }
}

/** 检查是否已配置 */
export function isConfigured(): boolean {
  return getConfig() !== null
}

// ============================================================
// WebDAV 请求封装
// ============================================================

function buildAuthHeader(config: WebdavConfig): string {
  const token = base64Encode(`${config.username}:${config.password}`)
  return `Basic ${token}`
}

function getBaseUrl(config: WebdavConfig): string {
  let url = config.url
  if (!url.endsWith('/')) url += '/'
  return url
}

function buildUrl(config: WebdavConfig, path: string): string {
  const base = getBaseUrl(config)
  // 移除 path 开头的斜杠，避免重复
  const cleanPath = path.replace(/^\//, '')
  return base + cleanPath
}

function webdavRequest(
  config: WebdavConfig,
  method: string,
  path: string,
  data?: string
): Promise<{ status: number; data: string }> {
  const url = buildUrl(config, path)

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: method as any,
      dataType: 'text',
      responseType: 'text',
      header: {
        'Authorization': buildAuthHeader(config)
      },
      success: (res) => {
        resolve({
          status: res.statusCode,
          data: typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
        })
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// ============================================================
// 图片同步
// ============================================================

/** 上传单个图片到 WebDAV */
async function uploadImage(
  config: WebdavConfig,
  localPath: string,
  imageId: string
): Promise<string | null> {
  try {
    const fs = wx.getFileSystemManager()
    // 读取为 base64
    const base64 = fs.readFileSync(localPath, 'base64')
    const url = buildUrl(config, `${IMAGE_BASE_DIR}/${imageId}.jpg`)

    // base64 → ArrayBuffer（手动解码）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const lookup = new Uint8Array(128)
    for (let i = 0; i < 64; i++) lookup[chars.charCodeAt(i)] = i

    const clean = base64.replace(/\s/g, '')
    const len = clean.length
    const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
    const out = new Uint8Array((len * 3) / 4 - pad)
    let j = 0
    for (let i = 0; i < len; i += 4) {
      const a = lookup[clean.charCodeAt(i)]
      const b = lookup[clean.charCodeAt(i + 1)]
      const c = pad < 2 ? lookup[clean.charCodeAt(i + 2)] : 0
      const d = pad < 1 ? lookup[clean.charCodeAt(i + 3)] : 0
      out[j++] = (a << 2) | (b >> 4)
      if (pad < 2) out[j++] = ((b & 15) << 4) | (c >> 2)
      if (pad < 1) out[j++] = ((c & 3) << 6) | d
    }

    // 创建干净的 ArrayBuffer
    const buf = new ArrayBuffer(out.byteLength)
    new Uint8Array(buf).set(out)

    const res = await new Promise<{ status: number }>((resolve, reject) => {
      wx.request({
        url,
        method: 'PUT',
        dataType: 'text',
        responseType: 'text',
        header: {
          'Authorization': buildAuthHeader(config),
          'Content-Type': 'application/octet-stream'
        },
        data: buf,
        success: (r) => resolve({ status: r.statusCode }),
        fail: (err) => reject(new Error(err.errMsg))
      })
    })

    if (res.status === 200 || res.status === 201 || res.status === 204) {
      return url
    }
    return null
  } catch {
    return null
  }
}

/** 从 WebDAV 下载单个图片到本地 */
async function downloadImage(
  config: WebdavConfig,
  remoteUrl: string,
  imageId: string
): Promise<string | null> {
  try {
    const fs = wx.getFileSystemManager()
    const baseDir = `${wx.env.USER_DATA_PATH}/${IMAGE_DIR}`
    const localPath = `${baseDir}/${imageId}.jpg`

    // 确保目录存在
    try { fs.mkdirSync(baseDir, true) } catch { /* ignore */ }

    // 如果本地已存在，直接返回
    try {
      fs.accessSync(localPath)
      return localPath
    } catch {
      // 不存在，继续下载
    }

    const res = await new Promise<{ status: number; data: ArrayBuffer }>((resolve, reject) => {
      wx.request({
        url: remoteUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        header: {
          'Authorization': buildAuthHeader(config)
        },
        success: (r) => resolve({ status: r.statusCode, data: r.data as ArrayBuffer }),
        fail: (err) => reject(new Error(err.errMsg))
      })
    })

    if (res.status === 200 && res.data) {
      fs.writeFileSync(localPath, res.data)
      return localPath
    }
    return null
  } catch {
    return null
  }
}

/** 上传所有衣物图片到云端，返回更新后的数据（imagePath 替换为 WebDAV URL） */
async function uploadAllImages(
  config: WebdavConfig,
  clothes: any[]
): Promise<any[]> {
  const updated = [...clothes]
  const tasks: Promise<void>[] = []
  const fs = wx.getFileSystemManager()

  for (let i = 0; i < updated.length; i++) {
    const item = updated[i]
    // 只上传非 WebDAV URL 的图片（本地路径可能是 http://usr/... 格式）
    if (!item.imagePath || item.imagePath.includes('dav.jianguoyun.com')) continue

    // 跳过不存在的临时文件（http://tmp/...）
    if (item.imagePath.startsWith('http://tmp/')) {
      updated[i] = { ...item, imagePath: '' }
      continue
    }

    // 检查文件是否存在
    try {
      fs.accessSync(item.imagePath)
    } catch {
      updated[i] = { ...item, imagePath: '' }
      continue
    }

    const imageId = item.id
    tasks.push(
      uploadImage(config, item.imagePath, imageId).then((url) => {
        if (url) {
          updated[i] = { ...item, imagePath: url }
        }
      })
    )
  }

  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
  return updated
}

/** 从云端下载所有图片到本地，返回更新后的数据（WebDAV URL 替换为本地路径） */
async function downloadAllImages(
  config: WebdavConfig,
  clothes: any[]
): Promise<any[]> {
  const updated = [...clothes]
  const tasks: Promise<void>[] = []

  for (let i = 0; i < updated.length; i++) {
    const item = updated[i]
    // 只下载 WebDAV URL 的图片（跳过已是本地路径的）
    if (!item.imagePath || !item.imagePath.includes('dav.jianguoyun.com')) continue

    const imageId = item.id
    tasks.push(
      downloadImage(config, item.imagePath, imageId).then((localPath) => {
        if (localPath) {
          updated[i] = { ...item, imagePath: localPath }
        }
      })
    )
  }

  await Promise.all(tasks)
  return updated
}

// ============================================================
// 同步操作
// ============================================================

/** 测试 WebDAV 连接 */
export async function testConnection(config?: WebdavConfig): Promise<SyncResult> {
  const cfg = config || getConfig()
  if (!cfg) {
    return { success: false, message: '未配置 WebDAV 信息' }
  }

  try {
    const res = await webdavRequest(cfg, 'PROPFIND', '/')
    if (res.status === 200 || res.status === 207) {
      return { success: true, message: '连接成功' }
    }
    if (res.status === 401) {
      return { success: false, message: '用户名或密码错误' }
    }
    return { success: false, message: `连接失败 (${res.status})` }
  } catch (e) {
    return { success: false, message: `连接失败: ${(e as Error).message}` }
  }
}

/** 从云端读取数据 */
async function fetchCloudData(config: WebdavConfig): Promise<CloudPayload | null> {
  try {
    const res = await webdavRequest(config, 'GET', FILE_PATH)
    if (res.status === 200) {
      const remote = JSON.parse(res.data)
      if (remote.data && typeof remote.localTime === 'number') {
        return remote as CloudPayload
      }
    }
    return null
  } catch {
    return null
  }
}

/** 上传数据到云端（含图片） */
async function pushToCloud(config: WebdavConfig, data: any, localTime: number): Promise<SyncResult> {
  try {
    // 先上传图片，替换本地路径为 WebDAV URL
    if (data.clothes && data.clothes.length > 0) {
      console.log(`[WebDAV] Total clothes: ${data.clothes.length}`)
      data.clothes = await uploadAllImages(config, data.clothes)
    }

    const payload: CloudPayload = {
      version: 1,
      localTime,
      syncTime: Date.now(),
      data
    }

    const payloadStr = JSON.stringify(payload)
    const url = buildUrl(config, FILE_PATH)

    const res = await new Promise<{ status: number; data: string }>((resolve, reject) => {
      wx.request({
        url,
        method: 'PUT',
        dataType: 'text',
        responseType: 'text',
        header: {
          'Authorization': buildAuthHeader(config),
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: payloadStr as any,
        success: (r) => {
          resolve({
            status: r.statusCode,
            data: typeof r.data === 'string' ? r.data : JSON.stringify(r.data)
          })
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '请求失败'))
        }
      })
    })

    if (res.status === 200 || res.status === 201 || res.status === 204) {
      return { success: true, message: '上传成功', timestamp: localTime }
    }

    // 409 可能是目录不存在
    if (res.status === 409) {
      return { success: false, message: '云端目录不存在，请先在坚果云中创建 ootd 文件夹' }
    }

    let errMsg = `上传失败 (${res.status})`
    if (res.data && res.data.length < 500) {
      errMsg += `: ${res.data}`
    }
    return { success: false, message: errMsg }
  } catch (e) {
    return { success: false, message: `上传失败: ${(e as Error).message}` }
  }
}

/** 从云端下载并覆盖本地数据（含图片） */
async function pullFromCloud(config: WebdavConfig, cloudData: CloudPayload): Promise<SyncResult> {
  try {
    // 先下载图片，替换 WebDAV URL 为本地路径
    if (cloudData.data.clothes && cloudData.data.clothes.length > 0) {
      cloudData.data.clothes = await downloadAllImages(config, cloudData.data.clothes)
    }

    const jsonStr = JSON.stringify(cloudData.data)
    const result = importData(jsonStr, 'cover')
    if (result.success) {
      // 使用云端的 localTime 更新本地时间戳
      setLocalTime(cloudData.localTime)
      return {
        success: true,
        message: '云端数据已同步到本地',
        timestamp: cloudData.localTime
      }
    }
    return { success: false, message: result.message }
  } catch (e) {
    return { success: false, message: `同步失败: ${(e as Error).message}` }
  }
}

// ============================================================
// 自动同步（核心逻辑）
// ============================================================

/**
 * 自动同步：打开小程序时调用
 * 比较本地时间戳和云端时间戳，同步较新的一方
 */
export async function autoSync(): Promise<SyncResult> {
  if (isSyncing) {
    return { success: true, message: '同步中，请稍候' }
  }

  const config = getConfig()
  if (!config) {
    return { success: true, message: '未配置云同步' }
  }

  isSyncing = true

  try {
    const localTime = getLocalTime()
    const cloudData = await fetchCloudData(config)

    // 云端无数据 → 上传本地
    if (!cloudData) {
      const data = JSON.parse(exportAllData())
      const result = await pushToCloud(config, data, localTime)
      isSyncing = false
      return result.success
        ? { success: true, message: '本地数据已上传到云端' }
        : result
    }

    // 时间戳一致 → 无需同步
    if (cloudData.localTime === localTime) {
      isSyncing = false
      return { success: true, message: '数据已是最新' }
    }

    // 云端更新 → 下载到本地
    if (cloudData.localTime > localTime) {
      const result = await pullFromCloud(config, cloudData)
      isSyncing = false
      return result
    }

    // 本地更新 → 上传到云端
    const data = JSON.parse(exportAllData())
    const result = await pushToCloud(config, data, localTime)
    isSyncing = false
    return result.success
      ? { success: true, message: '本地数据已同步到云端' }
      : result
  } catch (e) {
    isSyncing = false
    return { success: false, message: `同步失败: ${(e as Error).message}` }
  }
}

/**
 * 手动上传到云端
 */
export async function uploadToCloud(): Promise<SyncResult> {
  const config = getConfig()
  if (!config) {
    return { success: false, message: '请先配置 WebDAV 信息' }
  }

  const data = JSON.parse(exportAllData())
  const localTime = getLocalTime()
  return pushToCloud(config, data, localTime)
}

/**
 * 手动从云端下载
 */
export async function downloadFromCloud(): Promise<SyncResult> {
  const config = getConfig()
  if (!config) {
    return { success: false, message: '请先配置 WebDAV 信息' }
  }

  const cloudData = await fetchCloudData(config)
  if (!cloudData) {
    return { success: false, message: '云端暂无数据，请先上传' }
  }

  return pullFromCloud(config, cloudData)
}

// ============================================================
// 工具函数
// ============================================================

function base64Encode(str: string): string {
  // wx 环境下使用 ArrayBuffer 转 base64
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i)
  }
  // 简单的 base64 编码（微信小程序环境）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    result += chars[b1 >> 2]
    result += chars[((b1 & 3) << 4) | (b2 >> 4)]
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '='
    result += i + 2 < bytes.length ? chars[b3 & 63] : '='
  }
  return result
}
