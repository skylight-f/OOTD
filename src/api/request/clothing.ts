/**
 * 衣物 API
 *
 * Mock 模式：内部调用 storage 实现
 * 真接口模式：调用 get/post 发起真实请求
 */

import { get, post } from '@/api/server/request'
import {
  getAllClothes,
  getClothingById,
  addClothing,
  updateClothing,
  deleteClothing,
  toggleFavorite,
  getClothingStats,
  recordWear,
  saveImageToTemp,
  exportAllData,
  importData,
  type ClothingItem,
  type ClothingInput,
  type ClothingStats
} from '@/utils/storage'

/** 是否使用 Mock 模式（切换真接口时改为 false） */
const USE_MOCK = true

/** 获取所有衣物 */
export function fetchAllClothes() {
  if (USE_MOCK) {
    const list = getAllClothes()
    return Promise.resolve({ code: 0, data: list, message: 'ok' })
  }
  return get("/api/clothing/list")
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 根据 ID 获取衣物 */
export function fetchClothingById(id: string) {
  if (USE_MOCK) {
    const item = getClothingById(id)
    return Promise.resolve({ code: 0, data: item, message: 'ok' })
  }
  return get("/api/clothing/detail", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 添加衣物 */
export function createClothing(input: ClothingInput) {
  if (USE_MOCK) {
    const item = addClothing(input)
    return Promise.resolve({ code: 0, data: item, message: 'ok' })
  }
  return post("/api/clothing/add", input)
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 更新衣物 */
export function modifyClothing(
  id: string,
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
) {
  if (USE_MOCK) {
    const item = updateClothing(id, updates)
    return Promise.resolve({ code: 0, data: item, message: 'ok' })
  }
  return post("/api/clothing/update", { id, ...updates })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 删除衣物 */
export function removeClothing(id: string) {
  if (USE_MOCK) {
    const success = deleteClothing(id)
    return Promise.resolve({ code: 0, data: success, message: 'ok' })
  }
  return post("/api/clothing/delete", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 切换收藏状态 */
export function toggleClothingFavorite(id: string) {
  if (USE_MOCK) {
    const item = toggleFavorite(id)
    return Promise.resolve({ code: 0, data: item, message: 'ok' })
  }
  return post("/api/clothing/favorite", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 获取统计数据 */
export function fetchClothingStats() {
  if (USE_MOCK) {
    const stats = getClothingStats()
    return Promise.resolve({ code: 0, data: stats, message: 'ok' })
  }
  return get("/api/clothing/stats")
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 记录穿着 */
export function recordClothingWear(id: string) {
  if (USE_MOCK) {
    const success = recordWear(id)
    return Promise.resolve({ code: 0, data: success, message: 'ok' })
  }
  return post("/api/clothing/wear", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 保存图片到本地 */
export function uploadClothingImage(tempFilePath: string) {
  if (USE_MOCK) {
    return saveImageToTemp(tempFilePath)
      .then((savedPath: string) => ({ code: 0, data: savedPath, message: 'ok' }))
      .catch(() => ({ code: 0, data: tempFilePath, message: 'ok' }))
  }
  return post("/api/clothing/uploadImage", { tempFilePath })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 导出所有数据 */
export function exportData() {
  if (USE_MOCK) {
    const data = exportAllData()
    return Promise.resolve({ code: 0, data, message: 'ok' })
  }
  return get("/api/clothing/export")
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 导入数据 */
export function importClothingData(jsonStr: string, mode: 'merge' | 'cover' = 'merge') {
  if (USE_MOCK) {
    const result = importData(jsonStr, mode)
    return Promise.resolve({ code: 0, data: result, message: 'ok' })
  }
  return post("/api/clothing/import", { data: jsonStr, mode })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}
