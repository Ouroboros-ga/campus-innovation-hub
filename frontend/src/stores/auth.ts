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

/** 会话状态。 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

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

  /** 初始化 CSRF 并尽力恢复会话（未登录 401 → anonymous）。 */
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
        } else {
          status.value = 'anonymous'
        }
      } catch {
        // 非 401 错误 fail-open，按未登录处理，避免阻断导航。
        status.value = 'anonymous'
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

  /** 注册并提交审核（PUBLIC）。 */
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
    }
  }

  /** 测试用：重置到初始状态。 */
  function reset(): void {
    status.value = 'idle'
    user.value = null
    permissions.value = null
    initPromise = null
  }

  return {
    status,
    user,
    permissions,
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
