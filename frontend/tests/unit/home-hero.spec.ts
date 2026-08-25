import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/app/App.vue'
import { routes } from '@/router/routes'

const mountedWrappers: ReturnType<typeof mount>[] = []

async function mountAppAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
    }
  })
  mountedWrappers.push(wrapper)
  await flushPromises()

  return { router, wrapper }
}

afterEach(() => {
  mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-006 首页 Hero 与快捷入口', () => {
  it('渲染主标题与一句说明', async () => {
    const { wrapper } = await mountAppAt('/')

    const main = wrapper.get('main')
    expect(main.get('h1').text()).toBe('发现科创机会，成就无限可能')
    expect(main.text()).toContain('连接竞赛、伙伴、组织与活动，助力你的成长与探索')
  })

  it('提供四个快捷入口，分别指向对应路由', async () => {
    const { wrapper } = await mountAppAt('/')

    const quickLabels = ['找竞赛', '找队友', '找组织', '找活动']
    const hrefs = wrapper
      .findAll('main a')
      .filter(link => quickLabels.some(label => link.text().includes(label)))
      .map(link => link.attributes('href'))
    expect(hrefs).toEqual([
      '/competitions',
      '/teams',
      '/organizations',
      '/activities'
    ])
    const mainText = wrapper.get('main').text()
    expect(mainText).toContain('找竞赛')
    expect(mainText).toContain('找队友')
    expect(mainText).toContain('找组织')
    expect(mainText).toContain('找活动')
  })

  it('快捷入口可导航到对应页面', async () => {
    const { router, wrapper } = await mountAppAt('/')

    await wrapper.get('main a[href="/teams"]').trigger('click')
    await flushPromises()

    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/teams')
    })
  })
})
