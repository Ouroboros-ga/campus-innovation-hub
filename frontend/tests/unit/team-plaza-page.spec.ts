import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamPlazaPage from '@/pages/teams/TeamPlazaPage.vue'
import { routes } from '@/router/routes'
import { listTeams } from '@/features/teams/api/teamApi'
import { teamPosts } from '@/mocks/fixtures/teams'

vi.mock('@/features/teams/api/teamApi', () => ({
  listTeams: vi.fn()
}))

const mounted: ReturnType<typeof mount>[] = []

beforeEach(() => {
  vi.mocked(listTeams).mockResolvedValue({
    items: teamPosts,
    total: teamPosts.length,
    page: 1
  })
})

async function mountPage(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push({ path: '/teams', query })
  await router.isReady()

  const wrapper = mount(TeamPlazaPage, {
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

describe('FE-030 组队广场页（FE-102 API 驱动）', () => {
  it('渲染标题、筛选控件与组队卡片（桌面网格）', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('组队广场')
    expect(wrapper.text()).toContain('信息类型')
    expect(wrapper.text()).toContain('全部赛事')

    const cards = wrapper.findAllComponents({ name: 'TeamPostCard' })
    expect(cards.length).toBeGreaterThan(0)
  })

  it('展示发布者、目标说明与岗位信息', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('智能算法突破小队')
    expect(wrapper.text()).toContain('队伍找人')
    expect(wrapper.text()).toContain('招募岗位')
    expect(wrapper.text()).toContain('技能标签')
    expect(wrapper.text()).toContain('目标冲击省赛一等奖')
  })

  it('无结果时渲染空状态', async () => {
    vi.mocked(listTeams).mockResolvedValueOnce({ items: [], total: 0, page: 1 })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('没有符合条件的组队信息')
  })

  it('API 失败时展示可操作的重试', async () => {
    vi.mocked(listTeams).mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('组队信息加载失败')
    expect(wrapper.text()).toContain('重新加载')
  })
})
