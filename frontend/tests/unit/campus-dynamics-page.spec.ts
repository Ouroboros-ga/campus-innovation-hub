import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import CampusDynamicsPage from '@/pages/activities/CampusDynamicsPage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

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
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-050 校园动态页', () => {
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
})
