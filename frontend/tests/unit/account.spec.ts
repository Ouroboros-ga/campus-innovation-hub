import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Component } from 'vue'

import AccountOverviewPage from '@/pages/me/AccountOverviewPage.vue'
import AccountFollowsPage from '@/pages/me/AccountFollowsPage.vue'
import AccountApplicationsPage from '@/pages/me/AccountApplicationsPage.vue'
import { follows, applications } from '@/features/account/lib/account'
import { accountGames, accountApplications } from '@/mocks/fixtures/account'
import { useAuthStore } from '@/stores/auth'
import { mountWithAppContext } from '../utils/mountWithAppContext'

const mounted: VueWrapper[] = []

async function mountComponent(component: Component, pattern: string, url: string) {
  const { wrapper } = await mountWithAppContext(component, {
    initialRoute: url,
    routes: [{ path: pattern, component }],
    stubs: { RouterLink: true },
    beforeMount: () => {
      const auth = useAuthStore()
      auth.status = 'authenticated'
      auth.user = {
        id: 'student-1',
        username: 'student',
        identity_type: 'STUDENT',
        student_no: '20260001',
        employee_no: null,
        real_name: '张同学',
        platform_role: 'USER',
        is_superuser: false,
        profile: {
          nickname: '张同学',
          major: '人工智能',
          grade: 2023,
          bio: '关注人工智能与科创实践',
          skills: ['Python']
        }
      }
      auth.permissions = { platform_role: 'USER', organization_memberships: [] }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

beforeEach(() => {
  // 重置可变 fixtures（避免跨用例污染）
  follows.splice(0, follows.length, ...accountGames)
  applications.splice(0, applications.length, ...accountApplications)
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-070 账号外壳', () => {
  it('个人中心概览展示资料摘要与区块入口', async () => {
    const wrapper = await mountComponent(
      AccountOverviewPage,
      '/me',
      '/me'
    )
    expect(wrapper.text()).toContain('张同学')
    expect(wrapper.text()).toContain('个人资料')
    expect(wrapper.text()).toContain('我的关注')
    expect(wrapper.text()).toContain('我的组队')
    expect(wrapper.text()).toContain('我的申请')
    expect(wrapper.text()).toContain('我的活动')
    expect(wrapper.text()).toContain('我的咨询')
    expect(wrapper.text()).toContain('账号设置')
    // 组织身份不在账号页
    expect(wrapper.text()).not.toContain('我的组织')
  })

  it('我的关注支持取消关注', async () => {
    const wrapper = await mountComponent(
      AccountFollowsPage,
      '/me/follows',
      '/me/follows'
    )
    expect(wrapper.text()).toContain('蓝桥杯全国软件和信息技术专业人才大赛')

    const beforeCount = wrapper.findAll('li').length
    // 点击该竞赛所在行的取消关注按钮（而非固定第一项，避免 fixtures 顺序变更导致失败）
    const targetRow = wrapper
      .findAll('li')
      .find(li => li.text().includes('蓝桥杯全国软件和信息技术专业人才大赛'))
    const cancel = targetRow
      ?.findAll('button')
      .find(b => b.text() === '取消关注')
    expect(cancel).toBeTruthy()
    await cancel!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('li').length).toBe(beforeCount - 1)
    expect(wrapper.text()).not.toContain('蓝桥杯全国软件和信息技术专业人才大赛 2024')
  })

  it('我的申请支持撤回待处理申请', async () => {
    const wrapper = await mountComponent(
      AccountApplicationsPage,
      '/me/applications',
      '/me/applications'
    )
    expect(wrapper.text()).toContain('待处理')

    const withdraw = wrapper
      .findAll('button')
      .find(b => b.text() === '撤回申请')
    await withdraw!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('已撤回')
  })
})
