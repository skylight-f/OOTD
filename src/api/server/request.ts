/**
 * 请求封装
 *
 * Mock 模式：各 API 模块自行处理数据
 * 真接口模式：使用 xfetch 发起真实请求
 */

import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'

let inited = false
let baseUrl = 'https://apitest.ootd.com'

function ensureInit() {
  if (inited) return
  inited = true

  mpx.use(mpxFetch)

  try {
    if (mpx.getAccountInfoSync) {
      const appInfo = mpx.getAccountInfoSync().miniProgram
      if (appInfo.envVersion === 'release') {
        baseUrl = 'https://api.ootd.com'
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    mpx.xfetch.interceptors.request.use(function (config: any) {
      return config
    })
    mpx.xfetch.interceptors.response.use(function (res: any) {
      if (res.status !== 200) {
        mpx.showToast({ title: `网络异常${res.status}`, icon: 'none' })
      }
      return res
    })
  } catch (e) {
    // xfetch 未就绪，跳过
  }
}

export const get = (url: string, params?: object) => {
  ensureInit()
  return mpx.xfetch.fetch({
    header: {
      authorization: mpx.getStorageSync('token') ? `Bearer ${mpx.getStorageSync('token')}` : ''
    },
    url: !url.includes('http') ? baseUrl + url : url,
    method: 'GET',
    params: params,
    timeout: 10000
  })
  .then((res: any) => {
    return res.data
  })
  .catch((err: any) => {
    mpx.showToast({ title: '网络异常', icon: 'none' })
    return err
  })
}

export const post = (url: string, data?: object) => {
  ensureInit()
  return mpx.xfetch.fetch({
    header: {
      authorization: mpx.getStorageSync('token') ? `Bearer ${mpx.getStorageSync('token')}` : ''
    },
    url: !url.includes('http') ? baseUrl + url : url,
    method: 'POST',
    data: data,
    timeout: 10000
  })
  .then((res: any) => {
    return res.data
  })
  .catch((err: any) => {
    return err
  })
}
