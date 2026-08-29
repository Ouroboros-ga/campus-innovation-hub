import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeCarousel from '@/features/homepage/components/HomeCarousel.vue'
import { carouselSlides } from '@/mocks/fixtures/homepage'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

async function mountCarousel() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push('/').catch(() => undefined)

  const wrapper = mount(HomeCarousel, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
    }
  })
  mounted.push(wrapper)
  await new Promise(resolve => setTimeout(resolve, 50))

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('FE-007 首页校园轮播', () => {
  it('渲染三张轮播幻灯片，纯图片展示，不在左下角叠加标题/副标题', async () => {
    const wrapper = await mountCarousel()

    // 文字不作为可见叠加：不应出现 CTA 按钮文字
    expect(wrapper.text()).not.toContain('查看详情')
    expect(wrapper.text()).not.toContain('访问官网')
    // 每张幻灯片以图片链接承载，标题通过 aria-label 提供可访问名称
    for (const slide of carouselSlides) {
      const link = wrapper.find(`[aria-label="${slide.title}"]`)
      expect(link.exists()).toBe(true)
    }
    // 确认旧的文字叠加容器已移除
    expect(wrapper.html()).not.toContain('bg-white/90')
  })

  it('提供可访问的轮播区域与手动控制', async () => {
    const wrapper = await mountCarousel()

    const root = wrapper.get('[role="region"]')
    expect(root.attributes('aria-roledescription')).toBe('carousel')
    expect(root.attributes('tabindex')).toBe('0')

    expect(wrapper.find('[data-slot="prev"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="next"]').exists()).toBe(true)
  })

  it('每张幻灯片提供单个图片链接（可点击跳转），无文字按钮', async () => {
    const wrapper = await mountCarousel()

    const links = wrapper.findAll('[aria-label]')
    // 至少每张幻灯片一个可点击区域
    expect(links.length).toBeGreaterThanOrEqual(carouselSlides.length)
    for (const slide of carouselSlides) {
      const match = links.find(node => node.attributes('aria-label') === slide.title)
      expect(match).toBeTruthy()
    }
  })
})
