import type { Router } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

/**
 * 路由守卫（FE-105，仅 UX；后端始终是权威）。
 *
 * - `meta.auth === 'auth'`：需登录，未登录跳转登录页并携带 `redirect`；
 * - `meta.auth === 'operator'`：需运营权限（OPERATOR / SUPERADMIN）。
 *
 * 仅对标记了 `meta.auth` 的路由做会话检查；pinia 未激活（如测试直接挂真实 router 而未装
 * pinia）或会话检查异常时 fail-open，不阻断导航。
 */
export function registerRouterGuards(router: Router): void {
  router.beforeEach(async to => {
    const required = to.meta.auth as 'auth' | 'operator' | undefined
    if (!required) return true

    let auth: ReturnType<typeof useAuthStore>
    try {
      auth = useAuthStore()
    } catch {
      return true
    }

    await auth.ensureSession()

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (required === 'operator' && !auth.isOperator) {
      return { name: 'home' }
    }

    return true
  })
}
