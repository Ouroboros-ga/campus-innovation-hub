import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { registerRouterGuards } from '@/router/guards'
import { useAuthStore } from '@/stores/auth'
import * as authApi from '@/features/auth/api/authApi'
import type { AuthMeResult } from '@/features/auth/types'

vi.mock('@/features/auth/api/authApi', () => ({
  initCsrf: vi.fn().mockResolvedValue(undefined),
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
}))

const studentMe: AuthMeResult = {
  user: {
    id: 'u1',
    username: '20240001',
    identity_type: 'STUDENT',
    student_no: '20240001',
    employee_no: null,
    real_name: '张三',
    platform_role: 'USER',
    is_superuser: false,
    profile: {
      nickname: '阿三',
      avatar: null,
      major: '人工智能',
      grade: 2,
      bio: '',
      skills: []
    }
  },
  permissions: {
    platform_role: 'USER',
    organization_memberships: []
  }
}

const operatorMe: AuthMeResult = {
  user: {
    id: 'op1',
    username: 'op',
    identity_type: 'STUDENT',
    student_no: 'op',
    employee_no: null,
    real_name: '运营',
    platform_role: 'OPERATOR',
    is_superuser: false,
    profile: {
      nickname: '运营',
      avatar: null,
      major: '',
      grade: null,
      bio: '',
      skills: []
    }
  },
  permissions: {
    platform_role: 'OPERATOR',
    organization_memberships: []
  }
}

/** 最小 stub 路由：隔离守卫逻辑，不加载重型页面。 */
const stubRoutes = [
  { path: '/', name: 'home', component: { template: '<div>home</div>' } },
  { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
  {
    path: '/me',
    name: 'me',
    component: { template: '<div>me</div>' },
    meta: { auth: 'auth' }
  },
  {
    path: '/ops',
    name: 'ops',
    component: { template: '<div>ops</div>' },
    meta: { auth: 'operator' }
  }
]

async function makeRouter() {
  const router = createRouter({ history: createMemoryHistory(), routes: stubRoutes })
  registerRouterGuards(router)
  await router.push('/')
  await router.isReady()
  return router
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().reset()
  vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(null)
})

describe('FE-105 认证会话与路由守卫', () => {
  it('未登录访问需登录路由时跳转登录页并携带 redirect', async () => {
    const router = await makeRouter()
    await router.push('/me')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/me')
  })

  it('学生登录后可访问 /me', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(studentMe)
    const router = await makeRouter()

    await router.push('/me')
    expect(router.currentRoute.value.name).toBe('me')
  })

  it('学生无法访问 /ops（无运营权限）', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(studentMe)
    const router = await makeRouter()

    await router.push('/ops')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('运营员可访问 /ops', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(operatorMe)
    const router = await makeRouter()

    await router.push('/ops')
    expect(router.currentRoute.value.name).toBe('ops')
  })

  it('登录动作更新会话状态', async () => {
    vi.mocked(authApi.login).mockResolvedValue(studentMe)
    const auth = useAuthStore()

    await auth.login({ username: '20240001', password: 'secret' })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.platformRole).toBe('USER')
    expect(auth.isOperator).toBe(false)
  })

  it('登出动作清空会话', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(studentMe)
    const auth = useAuthStore()
    await auth.init()
    expect(auth.isAuthenticated).toBe(true)

    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
  })
})
