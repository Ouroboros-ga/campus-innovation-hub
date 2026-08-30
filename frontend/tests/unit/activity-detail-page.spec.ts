import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ActivityDetailPage from '@/pages/activities/ActivityDetailPage.vue'
import { routes } from '@/router/routes'
import {
  getActivity,
  listAnnouncements
} from '@/features/dynamics/api/dynamicsApi'
import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'

vi.mock('@/features/dynamics/api/dynamicsApi', () => ({
  getActivity: vi.fn(),
  listAnnouncements: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.setSystemTime(new Date('2026-08-25T12:00:00+08:00'))
  vi.mocked(getActivity).mockImplementation(async id => {
    const activity = dynamicsActivities.find(item => item.id === id)
    if (!activity) throw new Error('not found')
    return activity
  })
  vi.mocked(listAnnouncements).mockResolvedValue({
    items: dynamicsAnnouncements,
    total: dynamicsAnnouncements.length,
    page: 1
  })
})

async function mountPage(activityId: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(`/activities/${activityId}`)
  await router.isReady()

  const wrapper = mount(ActivityDetailPage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui, createPinia()]
    }
  })
  mounted.push(wrapper)
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

afterEach(() => {
  vi.useRealTimers()
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-051 活动详情页（FE-104 API 驱动）', () => {
  it('展示面包屑、类型、时间、地点、主办与报名主操作', async () => {
    const wrapper = await mountPage('ai-sharing-4')

    // 桌面面包屑（回退到校园动态）
    expect(wrapper.text()).toContain('校园动态')
    expect(wrapper.text()).toContain('活动')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')
    expect(wrapper.text()).toContain('技术分享')
    expect(wrapper.text()).toContain('人工智能学院报告厅')
    expect(wrapper.text()).toContain('人工智能学院学生会')
    expect(wrapper.text()).toContain('报名参加')
  })

  it('展示关联公告', async () => {
    const wrapper = await mountPage('ai-sharing-4')

    expect(wrapper.text()).toContain('相关公告')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）报名开启')
  })

  it('免报名活动显示「无需报名」且无报名主操作', async () => {
    const wrapper = await mountPage('mcm-briefing-2026')

    expect(wrapper.text()).toContain('无需报名')
    expect(wrapper.text()).not.toContain('报名参加')
  })

  it('未知活动 id 显示未找到与返回入口', async () => {
    const wrapper = await mountPage('does-not-exist')

    expect(wrapper.text()).toContain('未找到该活动')
    expect(wrapper.text()).toContain('返回校园动态')
  })
})
