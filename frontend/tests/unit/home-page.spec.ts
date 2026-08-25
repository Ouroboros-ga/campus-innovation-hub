import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HomePage from '@/pages/home/HomePage.vue'
import { router } from '@/router'

describe('首页占位', () => {
  it('在 FE-003 后保留干净的产品入口占位', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.get('h1').text()).toBe('科创与就业服务平台')
    expect(wrapper.text()).toContain('首页将在后续任务中逐步完善')
    expect(wrapper.find('input[name="theme-input"]').exists()).toBe(false)
  })
})
