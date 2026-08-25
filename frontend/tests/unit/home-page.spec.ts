import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HomePage from '@/pages/home/HomePage.vue'
import { router } from '@/router'

describe('首页', () => {
  it('渲染首页 Hero 主标题、四个快捷入口，并保留其余区块占位', () => {
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
    expect(wrapper.text()).toContain('首页其余区块将在后续任务中逐步完善')
    expect(wrapper.find('input[name="theme-input"]').exists()).toBe(false)
  })
})
