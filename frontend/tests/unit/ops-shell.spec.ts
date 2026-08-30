import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'

import OpsShell from '@/features/ops/components/OpsShell.vue'
import OpsOverviewPage from '@/pages/ops/OpsOverviewPage.vue'
import OpsActivitiesPage from '@/pages/ops/OpsActivitiesPage.vue'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listAnnouncements } from '@/features/ops/api/opsAnnouncementApi'
import {
  getDynamicsStats,
  getRecentDrafts,
  getWorkbenchStats
} from '@/features/ops/api/opsOverviewApi'
import { dynamicsActivities, dynamicsAnnouncements } from '@/mocks/fixtures/dynamics'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsActivityApi', () => ({
  listActivities: vi.fn()
}))
vi.mock('@/features/ops/api/opsAnnouncementApi', () => ({
  listAnnouncements: vi.fn()
}))
vi.mock('@/features/ops/api/opsGuideApi', () => ({
  listGuides: vi.fn()
}))
vi.mock('@/features/ops/api/opsOverviewApi', () => ({
  getDynamicsStats: vi.fn(),
  getRecentDrafts: vi.fn(),
  getWorkbenchStats: vi.fn()
}))

const mounted: VueWrapper[] = []

beforeEach(() => {
  vi.mocked(getWorkbenchStats).mockResolvedValue({
    pending: { applications: 2, consultations: 3, pending_publish: 4, missing: 0 },
    overview: { total: 20, published: 12, draft: 6, archived: 2 },
    health: { missing_cover: 1, missing_official_url: 2, near_deadline: 3 }
  })
  vi.mocked(getRecentDrafts).mockResolvedValue({ recent: [], drafts: [] })
  vi.mocked(getDynamicsStats).mockResolvedValue({
    total: 8,
    published: 5,
    draft: 2,
    archived: 1,
    cancelled: 0,
    activities: { total: 4, published: 3, draft: 1 },
    announcements: { total: 4, published: 2, draft: 1 }
  })
})

async function mountComponent(
  component: Component,
  pattern: string,
  url: string,
  meta: Record<string, unknown> = {}
) {
  const { wrapper } = await mountWithAppContext(component, {
    initialRoute: url,
    routes: [{ path: pattern, component, meta }],
    stubs: { RouterLink: true, RouterView: true }
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
    for (const label of ['工作台', '竞赛管理', '校园动态', '咨询列表', '指南管理']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('工作台展示真实数据统计卡', async () => {
    const wrapper = await mountComponent(OpsOverviewPage, '/ops', '/ops')
    await flushPromises()
    for (const label of ['待审核申请', '待回复咨询', '内容待发布', '内容待完善']) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('校园动态管理：活动/公告独立 tab + 新建内容', async () => {
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

    expect(wrapper.text()).toContain('新建内容')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')

    const announcementTab = wrapper
      .findAll('button')
      .find(b => b.text() === '公告')
    await announcementTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('人工智能学院科创与就业服务平台正式上线')
  })
})
