import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from '@/pages/home/HomePage.vue'
import { getHome, type HomeData } from '@/features/homepage/api/homeApi'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/homepage/api/homeApi', () => ({ getHome: vi.fn() }))

const mounted: VueWrapper[] = []
const homeData: HomeData = {
  banners: [],
  deadlines: [],
  featuredCompetitions: [],
  announcements: [],
  featuredGuides: [],
  teamPosts: [],
  recruitingOrganizations: [],
  activities: [],
  faqs: []
}

beforeEach(() => {
  vi.mocked(getHome).mockResolvedValue(homeData)
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

async function mountHome() {
  const { wrapper } = await mountWithAppContext(HomePage)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('首页', () => {
  it('渲染 Hero 主标题与四个快捷入口', async () => {
    const wrapper = await mountHome()

    expect(wrapper.get('h1').text()).toBe('发现科创机会，成就无限可能')
    expect(wrapper.text()).toContain('找竞赛')
    expect(wrapper.text()).toContain('找队友')
    expect(wrapper.text()).toContain('找组织')
    expect(wrapper.text()).toContain('找活动')
  })

  it('渲染即将截止、热门竞赛、通知公告与热门指南区块标题', async () => {
    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('即将截止')
    expect(wrapper.text()).toContain('热门竞赛')
    expect(wrapper.text()).toContain('通知公告')
    expect(wrapper.text()).toContain('热门指南')
    expect(wrapper.text()).toContain('查看全部')
  })

  it('渲染社区与常见问题区块标题', async () => {
    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('正在组队')
    expect(wrapper.text()).toContain('正在招新的组织')
    expect(wrapper.text()).toContain('近期活动')
    expect(wrapper.text()).toContain('常见问题')
  })

  it('渲染 Hero 左列的「为你推荐」补充块', async () => {
    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('为你推荐')
    expect(wrapper.text()).toContain('重要竞赛')
    expect(wrapper.text()).toContain('热门指南')
  })

  it('不渲染开发主题输入或空占位文案', async () => {
    const wrapper = await mountHome()

    expect(wrapper.find('input[name="theme-input"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('首页其余区块将在后续任务中逐步完善')
  })
})
