import type { Router } from 'vue-router'

export function registerRouterGuards(router: Router): void {
  router.beforeEach(() => true)
}
