import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import RegisterPage from '@/pages/auth/RegisterPage.vue'
import { routes } from '@/router/routes'
import * as authApi from '@/features/auth/api/authApi'

vi.mock('@/features/auth/api/authApi', () => ({
  register: vi.fn()
}))

vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: vi.fn() })
}))

const mounted: ReturnType<typeof mount>[] = []

async function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/register')
  await router.isReady()

  const wrapper = mount(RegisterPage, {
    attachTo: document.body,
    global: { plugins: [router, ui, pinia] }
  })
  mounted.push(wrapper)
  return wrapper
}

async function fillAndSubmit(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('input[autocomplete="username"]').setValue('20240001')
  const inputs = wrapper.findAll('input')
  await inputs[1]!.setValue('张三')
  await inputs[2]!.setValue('secret01')
  await inputs[3]!.setValue('secret01')
  await wrapper.get('button[type="submit"]').trigger('submit')
  await flushPromises()
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-105 注册页', () => {
  it('空表单提交展示学号校验提示', async () => {
    const wrapper = await mountPage()
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('请填写学号')
  })

  it('两次密码不一致展示校验提示', async () => {
    const wrapper = await mountPage()
    await wrapper.get('input[autocomplete="username"]').setValue('20240001')
    const inputs = wrapper.findAll('input')
    await inputs[1]!.setValue('张三')
    await inputs[2]!.setValue('secret01')
    await inputs[3]!.setValue('different')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('两次输入的密码不一致')
  })

  it('注册成功展示待审核提示', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      status: 'pending_approval',
      message: '注册已提交，请等待管理员审核。'
    })
    const wrapper = await mountPage()
    await fillAndSubmit(wrapper)

    expect(wrapper.text()).toContain('注册已提交')
    expect(wrapper.text()).toContain('等待管理员审核')
  })
})
