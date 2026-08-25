import { describe, expect, it } from 'vitest'

import { router } from '@/router'
import { routes } from '@/router/routes'

describe('应用路由', () => {
  it('使用 HTML5 history 并将公开路由组织在应用外壳中', () => {
    expect(router.options.history.base).toBe('')

    const publicRoute = routes.find(route => route.path === '/')
    const publicRouteNames = publicRoute?.children?.map(route => route.name)

    expect(publicRouteNames).toEqual([
      'home',
      'competitions',
      'competition-detail',
      'organizations',
      'teams',
      'activities',
      'qa'
    ])
  })

  it('开发环境注册设计系统视觉参考路由', () => {
    const designSystemRoute = routes.find(
      route => route.path === '/dev/design-system'
    )

    expect(import.meta.env.DEV).toBe(true)
    expect(designSystemRoute?.name).toBe('dev-design-system')
  })
})
