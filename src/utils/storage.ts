/**
 * 衣物数据存储服务
 *
 * 使用微信小程序本地存储（wx.getStorageSync / wx.setStorageSync）
 * 存储 key 统一使用 'OOTD_CLOTHES'
 */

// ============================================================
// 类型定义
// ============================================================

/** 衣物数据类型 */
export interface ClothingItem {
  /** 唯一 ID（时间戳 + 随机数） */
  id: string
  /** 衣物名称 */
  name: string
  /** 类别：上装/下装/外套/鞋履/配饰/包袋 */
  category: string
  /** 颜色描述 */
  color: string
  /** 材质 */
  material: string
  /** 适合场景（如"通勤 / 周末"） */
  scene: string
  /** 适合季节（如"春夏"、"秋冬"、"四季"） */
  season: string
  /** 本地图片路径（wx 临时路径或本地存储路径） */
  imagePath: string
  /** 色调标识（用于 UI 渲染，如 oat/blue/cream/black/green/brown） */
  tone: string
  /** 品牌（可选） */
  brand: string
  /** 尺码（可选） */
  size: string
  /** 价格（可选） */
  price: string
  /** 是否收藏（可选，默认 false） */
  favorite?: boolean
  /** 图标（UI 展示用，非持久化字段） */
  icon?: string
  /** 创建时间戳 */
  createdAt: number
  /** 穿着次数 */
  wearCount: number
  /** 最后穿着时间戳 */
  lastWornAt: number
}

/** 统计数据类型 */
export interface ClothingStats {
  /** 总单品数 */
  total: number
  /** 春夏可穿数量 */
  seasonCount: number
  /** 一周内穿过数量 */
  weekWorn: number
}

/** 添加衣物时的输入类型（自动填充 id/createdAt/wearCount/lastWornAt） */
export type ClothingInput = Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount' | 'lastWornAt'>

// ============================================================
// 常量
// ============================================================

/** 存储 key */
const STORAGE_KEY = 'OOTD_CLOTHES'

/** 同步时间戳 key */
const SYNC_TIME_KEY = 'OOTD_SYNC_TIME'

/** 图片持久化目录名 */
export const IMAGE_DIR = 'clothes_images'

// ============================================================
// 时间戳管理
// ============================================================

/** 获取本地数据最后修改时间 */
export function getLocalTime(): number {
  try {
    return wx.getStorageSync(SYNC_TIME_KEY) || 0
  } catch {
    return 0
  }
}

/** 设置本地数据修改时间 */
export function setLocalTime(time: number): void {
  wx.setStorageSync(SYNC_TIME_KEY, time)
}

