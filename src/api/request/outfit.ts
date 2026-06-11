/**
 * 搭配 API
 *
 * Mock 模式：内部调用 storage 实现
 * 真接口模式：调用 get/post 发起真实请求
 */

import { get, post } from '@/api/server/request'
import {
  getAllOutfits,
  addOutfit,
  deleteOutfit,
  recordOutfitWear,
  type OutfitItem,
  type OutfitInput
} from '@/utils/storage'

/** 是否使用 Mock 模式（切换真接口时改为 false） */
const USE_MOCK = true

/** 获取所有搭配 */
export function fetchAllOutfits() {
  if (USE_MOCK) {
    const list = getAllOutfits()
    return Promise.resolve({ code: 0, data: list, message: 'ok' })
  }
  return get("/api/outfit/list")
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 创建搭配 */
export function createOutfit(input: OutfitInput) {
  if (USE_MOCK) {
    const item = addOutfit(input)
    return Promise.resolve({ code: 0, data: item, message: 'ok' })
  }
  return post("/api/outfit/add", input)
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 删除搭配 */
export function removeOutfit(id: string) {
  if (USE_MOCK) {
    const success = deleteOutfit(id)
    return Promise.resolve({ code: 0, data: success, message: 'ok' })
  }
  return post("/api/outfit/delete", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}

/** 记录搭配穿着 */
export function recordOutfitWearById(id: string) {
  if (USE_MOCK) {
    const success = recordOutfitWear(id)
    return Promise.resolve({ code: 0, data: success, message: 'ok' })
  }
  return post("/api/outfit/wear", { id })
    .then((res: any) => { return res })
    .catch((err: any) => { return err })
}
