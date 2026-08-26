import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamDetailPage from '@/pages/teams/TeamDetailPage.vue'
import { routes } from '@/router/routes'
import { getTeam } from '@/features/teams/api/teamApi'
import { teamDetails } from '@/mocks/fixtures/teams'

vi.mock('@/features/teams/api/teamApi', () => ({
  getTeam: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.mocked(getTeam).mockImplementation(async id => {
    const detail = teamDetails[id]
    if (!detail) throw new Error('not found')
    return { ...detail, myApplicationState: null }
  })
})

async function mountDetail(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(TeamDetailPage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
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

describe('FE-031 组队详情页（FE-102 API 驱动）', () => {
  it('渲染标题与全部详情区块，非本人提供「申请加入」', async () => {
    const wrapper = await mountDetail('/teams/team-algo-01')

    expect(wrapper.text()).toContain('智能算法突破小队')
    expect(wrapper.text()).toContain('项目 / 方向')
    expect(wrapper.text()).toContain('队伍人数')
    expect(wrapper.text()).toContain('预计投入')
    expect(wrapper.text()).toContain('队伍目标')
    expect(wrapper.text()).toContain('已有成员情况')
    expect(wrapper.text()).toContain('正在招募')
    expect(wrapper.text()).toContain('技能要求')
    expect(wrapper.text()).toContain('发布者公开资料')
    expect(wrapper.text()).toContain('申请加入')
  })

  it('本人发布者提供「编辑 / 查看申请 / 关闭招募」而非申请加入', async () => {
    const wrapper = await mountDetail('/teams/team-acm-06')

    expect(wrapper.text()).toContain('我发布的')
    expect(wrapper.text()).toContain('编辑')
    expect(wrapper.text()).toContain('查看申请')
    expect(wrapper.text()).toContain('关闭招募')
    expect(wrapper.text()).not.toContain('申请加入')
  })

  it('未知队伍展示未找到态', async () => {
    const wrapper = await mountDetail('/teams/unknown-id')
    expect(wrapper.text()).toContain('未找到该组队信息')
    expect(wrapper.text()).toContain('返回组队广场')
  })
})
