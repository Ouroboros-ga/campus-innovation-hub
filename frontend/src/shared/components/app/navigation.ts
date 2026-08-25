export interface PublicNavigationItem {
  label: string
  to: string
}

export const publicNavigationItems: readonly PublicNavigationItem[] = [
  { label: '首页', to: '/' },
  { label: '竞赛', to: '/competitions' },
  { label: '社团组织', to: '/organizations' },
  { label: '组队广场', to: '/teams' },
  { label: '活动', to: '/activities' },
  { label: '咨询指南（Q&A）', to: '/qa' }
]

export function isNavigationItemActive(
  currentPath: string,
  targetPath: string
): boolean {
  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
