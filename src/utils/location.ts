/**
 * 定位工具 - 获取用户经纬度
 * 用于天气查询等需要地理位置的场景
 */

interface LocationResult {
  longitude: number
  latitude: number
}

/**
 * 获取用户当前位置
 * 需要用户在 app.json 中配置 "permission" 中的 scope.userLocation
 * 失败时返回 null，由调用方决定兜底策略
 */
export function getCurrentLocation(): Promise<LocationResult | null> {
  return new Promise((resolve) => {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        resolve({
          longitude: res.longitude,
          latitude: res.latitude
        })
      },
      fail: () => {
        // 用户拒绝授权或定位失败，静默处理
        resolve(null)
      }
    })
  })
}
