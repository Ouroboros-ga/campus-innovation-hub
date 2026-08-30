import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CompetitionDetailPage from '@/pages/competitions/CompetitionDetailPage.vue'
import { routes } from '@/router/routes'
import { getCompetition } from '@/features/competitions/api/competitionApi'
import { competitionDetails } from '@/mocks/fixtures/competitions-detail'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/competitions/api/competitionApi', () => ({
  getCompetition: vi.fn()
}))

const mounted: VueWrapper[] = []

beforeEach(() => {
  vi.mocked(getCompetition).mockImplementation(async id => {
    const detail = competitionDetails[id]
    if (!detail) throw new Error('not found')
    return detail
  })
})

async function mountDetail(path: string) {
  const { wrapper } = await mountWithAppContext(CompetitionDetailPage, {
    initialRoute: path,
    routes
  })
  mounted.push(wrapper)

  await flushPromises()

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-101 竞赛详情页（API 驱动）', () => {
  it('渲染名称、状态与全部详情区块', async () => {
    const wrapper = await mountDetail('/competitions/csdc-2026')

    expect(wrapper.text()).toContain('中国大学生计算机设计大赛')
    expect(wrapper.text()).toContain('报名中')
    expect(wrapper.text()).toContain('赛事介绍')
    expect(wrapper.text()).toContain('参赛要求 / 基本信息')
    expect(wrapper.text()).toContain('关键时间')
    expect(wrapper.text()).toContain('报名方式与提示')
    expect(wrapper.text()).toContain('相关通知')
    expect(wrapper.text()).toContain('相关指南')
    expect(wrapper.text()).toContain('组队信息')
  })

  it('提供明显的主任务「立即报名」与返回入口', async () => {
    const wrapper = await mountDetail('/competitions/mcm-2026')

    expect(wrapper.text()).toContain('立即报名')
    expect(wrapper.text()).toContain('竞赛详情')
  })

  it('渲染「适合谁参加」与「官方链接」区块', async () => {
    const wrapper = await mountDetail('/competitions/lanqiao-2026')

    expect(wrapper.text()).toContain('适合谁参加')
    expect(wrapper.text()).toContain('官方链接')
    expect(wrapper.text()).toContain('蓝桥杯官方网站')
  })

  it('未知竞赛展示未找到态', async () => {
    const wrapper = await mountDetail('/competitions/unknown-id')
    expect(wrapper.text()).toContain('未找到该竞赛')
    expect(wrapper.text()).toContain('返回竞赛列表')
  })
})
