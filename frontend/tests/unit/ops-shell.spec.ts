import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import OpsShell from '@/features/ops/components/OpsShell.vue'
import OpsOverviewPage from '@/pages/ops/OpsOverviewPage.vue'
import OpsActivitiesPage from '@/pages/ops/OpsActivitiesPage.vue'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listAnnouncements } from '@/features/ops/api/opsAnnouncementApi'
import { listCompetitions } from '@/features/ops/api/opsCompetitionApi'
import { listConsultations } from '@/features/ops/api/opsConsultationApi'
import { dynamicsActivities, dynamicsAnnouncements } from '@/mocks/fixtures/dynamics'

vi.mock('@/features/ops/api/opsActivityApi', () => ({
  listActivities: vi.fn()
}))
vi.mock('@/features/ops/api/opsAnnouncementApi', () => ({
  listAnnouncements: vi.fn()
}))
vi.mock('@/features/ops/api/opsCompetitionApi', () => ({
  listCompetitions: vi.fn()
}))
vi.mock('@/features/ops/api/opsConsultationApi', () => ({
  listConsultations: vi.fn()
}))
vi.mock('@/features/ops/api/opsGuideApi', () => ({
  listGuides: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

async function mountComponent(
  component: unknown,
  pattern: string,
  url: string,
  meta: Record<string, unknown> = {}
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: pattern, component: component as never, meta }]
  })
  await router.push(url)
  await router.isReady()

  const wrapper = mount(component as never, {
    attachTo: document.body,
    global: {
      plugins: [router, ui],
      stubs: { RouterLink: true, RouterView: true }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-090 平台运营外壳', () => {
  it('操作台展示当前区域标题与紧凑导航', async () => {
    const wrapper = await mountComponent(
      OpsShell,
      '/ops/activities',
      '/ops/activities',
      { title: '校园动态管理' }
    )
    expect(wrapper.text()).toContain('校园动态管理')
    for (const label of ['工作台', '竞赛管理', '校园动态管理', '咨询管理', '指南管理']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('工作台展示真实数据统计卡', async () => {
    vi.mocked(listCompetitions).mockResolvedValue({ items: [], total: 0, page: 1 })
    vi.mocked(listActivities).mockResolvedValue({ items: [], total: 0, page: 1 })
    vi.mocked(listConsultations).mockResolvedValue({ items: [], total: 0, page: 1 })

    const wrapper = await mountComponent(OpsOverviewPage, '/ops', '/ops')
    await flushPromises()
    for (const label of ['报名中的竞赛', '进行中的活动', '待回复咨询', '当前招新']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('校园动态管理：活动/公告独立 tab + 发布动态', async () => {
    vi.mocked(listActivities).mockResolvedValue({
      items: dynamicsActivities,
      total: dynamicsActivities.length,
      page: 1
    })
    vi.mocked(listAnnouncements).mockResolvedValue({
      items: dynamicsAnnouncements,
      total: dynamicsAnnouncements.length,
      page: 1
    })

    const wrapper = await mountComponent(OpsActivitiesPage, '/ops/activities', '/ops/activities')
    await flushPromises()

    expect(wrapper.text()).toContain('发布动态')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')

    const announcementTab = wrapper
      .findAll('button')
      .find(b => b.text() === '公告')
    await announcementTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('人工智能学院科创与就业服务平台正式上线')
  })
})
