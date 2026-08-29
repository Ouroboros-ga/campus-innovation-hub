import { useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { useAuthStore } from '@/stores/auth'

/**
 * 需要登录的操作前置检查（复用）。
 * - 已登录返回 true；
 * - 未登录跳转到登录页并携带 redirect，toast 提示，返回 false。
 */
export function useRequireAuth() {
  const router = useRouter()
  const auth = useAuthStore()
  const toast = useToast()

  function requireAuth(message = '请先登录'): boolean {
    if (auth.isAuthenticated) return true
    const redirect = router.currentRoute.value.fullPath
    void router.push({ name: 'login', query: { redirect } })
    toast.add({
      title: message,
      description: '该操作需要登录后才能继续。',
      color: 'warning',
      icon: 'i-lucide-lock'
    })
    return false
  }

  return { requireAuth, auth }
}
