import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import AnnouncementDetailPage from '@/pages/activities/AnnouncementDetailPage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

async function mountPage(announcementId: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(`/activities/announcements/${announcementId}`)
  await router.isReady()

  const wrapper = mount(AnnouncementDetailPage, {
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

describe('FE-052 公告详情页', () => {
  it('展示面包屑、来源、标题、正文与关联对象', async () => {
    const wrapper = await mountPage('announcement-mcm-2026')

    // 桌面面包屑（回退到校园动态）
    expect(wrapper.text()).toContain('校园动态')
    expect(wrapper.text()).toContain('公告')
    expect(wrapper.text()).toContain('学院公告')
    expect(wrapper.text()).toContain('关于组织参加 2026 年全国大学生数学建模竞赛的通知')
    expect(wrapper.text()).toContain('公告内容')
    expect(wrapper.text()).toContain('关联对象')
    expect(wrapper.text()).toContain('前往相关竞赛')
  })

  it('存在站外原文链接时显示「查看原文」', async () => {
    const wrapper = await mountPage('announcement-university-policy')

    expect(wrapper.text()).toContain('学校公告')
    expect(wrapper.text()).toContain('查看原文')
  })

  it('未知公告 id 显示未找到与返回入口', async () => {
    const wrapper = await mountPage('does-not-exist')

    expect(wrapper.text()).toContain('未找到该公告')
    expect(wrapper.text()).toContain('返回校园动态')
  })
})
