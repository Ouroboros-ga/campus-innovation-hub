import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ActivityList from '@/features/homepage/components/ActivityList.vue'
import FaqList from '@/features/homepage/components/FaqList.vue'
import OrganizationRecruitmentList from '@/features/homepage/components/OrganizationRecruitmentList.vue'
import TeamRecruitmentList from '@/features/homepage/components/TeamRecruitmentList.vue'
import { router } from '@/router'

describe('FE-011 首页社区区块', () => {
  it('正在组队：以列表呈现标题 / 关联竞赛 / 人数 / 岗位 / 招募状态', () => {
    const wrapper = mount(TeamRecruitmentList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('正在组队')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.find('article').exists()).toBe(false)

    expect(wrapper.text()).toContain('组队，缺编程手')
    expect(wrapper.text()).toContain('全国大学生数学建模竞赛 2026')
    expect(wrapper.text()).toContain('2/3 人')
    expect(wrapper.text()).toContain('编程手')
    expect(wrapper.text()).toContain('招募中')
  })

  it('正在招新的组织：以列表呈现名称 / 类型 / 岗位概览 / 招新状态 / 截止时间', () => {
    const wrapper = mount(OrganizationRecruitmentList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('正在招新的组织')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)

    expect(wrapper.text()).toContain('人工智能学院学生会')
    expect(wrapper.text()).toContain('学生社团')
    expect(wrapper.text()).toContain('招新中')
    expect(wrapper.text()).toContain('报名截止')
  })

  it('近期活动：以列表呈现名称 / 类型 / 时间 / 地点 / 报名状态', () => {
    const wrapper = mount(ActivityList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('近期活动')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)

    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')
    expect(wrapper.text()).toContain('技术分享')
    expect(wrapper.text()).toContain('人工智能学院报告厅')
    // 免报名活动恒为「无需报名」，不依赖运行时间
    expect(wrapper.text()).toContain('无需报名')
  })

  it('常见问题：以列表呈现问题标题与分类，无虚构回答数', () => {
    const wrapper = mount(FaqList, {
      global: {
        plugins: [router, ui]
      }
    })

    expect(wrapper.text()).toContain('常见问题')
    expect(wrapper.text()).toContain('查看全部')
    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.find('article').exists()).toBe(false)

    expect(wrapper.text()).toContain('如何报名参加一项竞赛？')
    expect(wrapper.text()).toContain('竞赛')
    expect(wrapper.text()).not.toMatch(/\d+(\.\d+)?\s*(万|k|K)/)
  })
})
