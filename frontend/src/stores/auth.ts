import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  fetchCurrentUser,
  initCsrf,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister
} from '@/features/auth/api/authApi'
import type {
  AuthPermissions,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegisterResult
} from '@/features/auth/types'

/** 会话状态。anonymous=未登录，error=连不上服务器。 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error'

/** 应用启动时只初始化一次会话；多次调用复用同一 Promise。 */
let initPromise: Promise<void> | null = null

/**
 * 认证会话商店（FE-105）。
 *
 * 由 `/api/auth/me`（LOGIN）驱动；未登录为 anonymous（fail-open，不阻塞浏览）。
 * 提供平台角色与组织成员关系的权限上下文；仅用于 UX，后端始终是权威。
 */
export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('idle')
  const user = ref<AuthUser | null>(null)
  const permissions = ref<AuthPermissions | null>(null)
  const lastError = ref<string | null>(null)

  const isAuthenticated = computed(
    () => status.value === 'authenticated' && user.value !== null
  )
  const platformRole = computed(() => user.value?.platform_role ?? null)
  const isSuperadmin = computed(() => user.value?.is_superuser === true)
  const isOperator = computed(
    () => platformRole.value === 'OPERATOR' || isSuperadmin.value
  )
  const organizationMemberships = computed(
    () => permissions.value?.organization_memberships ?? []
  )

  /** 初始化 CSRF 并尽力恢复会话（未登录 401 → anonymous，网络错误 → error）。 */
  async function init(): Promise<void> {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        await initCsrf()
      } catch {
        // CSRF 初始化失败不阻塞浏览；写请求将因缺 X-CSRFToken 失败并被页面提示。
      }
      try {
        const me = await fetchCurrentUser()
        if (me) {
          user.value = me.user
          permissions.value = me.permissions
          status.value = 'authenticated'
          lastError.value = null
        } else {
          status.value = 'anonymous'
          lastError.value = null
        }
      } catch (e: unknown) {
        const err = e as { status?: number; message?: string }
        // 网络/服务不可用 → error，连不上服务器数据就报错
        if (err && typeof err.status === 'number' && err.status === 0) {
          status.value = 'error'
          lastError.value = err.message ?? '无法连接服务器'
        } else if (err && err.status && err.status >= 500) {
          status.value = 'error'
          lastError.value = err.message ?? '服务器异常'
        } else {
          // 401 等按未登录处理
          status.value = 'anonymous'
          lastError.value = null
        }
      }
    })()
    return initPromise
  }

  /** 路由守卫调用：确保会话已初始化。 */
  async function ensureSession(): Promise<void> {
    await init()
  }

  /** 登录（PUBLIC）。抛出错误由调用方处理（401 / ACCOUNT_UNAVAILABLE 等）。 */
  async function login(payload: LoginPayload): Promise<void> {
    status.value = 'loading'
    try {
      const me = await apiLogin(payload)
      user.value = me.user
      permissions.value = me.permissions
      status.value = 'authenticated'
    } catch (error) {
      status.value = 'anonymous'
      throw error
    }
  }

  /** 学生自助注册（PUBLIC）；注册成功仍不创建 Session。 */
  async function register(payload: RegisterPayload): Promise<RegisterResult> {
    return apiRegister(payload)
  }

  /** 登出（LOGIN）。 */
  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } finally {
      user.value = null
      permissions.value = null
      status.value = 'anonymous'
      initPromise = null
    }
  }

  /** 测试用：重置到初始状态。 */
  function reset(): void {
    status.value = 'idle'
    user.value = null
    permissions.value = null
    lastError.value = null
    initPromise = null
  }

  return {
    status,
    user,
    permissions,
    lastError,
    isAuthenticated,
    platformRole,
    isSuperadmin,
    isOperator,
    organizationMemberships,
    init,
    ensureSession,
    login,
    register,
    logout,
    reset
  }
})
