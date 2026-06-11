/**
 * API 统一出口
 *
 * 页面和组件通过此文件导入 API 方法
 * 切换真接口时，只需将各模块的 USE_MOCK 改为 false
 */

export {
  fetchAllClothes,
  fetchClothingById,
  createClothing,
  modifyClothing,
  removeClothing,
  toggleClothingFavorite,
  fetchClothingStats,
  recordClothingWear,
  uploadClothingImage,
  exportData,
  importClothingData
} from './clothing'

export {
  fetchAllOutfits,
  createOutfit,
  removeOutfit,
  recordOutfitWearById
} from './outfit'
