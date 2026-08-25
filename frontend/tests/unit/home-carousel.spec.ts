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
  it('渲染三张轮播幻灯片，含类别与标题', async () => {
    const wrapper = await mountCarousel()

    for (const slide of carouselSlides) {
      expect(slide.categoryLabel).not.toBeNull()
      expect(wrapper.text()).toContain(slide.categoryLabel!)
      expect(wrapper.text()).toContain(slide.title)
      expect(wrapper.text()).toContain(slide.subtitle!)
    }
  })

  it('提供可访问的轮播区域与手动控制', async () => {
    const wrapper = await mountCarousel()

    const root = wrapper.get('[role="region"]')
    expect(root.attributes('aria-roledescription')).toBe('carousel')
    expect(root.attributes('tabindex')).toBe('0')

    expect(wrapper.find('[data-slot="prev"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="next"]').exists()).toBe(true)
  })

  it('每张幻灯片提供单个 CTA 链接', async () => {
    const wrapper = await mountCarousel()

    expect(wrapper.findAll('a').length).toBeGreaterThanOrEqual(
      carouselSlides.length
    )
    expect(wrapper.text()).toContain('查看详情')
  })
})
