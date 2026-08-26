import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Component } from 'vue'

import FaqFullListPage from '@/pages/qa/FaqFullListPage.vue'
import GuideDetailPage from '@/pages/qa/GuideDetailPage.vue'
import QuestionDetailPage from '@/pages/qa/QuestionDetailPage.vue'
import ConsultationSubmitPage from '@/pages/qa/ConsultationSubmitPage.vue'

const mounted: ReturnType<typeof mount>[] = []

async function mountAt(pattern: string, url: string, component: Component) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: pattern, component }]
  })
  await router.push(url)
  await router.isReady()

  const wrapper = mount(component, {
    attachTo: document.body,
    global: {
      plugins: [router, ui],
      stubs: {
        RouterLink: true
      }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('咨询详情 / 列表 / 表单页', () => {
  it('FAQ 完整列表渲染问题与面包屑', async () => {
    const wrapper = await mountAt('/qa/faqs', '/qa/faqs', FaqFullListPage)
    // 面包屑（咨询指南 > 常见问题）替代原 H1
    expect(wrapper.text()).toContain('咨询指南')
    expect(wrapper.text()).toContain('常见问题')
    expect(wrapper.text()).toContain('如何报名参加学科竞赛？')
  })

  it('常见问题列表支持分类筛选与分组', async () => {
    const wrapper = await mountAt('/qa/faqs', '/qa/faqs', FaqFullListPage)

    // 分类 chips（含「全部」）
    for (const label of ['全部', '竞赛', '组队', '证书', '其他']) {
      expect(wrapper.text()).toContain(label)
    }
    // 全部：按分类分组，含各分类问题
    expect(wrapper.text()).toContain('如何报名参加学科竞赛？')
    expect(wrapper.text()).toContain('获奖证书何时发放？如何领取？')

    // 点击「证书」分类：仅显示该分类问题
    const certChip = wrapper
      .findAll('button')
      .find(b => b.text() === '证书')
    await certChip!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('获奖证书何时发放？如何领取？')
    expect(wrapper.text()).not.toContain('如何报名参加学科竞赛？')
  })

  it('指南详情渲染面包屑、标题与正文', async () => {
    const wrapper = await mountAt(
      '/qa/guides/:id',
      '/qa/guides/signup-detail',
      GuideDetailPage
    )
    // 桌面面包屑（咨询指南 > 指南）回退路径
    expect(wrapper.text()).toContain('咨询指南')
    expect(wrapper.text()).toContain('指南')
    expect(wrapper.text()).toContain('科创竞赛报名与参赛流程指南')
    expect(wrapper.text()).toContain('从查找竞赛到报名参赛')
  })

  it('指南未找到展示未找到态', async () => {
    const wrapper = await mountAt(
      '/qa/guides/:id',
      '/qa/guides/unknown',
      GuideDetailPage
    )
    expect(wrapper.text()).toContain('未找到该指南')
  })

  it('公开问答详情渲染面包屑、问题与回答', async () => {
    const wrapper = await mountAt(
      '/qa/questions/:id',
      '/qa/questions/lanqiao-both',
      QuestionDetailPage
    )
    // 桌面面包屑（咨询指南 > 问答）回退路径
    expect(wrapper.text()).toContain('咨询指南')
    expect(wrapper.text()).toContain('问答')
    expect(wrapper.text()).toContain('蓝桥杯省赛和国赛可以同时参加吗？')
    expect(wrapper.text()).toContain('已回复')
    expect(wrapper.text()).toContain('可以同时参加')
  })

  it('问答未找到展示未找到态', async () => {
    const wrapper = await mountAt(
      '/qa/questions/:id',
      '/qa/questions/unknown',
      QuestionDetailPage
    )
    expect(wrapper.text()).toContain('未找到该问答')
  })

  it('提交咨询校验必填字段', async () => {
    const wrapper = await mountAt('/qa/submit', '/qa/submit', ConsultationSubmitPage)

    const submitButton = wrapper
      .findAll('button')
      .find(b => b.text().includes('提交咨询'))
    await submitButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('请选择咨询类型')
    expect(wrapper.text()).toContain('请填写标题')
    expect(wrapper.text()).toContain('请填写详细描述')
    expect(wrapper.text()).toContain('请填写联系方式')
  })
})
