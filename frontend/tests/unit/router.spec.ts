import { describe, expect, it } from 'vitest'

import { router } from '@/router'
import { routes } from '@/router/routes'

describe('应用路由', () => {
  it('使用 HTML5 history 并注册首页路由', () => {
    expect(router.options.history.base).toBe('')
    expect(routes.some(route => route.path === '/' && route.name === 'home')).toBe(true)
  })

  it('开发环境注册设计系统视觉参考路由', () => {
    const designSystemRoute = routes.find(
      route => route.path === '/dev/design-system'
    )

    expect(import.meta.env.DEV).toBe(true)
    expect(designSystemRoute?.name).toBe('dev-design-system')
  })
})
