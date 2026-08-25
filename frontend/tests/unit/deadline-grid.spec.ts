import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DeadlineGrid from '@/features/homepage/components/DeadlineGrid.vue'
import DeadlineText from '@/features/homepage/components/DeadlineText.vue'
import { deadlineItems } from '@/mocks/fixtures/homepage'
import { router } from '@/router'

const NOW = new Date('2026-08-25T12:00:00+08:00')

describe('FE-008 首页截止时间区块', () => {
  it('渲染「即将截止」区块头、查看全部与截止条目', () => {
    const wrapper = mount(DeadlineGrid, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('即将截止')
    expect(wrapper.text()).toContain('查看全部')
    for (const item of deadlineItems) {
      expect(wrapper.text()).toContain(item.title)
    }
  })

  it('未来截止：显示剩余天数且普通样式', () => {
    const wrapper = mount(DeadlineText, {
      props: {
        deadlineAt: '2026-09-04T23:59:59+08:00',
        now: NOW
      },
      global: {
        plugins: [ui]
      }
    })

    expect(wrapper.get('p').text()).toBe('还有 10 天截止')
    expect(wrapper.get('p').classes()).toContain('text-muted')
  })

  it('临近截止：显示剩余天数且使用紧急语义色', () => {
    const wrapper = mount(DeadlineText, {
      props: {
        deadlineAt: '2026-08-27T23:59:59+08:00',
        now: NOW
      },
      global: {
        plugins: [ui]
      }
    })

    expect(wrapper.get('p').text()).toBe('还有 2 天截止')
    expect(wrapper.get('p').classes()).toContain('text-danger-600')
  })

  it('已截止：显示「已截止」且使用中性样式', () => {
    const wrapper = mount(DeadlineText, {
      props: {
        deadlineAt: '2026-08-20T23:59:59+08:00',
        now: NOW
      },
      global: {
        plugins: [ui]
      }
    })

    expect(wrapper.get('p').text()).toBe('已截止')
    expect(wrapper.get('p').classes()).toContain('text-muted')
  })
})
