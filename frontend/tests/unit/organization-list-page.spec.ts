import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import OrganizationListPage from '@/pages/organizations/OrganizationListPage.vue'
import { routes } from '@/router/routes'
import { listOrganizations } from '@/features/organizations/api/organizationApi'
import { organizations } from '@/mocks/fixtures/organizations'

vi.mock('@/features/organizations/api/organizationApi', () => ({
  listOrganizations: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.mocked(listOrganizations).mockResolvedValue({
    items: organizations,
    total: organizations.length,
    page: 1
  })
})

async function mountPage(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // 为「我的组织」种子登录态权限（对应 fixtures/organizations.myOrganizations 前 6 项）
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()
  auth.permissions = {
    organization_memberships: [
      { organization_id: 'ai-union', role: 'LEADER', title: '会长', is_active: true },
      { organization_id: 'data-science-club', role: 'MEMBER', title: '成员', is_active: true },
      { organization_id: 'robot-lab', role: 'LEADER', title: '实验室负责人', is_active: true },
      { organization_id: 'innovation-center', role: 'MEMBER', title: '成员', is_active: true },
      { organization_id: 'sci-employment', role: 'LEADER', title: '部长', is_active: true },
      { organization_id: 'green-public', role: 'MEMBER', title: '成员', is_active: true },
    ],
  } as unknown as typeof auth.permissions
  auth.user = {
    id: 'test-user',
    username: 'test',
    real_name: '测试用户',
    identity_type: 'STUDENT',
    platform_role: 'USER',
    is_superuser: false,
    profile: {},
  } as unknown as typeof auth.user
  auth.status = 'authenticated' as unknown as typeof auth.status
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push({ path: '/organizations', query })
  await router.isReady()

  const wrapper = mount(OrganizationListPage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui, pinia]
    }
  })
  mounted.push(wrapper)
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-040 组织列表页（FE-103 API 驱动）', () => {
  it('渲染页头、筛选组、我的组织与全部组织', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('社团与组织')
    expect(wrapper.text()).toContain('组织类型')
    expect(wrapper.text()).toContain('招新状态')
    expect(wrapper.text()).toContain('我的组织')
    expect(wrapper.text()).toContain('全部组织')
    expect(wrapper.text()).toContain('人工智能协会')
    expect(wrapper.text()).toContain('数据科学社')
    // LEADER 有「进入管理」，MEMBER 无
    expect(wrapper.text()).toContain('进入管理')

    // 「我的组织」区块应位于筛选区（组织类型 / 招新状态）之前
    const html = wrapper.html()
    expect(html.indexOf('my-organizations')).toBeLessThan(html.indexOf('org-filters'))
  })

  it('我的组织默认显示 4 项，可展开与收起', async () => {
    const wrapper = await mountPage()

    const myOrg = wrapper.find('[data-test="my-organizations"]')
    expect(myOrg.text()).toContain('查看全部')
    expect(myOrg.text()).toContain('人工智能协会')
    expect(myOrg.text()).toContain('创新创业中心')
    expect(myOrg.text()).not.toContain('科创与就业部')
    expect(myOrg.text()).not.toContain('绿色公益社')

    const toggle = myOrg
      .findAll('button')
      .find(b => b.text() === '查看全部')
    await toggle!.trigger('click')
    await flushPromises()

    const expanded = wrapper.find('[data-test="my-organizations"]')
    expect(expanded.text()).toContain('收起')
    expect(expanded.text()).toContain('科创与就业部')
    expect(expanded.text()).toContain('绿色公益社')
  })

  it('按招新状态筛选加载对应组织', async () => {
    const wrapper = await mountPage({ status: 'PAUSED' })

    const allOrgs = wrapper.find('[data-test="all-organizations"]')
    expect(allOrgs.text()).toContain('光影工作室')
    expect(allOrgs.text()).toContain('暂停招新')
    // 「我的组织」区不随全局筛选变化，故只断言「全部组织」区
    expect(allOrgs.text()).not.toContain('人工智能协会')
  })

  it('无结果时渲染空状态', async () => {
    const wrapper = await mountPage({ type: 'LABORATORY', status: 'NOT_RECRUITING' })

    expect(wrapper.text()).toContain('没有符合条件的组织')
  })

  it('API 失败时展示可操作的重试', async () => {
    vi.mocked(listOrganizations).mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('组织信息加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })
})
