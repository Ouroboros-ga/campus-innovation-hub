export interface PublicNavigationItem {
  label: string
  to: string
}

export const publicNavigationItems: readonly PublicNavigationItem[] = [
  { label: '首页', to: '/' },
  { label: '竞赛', to: '/competitions' },
  { label: '社团组织', to: '/organizations' },
  { label: '组队广场', to: '/teams' },
  { label: '校园动态', to: '/activities' },
  { label: '咨询指南（Q&A）', to: '/qa' }
]

/**
 * 手机端根级 Bottom Navigation 的五项（FrontendDesign.md §16.2）。
 * 仅允许这些高频率目的地进入底部导航；`社团组织` 与 `咨询指南` 通过
 * 首页快捷入口 / 业务模块 / 全局搜索 / “我的” 进入，不进入底部栏。
 */
export interface PhoneTabItem extends PublicNavigationItem {
  icon: string
}

export const phoneTabItems: readonly PhoneTabItem[] = [
  { label: '首页', icon: 'i-lucide-house', to: '/' },
  { label: '竞赛', icon: 'i-lucide-trophy', to: '/competitions' },
  { label: '组队', icon: 'i-lucide-users', to: '/teams' },
  { label: '动态', icon: 'i-lucide-calendar-days', to: '/activities' },
  { label: '我的', icon: 'i-lucide-circle-user', to: '/me' }
] as const

export type MobileShell = 'tab' | 'detail' | 'form' | 'manage'

export type MobileTab = 'home' | 'competitions' | 'teams' | 'activities' | 'me'

export function isNavigationItemActive(
  currentPath: string,
  targetPath: string
): boolean {
  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
