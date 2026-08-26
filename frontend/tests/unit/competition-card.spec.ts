import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CompetitionCard from '@/features/homepage/components/CompetitionCard.vue'
import HomeCompetitionSection from '@/features/homepage/components/HomeCompetitionSection.vue'
import { hotCompetitions } from '@/mocks/fixtures/homepage'
import { router } from '@/router'
import type { CompetitionSummary } from '@/shared/types/homepage'

/** 稳定日期卡片：注册窗口覆盖当前时间，保证状态恒为「报名中」。 */
const openCard: CompetitionSummary = {
  id: 'test-open',
  name: '测试稳定开放竞赛',
  edition: '2026',
  category: 'AI',
  level: 'NATIONAL',
  participationMode: 'TEAM',
  registrationStartAt: '2020-01-01T00:00:00+08:00',
  registrationEndAt: '2099-12-31T23:59:59+08:00',
  eventStartAt: null,
  eventEndAt: null,
  officialUrl: 'https://example.com/competition',
  cover: { alt: '测试竞赛封面', src: null },
  detailPath: '/competitions/test-open'
}

describe('FE-009 首页竞赛区块', () => {
  it('渲染竞赛卡片：名称、级别、参赛形式、状态与截止时间', () => {
    const wrapper = mount(CompetitionCard, {
      props: { item: openCard },
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('测试稳定开放竞赛')
    expect(wrapper.text()).toContain('国家级')
    expect(wrapper.text()).toContain('团队赛')
    expect(wrapper.text()).toContain('报名中')
    expect(wrapper.text()).toContain('截止：')
    expect(wrapper.text()).toContain('查看详情')
  })

  it('覆盖当前时间窗口时状态为「报名中」，徽标不超过 3 个', () => {
    const wrapper = mount(CompetitionCard, {
      props: { item: openCard },
      global: {
        plugins: [router, ui]
      }
    })

    // 级别 + 参赛形式 = 2 个语义徽标（无 crossSchool）；状态此时作为文字置入截止行，
    // 不占用徽标位；符合 §21 的不超过 3 个上限。
    const badges = wrapper
      .findAll('[data-slot="base"]')
      .filter(node => node.element.parentElement?.classList.contains('flex-wrap'))
    expect(badges.length).toBe(2)
    expect(wrapper.text()).toContain('报名中')
  })

  it('有官网地址时渲染外链，无官网地址时不渲染外链', () => {
    const withUrl = mount(CompetitionCard, {
      props: { item: openCard },
      global: {
        plugins: [router, ui]
      }
    })
    const link = withUrl.get('a[target="_blank"]')
    expect(link.text()).toContain('官网')
    expect(link.attributes('rel')).toContain('noopener')

    const withoutUrl = mount(CompetitionCard, {
      props: {
        item: { ...openCard, officialUrl: null }
      },
      global: {
        plugins: [router, ui]
      }
    })
    expect(withoutUrl.find('a[target="_blank"]').exists()).toBe(false)
    expect(withoutUrl.text()).toContain('查看详情')
  })

  it('渲染「热门竞赛」区块头、查看全部与竞赛卡片列表', () => {
    const wrapper = mount(HomeCompetitionSection, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('热门竞赛')
    expect(wrapper.text()).toContain('查看全部')
    for (const item of hotCompetitions) {
      expect(wrapper.text()).toContain(item.name)
    }
  })
})
