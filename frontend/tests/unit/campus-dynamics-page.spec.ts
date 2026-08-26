import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import CampusDynamicsPage from '@/pages/activities/CampusDynamicsPage.vue'
import { routes } from '@/router/routes'
import {
  listActivities,
  listAnnouncements
} from '@/features/dynamics/api/dynamicsApi'
import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'

vi.mock('@/features/dynamics/api/dynamicsApi', () => ({
  listActivities: vi.fn(),
  listAnnouncements: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
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
})

async function mountPage(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push({ path: '/activities', query })
  await router.isReady()

  const wrapper = mount(CampusDynamicsPage, {
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

describe('FE-050 校园动态页（FE-104 API 驱动）', () => {
  it('默认 tab=all 渲染两个独立区块', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('校园动态')
    expect(wrapper.text()).toContain('全部')
    expect(wrapper.text()).toContain('活动')
    expect(wrapper.text()).toContain('公告')
    expect(wrapper.text()).toContain('近期活动')
    expect(wrapper.text()).toContain('最新公告')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')
    expect(wrapper.text()).toContain('人工智能学院科创与就业服务平台正式上线')
  })

  it('tab=activities 渲染筛选控件与活动列表行', async () => {
    const wrapper = await mountPage({ tab: 'activities' })

    expect(wrapper.text()).toContain('全部状态')
    expect(wrapper.text()).toContain('全部类型')
    expect(wrapper.text()).toContain('报名中')
    expect(wrapper.text()).toContain('数学建模竞赛 2026 赛前宣讲会')
  })

  it('tab=announcements 渲染来源筛选与公告列表行', async () => {
    const wrapper = await mountPage({ tab: 'announcements' })

    expect(wrapper.text()).toContain('全部来源')
    expect(wrapper.text()).toContain('学院')
    expect(wrapper.text()).toContain('学校')
    expect(wrapper.text()).toContain('平台')
    expect(wrapper.text()).toContain('关于组织参加 2026 年全国大学生数学建模竞赛的通知')
  })

  it('公告行展示关联对象与站外原文标识', async () => {
    const wrapper = await mountPage({ tab: 'announcements' })

    // 关联对象展示「竞赛」（mcm 公告），站外链接展示「原文」（学校/平台公告）
    expect(wrapper.text()).toContain('竞赛')
    expect(wrapper.text()).toContain('原文')
  })

  it('双端建设：副标语 + 右侧搜索 + 桌面公告表格表头', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('了解学院最新活动与重要公告，参与交流与成长')
    expect(wrapper.text()).toContain('搜索活动、公告、关键词')
    // 桌面公告表格列头
    expect(wrapper.text()).toContain('来源')
    expect(wrapper.text()).toContain('公告标题')
    expect(wrapper.text()).toContain('摘要')
    expect(wrapper.text()).toContain('发布日期')
    expect(wrapper.text()).toContain('关联标签')
  })

  it('移动端：精选活动卡 + 已加载全部内容', async () => {
    const wrapper = await mountPage()

    // 手机端「近期活动」以精选活动卡呈现（isFeatured 的 AI 分享会）
    expect(wrapper.text()).toContain('已加载全部内容')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')
  })

  it('API 失败时展示可操作的重试', async () => {
    vi.mocked(listActivities).mockRejectedValueOnce(new Error('boom'))
    vi.mocked(listAnnouncements).mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('动态信息加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })
})
