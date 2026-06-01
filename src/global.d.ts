declare module '*?fallback=true' {
  const URL: string
  export default URL
}

// ============================================================
// 微信小程序 API 类型声明（仅覆盖本项目实际使用的接口）
// ============================================================

declare namespace wx {
  // ------ 导航 ------
  function navigateTo(options: {
    url: string
    success?: () => void
    fail?: (err: unknown) => void
    complete?: () => void
  }): void

  function navigateBack(options?: {
    delta?: number
    success?: () => void
    fail?: (err: unknown) => void
    complete?: () => void
  }): void

  function switchTab(options: {
    url: string
    success?: () => void
    fail?: (err: unknown) => void
    complete?: () => void
  }): void

  // ------ 交互 ------
  function showToast(options: {
    title: string
    icon?: 'success' | 'none' | 'loading' | 'error'
    duration?: number
    mask?: boolean
  }): void

  function showLoading(options: {
    title?: string
    mask?: boolean
  }): void

  function hideLoading(): void

  function showModal(options: {
    title?: string
    content?: string
    confirmText?: string
    cancelText?: string
    confirmColor?: string
    showCancel?: boolean
    success?: (res: { confirm: boolean; cancel: boolean }) => void
    fail?: (err: unknown) => void
  }): void

  // ------ 系统 ------
  function getSystemInfoSync(): {
    statusBarHeight?: number
    screenWidth?: number
    screenHeight?: number
    platform?: string
    [key: string]: unknown
  }

  // ------ 网络 ------
  interface RequestSuccessCallbackResult {
    data: unknown
    statusCode: number
    header: Record<string, string>
    cookies: string[]
  }

  function request(options: {
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT'
    data?: unknown
    header?: Record<string, string>
    dataType?: string
    success?: (res: RequestSuccessCallbackResult) => void
    fail?: (err: unknown) => void
    complete?: () => void
  }): void

  // ------ 媒体 ------
  interface ChooseMediaSuccessCallbackResult {
    tempFiles: Array<{
      tempFilePath: string
      size: number
      width?: number
      height?: number
    }>
    type: string
  }

  function chooseMedia(options: {
    count?: number
    mediaType?: Array<'image' | 'video' | 'mix'>
    sourceType?: Array<'album' | 'camera'>
    maxDuration?: number
    sizeType?: Array<'original' | 'compressed'>
    success?: (res: ChooseMediaSuccessCallbackResult) => void
    fail?: (err: unknown) => void
  }): void

  // ------ 位置 ------
  interface GetLocationSuccessResult {
    latitude: number
    longitude: number
    speed?: number
    accuracy?: number
    altitude?: number
    horizontalAccuracy?: number
    verticalAccuracy?: number
  }

  function getLocation(options: {
    type?: string
    altitude?: boolean
    success?: (res: GetLocationSuccessResult) => void
    fail?: (err: unknown) => void
    complete?: () => void
  }): void

  // ------ 存储 ------
  function getStorageSync(key: string): any
  function setStorageSync(key: string, data: unknown): void

  // ------ 文件系统 ------
  interface FileSystemManager {
    mkdir(options: {
      dirPath: string
      recursive?: boolean
      success?: () => void
      fail?: (err: unknown) => void
    }): void
    saveFile(options: {
      tempFilePath: string
      filePath?: string
      success?: (res: { savedFilePath: string }) => void
      fail?: (err: unknown) => void
    }): void
  }

  function getFileSystemManager(): FileSystemManager

  // ------ 环境变量 ------
  const env: {
    USER_DATA_PATH: string
  }
}
