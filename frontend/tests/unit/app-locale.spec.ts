import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import App from '@/app/App.vue'
import { router } from '@/router'

vi.mock('@/features/auth/api/authApi', () => ({
  initCsrf: vi.fn().mockResolvedValue(undefined),
  fetchCurrentUser: vi.fn().mockResolvedValue(null),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn()
}))

describe('应用语言', () => {
  it('让 Nuxt UI 浮层使用简体中文辅助文案', async () => {
    await router.push('/dev/design-system')
    await router.isReady()

    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
      plugins: [router, ui, createPinia()]
    }
    })

    await wrapper.get('button[aria-label="打开确认对话框"]').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('button[aria-label="关闭"]')).not.toBeNull()

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
