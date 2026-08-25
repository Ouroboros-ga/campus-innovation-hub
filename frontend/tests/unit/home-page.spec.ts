import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HomePage from '@/pages/home/HomePage.vue'
import { router } from '@/router'

describe('首页', () => {
  it('渲染 Hero 主标题与四个快捷入口', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.get('h1').text()).toBe('发现科创机会，成就无限可能')
    expect(wrapper.text()).toContain('找竞赛')
    expect(wrapper.text()).toContain('找队友')
    expect(wrapper.text()).toContain('找组织')
    expect(wrapper.text()).toContain('找活动')
  })

  it('渲染即将截止、热门竞赛、通知公告与热门指南区块标题', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('即将截止')
    expect(wrapper.text()).toContain('热门竞赛')
    expect(wrapper.text()).toContain('通知公告')
    expect(wrapper.text()).toContain('热门指南')
    expect(wrapper.text()).toContain('查看全部')
  })

  it('渲染社区与常见问题区块标题', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('正在组队')
    expect(wrapper.text()).toContain('正在招新的组织')
    expect(wrapper.text()).toContain('近期活动')
    expect(wrapper.text()).toContain('常见问题')
  })

  it('不渲染开发主题输入或空占位文案', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.find('input[name="theme-input"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('首页其余区块将在后续任务中逐步完善')
  })
})
