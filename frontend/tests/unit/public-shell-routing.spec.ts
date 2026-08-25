import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '@/app/App.vue'
import { routes } from '@/router/routes'

const mountedWrappers: ReturnType<typeof mount>[] = []

async function mountAt(path: string) {
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
  vi.unstubAllGlobals()
})

describe('FE-004 公开应用外壳', () => {
  it.each([
    ['/', '发现科创机会，成就无限可能'],
    ['/competitions', '竞赛中心'],
    ['/organizations', '社团与组织'],
    ['/teams', '组队广场'],
    ['/activities', '活动中心'],
    ['/qa', '咨询指南']
  ])('让 %s 共享完整外壳并显示正确页面标题', async (path, title) => {
    const { wrapper } = await mountAt(path)

    expect(wrapper.get('header').attributes('role')).toBe('banner')
    expect(wrapper.get('main').get('h1').text()).toBe(title)
    expect(wrapper.get('footer').attributes('role')).toBe('contentinfo')
  })

  it('支持桌面导航、活动路由状态和可访问的工具按钮', async () => {
    const { router, wrapper } = await mountAt('/')

    const desktopNavigation = wrapper.get('[aria-label="主导航"]')
    expect(desktopNavigation.text()).toContain('首页')
    expect(desktopNavigation.text()).toContain('竞赛')
    expect(desktopNavigation.text()).toContain('社团组织')
    expect(desktopNavigation.text()).toContain('组队广场')
    expect(desktopNavigation.text()).toContain('活动')
    expect(desktopNavigation.text()).toContain('咨询指南（Q&A）')

    await desktopNavigation.get('a[href="/activities"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/activities')
    expect(wrapper.get('main h1').text()).toBe('活动中心')
    expect(
      desktopNavigation.get('a[href="/activities"]').attributes('aria-current')
    ).toBe('page')
    expect(wrapper.get('button[aria-label="搜索"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="查看通知"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="切换外观"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="打开用户菜单"]')).toBeTruthy()
  })

  it('通过移动端 Drawer 导航并在选择后关闭', async () => {
    vi.stubGlobal('getComputedStyle', () => ({
      animationName: 'none',
      display: 'block'
    }))
    const { router, wrapper } = await mountAt('/')

    await wrapper.get('button[aria-label="打开主菜单"]').trigger('click')
    await flushPromises()

    const drawer = document.body.querySelector('[role="dialog"]')
    expect(drawer?.textContent).toContain('主导航')

    const organizationLink = drawer?.querySelector<HTMLAnchorElement>(
      'a[href="/organizations"]'
    )
    organizationLink?.click()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/organizations')
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('在 Footer 中提供平台说明入口', async () => {
    const { wrapper } = await mountAt('/')
    const footer = wrapper.get('footer')

    expect(footer.text()).toContain('© 2026 人工智能学院科创与就业服务平台')
    expect(footer.text()).toContain('关于我们')
    expect(footer.text()).toContain('联系我们')
    expect(footer.text()).toContain('使用帮助')
    expect(footer.text()).toContain('隐私政策')
  })
})
