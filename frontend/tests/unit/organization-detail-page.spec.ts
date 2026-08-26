import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import OrganizationDetailPage from '@/pages/organizations/OrganizationDetailPage.vue'
import RecruitmentDetailPage from '@/pages/organizations/RecruitmentDetailPage.vue'
import { routes } from '@/router/routes'

// RecruitmentDetailPage 在 setup 中调用 useToast()
vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: vi.fn() })
}))

const mounted: ReturnType<typeof mount>[] = []

async function mountPage(
  component: typeof OrganizationDetailPage | typeof RecruitmentDetailPage,
  path: string
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(component, {
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

describe('FE-041 组织详情页', () => {
  it('渲染身份横幅、信息卡、近期活动与当前招新', async () => {
    const wrapper = await mountPage(OrganizationDetailPage, '/organizations/ai-union')

    // 面包屑 + Identity 横幅
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('社团组织')
    expect(wrapper.text()).toContain('人工智能协会')
    expect(wrapper.text()).toContain('学生社团')
    expect(wrapper.text()).toContain('成立时间')
    expect(wrapper.text()).toContain('成员规模')
    expect(wrapper.text()).toContain('所属学院')
    // 信息卡
    expect(wrapper.text()).toContain('主要方向')
    expect(wrapper.text()).toContain('机器学习')
    expect(wrapper.text()).toContain('指导老师')
    expect(wrapper.text()).toContain('负责人')
    expect(wrapper.text()).toContain('公开联系方式')
    expect(wrapper.text()).toContain('张同学')
    // 近期活动（关联真实活动，标题以 fixtures 为准）
    expect(wrapper.text()).toContain('近期活动')
    expect(wrapper.text()).toContain('AI 前沿技术分享会（第 4 期）')
    // 当前招新（含岗位 + 申请加入）
    expect(wrapper.text()).toContain('当前招新')
    expect(wrapper.text()).toContain('人工智能协会 2026 秋季招新')
    expect(wrapper.text()).toContain('机器学习方向')
    expect(wrapper.text()).toContain('申请加入')
  })

  it('未知组织显示未找到', async () => {
    const wrapper = await mountPage(OrganizationDetailPage, '/organizations/nope')

    expect(wrapper.text()).toContain('未找到该组织')
  })
})

describe('FE-042 招新详情页', () => {
  it('渲染标题、开放阶段、岗位与申请入口', async () => {
    const wrapper = await mountPage(
      RecruitmentDetailPage,
      '/organizations/ai-union/recruitments/ai-union-fall-2026'
    )

    expect(wrapper.text()).toContain('人工智能协会 2026 秋季招新')
    expect(wrapper.text()).toContain('招新中')
    expect(wrapper.text()).toContain('机器学习方向')
    expect(wrapper.text()).toContain('招 12 人')
    expect(wrapper.text()).toContain('申请加入')
    expect(wrapper.text()).toContain('查看组织主页')
  })

  it('未到报名开始时展示尚未开放说明', async () => {
    const wrapper = await mountPage(
      RecruitmentDetailPage,
      '/organizations/robot-lab/recruitments/robot-lab-fall-2026'
    )
    // 该招新 2026-09-01 开始，当前系统日期早于开始 → UPCOMING，不出现「申请加入」
    expect(wrapper.text()).toContain('尚未开放')
    expect(wrapper.text()).not.toContain('申请加入')
  })
})
