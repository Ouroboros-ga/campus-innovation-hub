import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import CompetitionDetailPage from '@/pages/competitions/CompetitionDetailPage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

async function mountDetail(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(CompetitionDetailPage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
    }
  })
  mounted.push(wrapper)

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-021 竞赛详情页', () => {
  it('渲染名称、状态与全部详情区块', async () => {
    const wrapper = await mountDetail('/competitions/csdc-2026')

    expect(wrapper.text()).toContain('中国大学生计算机设计大赛')
    expect(wrapper.text()).toContain('报名中')
    expect(wrapper.text()).toContain('基本信息')
    expect(wrapper.text()).toContain('比赛简介')
    expect(wrapper.text()).toContain('谁适合参加')
    expect(wrapper.text()).toContain('时间线')
    expect(wrapper.text()).toContain('相关通知')
    expect(wrapper.text()).toContain('相关指南')
    expect(wrapper.text()).toContain('正在组队')
  })

  it('提供明显的主任务与返回入口', async () => {
    const wrapper = await mountDetail('/competitions/mcm-2026')

    // 团队赛主任务为「查看组队」
    expect(wrapper.text()).toContain('查看组队')
    expect(wrapper.text()).toContain('返回竞赛列表')
  })

  it('未知竞赛展示未找到态', async () => {
    const wrapper = await mountDetail('/competitions/unknown-id')
    expect(wrapper.text()).toContain('未找到该竞赛')
    expect(wrapper.text()).toContain('返回竞赛列表')
  })
})
