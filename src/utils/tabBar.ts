export function setCustomTabBarSelected(page: { getTabBar?: () => { setData: (data: Record<string, unknown>) => void } | null }, selected: number) {
  if (!page || typeof page.getTabBar !== 'function') return

  const tabBar = page.getTabBar()
  if (tabBar && typeof tabBar.setData === 'function') {
    tabBar.setData({ selected })
  }
}