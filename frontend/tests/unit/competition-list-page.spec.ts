import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import CompetitionListPage from '@/pages/competitions/CompetitionListPage.vue'
import { routes } from '@/router/routes'
import { listCompetitions } from '@/features/competitions/api/competitionApi'
import type { CompetitionSummary } from '@/shared/types/homepage'

vi.mock('@/features/competitions/api/competitionApi', () => ({
  listCompetitions: vi.fn()
}))

const sample: CompetitionSummary = {
  id: 'lanqiao-2026',
  name: '蓝桥杯全国软件和信息技术专业人才大赛',
  edition: '2026',
  slogan: null,
  crossSchool: undefined,
  category: 'PROGRAMMING',
  level: 'NATIONAL',
  participationMode: 'TEAM',
  registrationStartAt: '2026-08-01T00:00:00+08:00',
  registrationEndAt: '2026-09-10T23:59:59+08:00',
  eventStartAt: '2026-10-10T09:00:00+08:00',
  eventEndAt: null,
  officialUrl: 'https://dasai.lanqiao.cn',
  cover: { alt: '蓝桥杯封面', src: null },
  detailPath: '/competitions/lanqiao-2026'
}

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.mocked(listCompetitions).mockResolvedValue({ items: [sample], total: 1, page: 1 })
})

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

  await flushPromises()
  await wrapper.vm.$nextTick()

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-101 竞赛列表页（API 驱动）', () => {
  it('渲染标题、筛选控件与竞赛卡片（桌面网格）', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('竞赛中心')
    expect(wrapper.find('input[placeholder="搜索竞赛名称、关键词"]').exists()).toBe(true)

    const cards = wrapper.findAllComponents({ name: 'CompetitionCard' })
    expect(cards.length).toBeGreaterThan(0)
  })

  it('无结果时渲染空状态', async () => {
    vi.mocked(listCompetitions).mockResolvedValueOnce({ items: [], total: 0, page: 1 })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('没有符合条件的竞赛')
  })

  it('API 失败时展示可操作的重试', async () => {
    vi.mocked(listCompetitions).mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('竞赛列表加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })

  it('筛选选项覆盖状态 / 分类 / 个人团队', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('全部状态')
    expect(wrapper.text()).toContain('全部分类')
    expect(wrapper.text()).toContain('个人/团队')
    expect(wrapper.text()).toContain('全部')
  })

  it('有筛选时渲染「已选条件」chips 与清空全部', async () => {
    const wrapper = await mountPage({ status: 'OPEN', category: 'AI' })

    expect(wrapper.text()).toContain('已选条件：')
    expect(wrapper.text()).toContain('报名中')
    expect(wrapper.text()).toContain('人工智能')
    expect(wrapper.text()).toContain('清空全部')
  })
})
