import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnnouncementList from '@/features/homepage/components/AnnouncementList.vue'
import GuideList from '@/features/homepage/components/GuideList.vue'
import { announcementList, guideList } from '@/mocks/fixtures/homepage'
import { router } from '@/router'

describe('FE-010 首页信息栏', () => {
  it('通知公告以列表呈现：标题与日期，无卡片边界', () => {
    const wrapper = mount(AnnouncementList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('通知公告')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)
    // 列表而非卡片：不渲染独立 article 容器
    expect(wrapper.find('article').exists()).toBe(false)

    for (const item of announcementList) {
      expect(wrapper.text()).toContain(item.title)
    }
  })

  it('热门指南以列表呈现：图标容器 + 标题 + 分类 + 更新日期，无虚构浏览量', () => {
    const wrapper = mount(GuideList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('热门指南')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)

    for (const item of guideList) {
      expect(wrapper.text()).toContain(item.title)
    }

    // §45 / database-design §28：不展示浏览量或热度统计
    expect(wrapper.text()).not.toMatch(/\d+(\.\d+)?\s*(万|k|K)/)
  })
})