/** 标记本地数据已修改 */
export function markDirty(): void {
  setLocalTime(Date.now())
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成唯一 ID（时间戳 + 随机数）
 * @returns 格式如 "1718234567890_a3f8b2"
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}_${random}`
}

/**
 * 从本地存储中读取衣物列表
 * @returns 衣物数组，无数据时返回空数组
 */
function readClothesList(): ClothingItem[] {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    if (Array.isArray(data)) {
      return data
    }
    return []
  } catch (e) {
    return []
  }
}

/**
 * 将衣物列表写入本地存储
 * @param list 衣物数组
 */
function writeClothesList(list: ClothingItem[]): void {
  wx.setStorageSync(STORAGE_KEY, list)
  markDirty()
}

// ============================================================
// CRUD 操作
// ============================================================

/**
 * 获取所有衣物
 * @returns 所有衣物列表
 */
export function getAllClothes(): ClothingItem[] {
  return readClothesList()
}

/**
 * 根据 ID 获取单件衣物
 * @param id 衣物 ID
 * @returns 匹配的衣物或 undefined
 */
export function getClothingById(id: string): ClothingItem | undefined {
  const list = readClothesList()
  return list.find((item) => item.id === id) || undefined
}

/**
 * 添加衣物，自动填充 id / createdAt / wearCount / lastWornAt
 * @param input 衣物输入数据（不含自动字段）
 * @returns 新创建的完整衣物对象
 */
export function addClothing(input: ClothingInput): ClothingItem {
  const now = Date.now()
  const newItem: ClothingItem = {
    id: generateId(),
    name: input.name,
    category: input.category,
    color: input.color,
    material: input.material,
    scene: input.scene,
    season: input.season,
    imagePath: input.imagePath,
    tone: input.tone,
    brand: input.brand,
    size: input.size,
    price: input.price,
    favorite: input.favorite ?? false,
    createdAt: now,
    wearCount: 0,
    lastWornAt: 0
  }

  const list = readClothesList()
  list.push(newItem)
  writeClothesList(list)

  return newItem
}

/**
 * 更新衣物
 * @param id 衣物 ID
 * @param updates 需要更新的字段（Partial）
 * @returns 更新后的衣物对象，未找到返回 undefined
 */
export function updateClothing(
  id: string,
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
): ClothingItem | undefined {
  const list = readClothesList()
  const index = list.findIndex((item) => item.id === id)

  if (index === -1) {
    return undefined
  }

  const updated: ClothingItem = {
    ...list[index],
    ...updates,
    id: list[index].id,
    createdAt: list[index].createdAt
  }
  list[index] = updated
  writeClothesList(list)

  return updated
}

/**
 * 删除衣物
 * @param id 衣物 ID
 * @returns 是否成功删除
 */
export function deleteClothing(id: string): boolean {
  const list = readClothesList()
  const filtered = list.filter((item) => item.id !== id)

  if (filtered.length === list.length) {
    return false
  }

  writeClothesList(filtered)
  return true
}

/**
 * 切换衣物收藏状态
 * @param id 衣物 ID
 * @returns 切换后的衣物对象，未找到返回 undefined
 */
export function toggleFavorite(id: string): ClothingItem | undefined {
  const list = readClothesList()
  const index = list.findIndex((item) => item.id === id)

  if (index === -1) {
    return undefined
  }

  list[index] = {
    ...list[index],
    favorite: !list[index].favorite
  }
  writeClothesList(list)

  return list[index]
}

// ============================================================
// 查询与统计
// ============================================================

/**
 * 获取统计数据
 * @returns { total, seasonCount, weekWorn }
 */
export function getClothingStats(): ClothingStats {
  const list = readClothesList()
  const now = Date.now()
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000

  const total = list.length

  // 春夏可穿：season 包含"春夏"或"四季"
  const seasonCount = list.filter(
    (item) => item.season.includes('春夏') || item.season.includes('四季')
  ).length

  // 一周常穿：lastWornAt 在最近 7 天内
  const weekWorn = list.filter(
    (item) => item.lastWornAt > 0 && (now - item.lastWornAt) < oneWeekMs
  ).length

  return { total, seasonCount, weekWorn }
}

/**
 * 按类别筛选衣物
 * @param category 类别名（如"上装"）
 * @returns 匹配的衣物列表
 */
export function getClothesByCategory(category: string): ClothingItem[] {
  const list = readClothesList()
  return list.filter((item) => item.category === category)
}

/**
 * 按场景筛选衣物
 * @param scene 场景关键词
 * @returns 场景字段中包含该关键词的衣物列表
 */
export function getClothesByScene(scene: string): ClothingItem[] {
  const list = readClothesList()
  return list.filter((item) => item.scene.includes(scene))
}

// ============================================================
// 图片管理
// ============================================================

/**
 * 将临时图片保存到本地持久目录
 */
export function saveImageToTemp(tempFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    const baseDir = `${wx.env.USER_DATA_PATH}/${IMAGE_DIR}`
    const fileName = `${generateId()}.jpg`
    const savePath = `${baseDir}/${fileName}`
    fs.mkdir({
      dirPath: baseDir, recursive: true,
      success: () => doSave(), fail: () => doSave()
    })
    function doSave(): void {
      fs.saveFile({
        tempFilePath, filePath: savePath,
        success: (res) => resolve(res.savedFilePath),
        fail: (err) => reject(new Error(`保存图片失败: ${JSON.stringify(err)}`))
      })
    }
  })
}

// ============================================================
// 穿着记录与辅助
// ============================================================

export function recordWear(id: string): boolean {
  const item = getClothingById(id)
  if (!item) return false
  updateClothing(id, { wearCount: item.wearCount + 1, lastWornAt: Date.now() })
  return true
}

export function inferTone(color: string): string {
  if (!color) return 'oat'
  const c = color.toLowerCase()
  if (c.includes('蓝')) return 'blue'
  if (c.includes('黑') || c.includes('曜')) return 'black'
  if (c.includes('绿') || c.includes('草') || c.includes('橄榄')) return 'green'
  if (c.includes('棕') || c.includes('焦') || c.includes('驼') || c.includes('咖')) return 'brown'
  if (c.includes('红')) return 'red'
  if (c.includes('粉') || c.includes('桃')) return 'pink'
  if (c.includes('灰')) return 'gray'
  if (c.includes('奶') || c.includes('杏') || c.includes('米') || c.includes('燕麦')) return 'cream'
  if (c.includes('白')) return 'white'
  return 'oat'
}

export function categoryToIcon(category: string): string {
  const map: Record<string, string> = {
    '上装': 'TOP', '下装': 'BOTTOM', '外套': 'COAT',
    '鞋履': 'SHOE', '配饰': 'ACC', '包袋': 'BAG',
    '连衣裙': 'DRESS', '半裙': 'SKIRT'
  }
  return map[category] || 'ITEM'
}

export const CATEGORY_OPTIONS = ['上装', '下装', '外套', '鞋履', '配饰', '包袋', '连衣裙', '半裙']
export const SEASON_OPTIONS = ['春秋', '冬季', '夏季', '四季']
export const SCENE_OPTIONS = ['通勤', '周末', '约会', '运动', '正式', '休闲', '旅行', '居家']

// ============================================================
// 搭配记录
// ============================================================

const OUTFIT_KEY = 'OOTD_OUTFITS'

export interface OutfitItem {
  id: string
  name: string
  scene: string
  description: string
  clothingIds: string[]
  tone: string
  createdAt: number
  wearCount: number
  lastWornAt: number
}

export type OutfitInput = Omit<OutfitItem, 'id' | 'createdAt' | 'wearCount' | 'lastWornAt'>

function readOutfitList(): OutfitItem[] {
  try { const data = wx.getStorageSync(OUTFIT_KEY); return Array.isArray(data) ? data : [] }
  catch { return [] }
}

function writeOutfitList(list: OutfitItem[]): void {
  wx.setStorageSync(OUTFIT_KEY, list)
  markDirty()
}

export function getAllOutfits(): OutfitItem[] { return readOutfitList() }

export function addOutfit(input: OutfitInput): OutfitItem {
  const now = Date.now()
  const item: OutfitItem = { ...input, id: generateId(), createdAt: now, wearCount: 0, lastWornAt: 0 }
  const list = readOutfitList()
  list.push(item)
  writeOutfitList(list)
  return item
}

export function deleteOutfit(id: string): boolean {
  const list = readOutfitList()
  const filtered = list.filter((i) => i.id !== id)
  if (filtered.length === list.length) return false
  writeOutfitList(filtered)
  return true
}

export function updateOutfit(
  id: string,
  updates: Partial<Omit<OutfitItem, 'id' | 'createdAt'>>
): OutfitItem | undefined {
  const list = readOutfitList()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) return undefined

  const updated: OutfitItem = { ...list[index], ...updates, id: list[index].id, createdAt: list[index].createdAt }
  list[index] = updated
  writeOutfitList(list)
  return updated
}

export function recordOutfitWear(id: string): boolean {
  const list = readOutfitList()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) return false

  const current = list[index]
  const now = Date.now()

  list[index] = {
    ...current,
    wearCount: current.wearCount + 1,
    lastWornAt: now
  }

  writeOutfitList(list)
  current.clothingIds.forEach((clothingId) => {
    recordWear(clothingId)
  })

  return true
}

// ============================================================
// 数据导出/导入
// ============================================================

/** 导出所有数据（衣物 + 搭配） */
export function exportAllData(): string {
  const clothes = readClothesList()
  const outfits = readOutfitList()
  const data = {
    version: 1,
    exportTime: Date.now(),
    clothes,
    outfits
  }
  return JSON.stringify(data)
}

/** 导入数据（合并或覆盖） */
export function importData(jsonStr: string, mode: 'merge' | 'cover' = 'merge'): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.clothes || !Array.isArray(data.clothes)) {
      return { success: false, message: '数据格式错误' }
    }

    if (mode === 'cover') {
      writeClothesList(data.clothes)
      writeOutfitList(data.outfits || [])
      // 覆盖模式：使用导入数据的时间戳（如果有）
      if (data.exportTime) {
        setLocalTime(data.exportTime)
      }
    } else {
      // 合并模式：跳过已存在的 ID
      const existingClothes = readClothesList()
      const existingIds = new Set(existingClothes.map((c) => c.id))
      const newClothes = data.clothes.filter((c: ClothingItem) => !existingIds.has(c.id))
      writeClothesList([...existingClothes, ...newClothes])

      const existingOutfits = readOutfitList()
      const existingOutfitIds = new Set(existingOutfits.map((o) => o.id))
      const newOutfits = (data.outfits || []).filter((o: OutfitItem) => !existingOutfitIds.has(o.id))
      writeOutfitList([...existingOutfits, ...newOutfits])
    }

    return { success: true, message: `导入成功` }
  } catch (e) {
    return { success: false, message: '解析数据失败' }
  }
}

/** 通过微信分享导出数据 */
export function getExportData(): { clothes: ClothingItem[]; outfits: OutfitItem[] } {
  return {
    clothes: readClothesList(),
    outfits: readOutfitList()
  }
}
