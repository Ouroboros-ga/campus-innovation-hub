import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import CompetitionListPage from '@/pages/competitions/CompetitionListPage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

async function mountPage(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push({ path: '/competitions', query })
  await router.isReady()

  const wrapper = mount(CompetitionListPage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
    }
  })
  mounted.push(wrapper)

  await new Promise(resolve => setTimeout(resolve, 450))
  await flushPromises()

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-020 竞赛列表页', () => {
  it('渲染标题、筛选控件与竞赛卡片（桌面网格）', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('竞赛中心')
    expect(wrapper.text()).toContain('共 12 项竞赛')

    // 桌面网格卡片
    const cards = wrapper.findAllComponents({ name: 'CompetitionCard' })
    expect(cards.length).toBeGreaterThan(0)
  })

  it('无结果时渲染空状态（且不依赖运行时间）', async () => {
    const wrapper = await mountPage({ category: 'ROBOTICS', format: 'INDIVIDUAL' })
    expect(wrapper.text()).toContain('没有符合条件的竞赛')
  })

  it('错误态触发 `?error=1` 并展示可操作的重试', async () => {
    const wrapper = await mountPage({ error: '1' })
    expect(wrapper.text()).toContain('竞赛列表加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })

  it('筛选选项覆盖状态 / 分类 / 形式', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('全部状态')
    expect(wrapper.text()).toContain('全部分类')
    expect(wrapper.text()).toContain('全部形式')
  })
})
