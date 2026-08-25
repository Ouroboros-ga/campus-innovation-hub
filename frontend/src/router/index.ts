import { createRouter, createWebHistory } from 'vue-router'

import { registerRouterGuards } from '@/router/guards'
import { routes } from '@/router/routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

registerRouterGuards(router)
