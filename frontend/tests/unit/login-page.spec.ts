import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import LoginPage from '@/pages/auth/LoginPage.vue'
import { routes } from '@/router/routes'
import { useAuthStore } from '@/stores/auth'
import * as authApi from '@/features/auth/api/authApi'

vi.mock('@/features/auth/api/authApi', () => ({
  initCsrf: vi.fn(),
  fetchCurrentUser: vi.fn().mockResolvedValue(null),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
}))

vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: vi.fn() })
}))

const studentMe = {
  user: {
    id: 'u1',
    username: '20240001',
    identity_type: 'STUDENT' as const,
    student_no: '20240001',
    employee_no: null,
    real_name: '张三',
    platform_role: 'USER' as const,
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
    platform_role: 'USER' as const,
    organization_memberships: []
  }
}

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(null)
})

async function mountPage(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push({ path: '/login', query })
  await router.isReady()

  const wrapper = mount(LoginPage, {
    attachTo: document.body,
    global: { plugins: [router, ui, pinia] }
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-105 登录页', () => {
  it('空账号提交展示校验提示', async () => {
    const wrapper = await mountPage()
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('请输入用户名')
  })

  it('登录失败（401）展示可操作错误', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new Error('bad credentials')
    )
    const wrapper = await mountPage()
    await wrapper.get('input[autocomplete="username"]').setValue('20240001')
    await wrapper.get('input[autocomplete="current-password"]').setValue('wrong')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('登录失败')
  })

  it('登录成功更新会话状态', async () => {
    vi.mocked(authApi.login).mockResolvedValue(studentMe)
    const wrapper = await mountPage()
    await wrapper.get('input[autocomplete="username"]').setValue('20240001')
    await wrapper.get('input[autocomplete="current-password"]').setValue('secret')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(useAuthStore().isAuthenticated).toBe(true)
  })
})
