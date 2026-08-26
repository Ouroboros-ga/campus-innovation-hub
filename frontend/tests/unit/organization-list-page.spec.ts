import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import OrganizationListPage from '@/pages/organizations/OrganizationListPage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

async function mountPage(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push({ path: '/organizations', query })
  await router.isReady()

  const wrapper = mount(OrganizationListPage, {
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

describe('FE-040 组织列表页', () => {
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
})
