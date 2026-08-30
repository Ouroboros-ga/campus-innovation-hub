import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getConsultation, listConsultations } from '@/features/ops/api/opsConsultationApi'
import OpsQuestionsPage from '@/pages/ops/OpsQuestionsPage.vue'
import ConsultationTaskPage from '@/pages/ops/ConsultationTaskPage.vue'
import type { ConsultationDetail } from '@/features/ops/consultations/types'
import { useConsultationWorkbench } from '@/features/ops/consultations/useConsultationWorkbench'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsConsultationApi', () => ({ listConsultations: vi.fn(), getConsultation: vi.fn(), replyConsultation: vi.fn(), closeConsultation: vi.fn() }))

const RouterHost = defineComponent({ template: '<RouterView />' })
const MarkdownEditorStub = defineComponent({ template: '<textarea />' })
const WorkbenchHarness = defineComponent({
  setup(_, { expose }) {
    const workbench = useConsultationWorkbench()
    expose({ loadDetail: workbench.loadDetail, detail: workbench.detail })
    return () => h('div')
  }
})
const mounted: VueWrapper[] = []

function detail(id: string, title: string): ConsultationDetail {
  return { id, title, authorName: '李同学', category: 'ACTIVITY', visibility: 'PRIVATE', status: 'OPEN', replyCount: 0, createdAt: '2026-08-20T10:00:00Z', answeredAt: null, allowedActions: ['REPLY', 'CLOSE'], bodyMd: `${title}正文`, competition: null, replies: [], updatedAt: '2026-08-20T10:00:00Z' }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listConsultations).mockResolvedValue({ items: [{ id: 'q1', title: '活动报名如何处理？', authorName: '李同学', category: 'ACTIVITY', visibility: 'PRIVATE', status: 'OPEN', replyCount: 0, createdAt: '2026-08-20T10:00:00Z', answeredAt: null, allowedActions: ['REPLY', 'CLOSE'] }], total: 1 })
  vi.mocked(getConsultation).mockResolvedValue({ id: 'q1', title: '活动报名如何处理？', authorName: '李同学', category: 'ACTIVITY', visibility: 'PRIVATE', status: 'OPEN', replyCount: 0, createdAt: '2026-08-20T10:00:00Z', answeredAt: null, allowedActions: ['REPLY', 'CLOSE'], bodyMd: '我想了解活动报名的后续流程。', competition: null, replies: [], updatedAt: '2026-08-20T10:00:00Z' })
})
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = '' })

describe('Task8 咨询答疑工作台', () => {
  it('保留私密标识，并从队列加载完整咨询详情', async () => {
    const { wrapper } = await mountWithAppContext(RouterHost, {
      initialRoute: '/ops/questions?selected=q1',
      routes: [{ path: '/ops/questions', component: OpsQuestionsPage }, { path: '/ops/questions/:id', name: 'ops-consultation-task', component: defineComponent({ template: '<div />' }) }],
      stubs: { MarkdownEditor: MarkdownEditorStub }
    })
    mounted.push(wrapper)
    await flushPromises()
    expect(wrapper.text()).toContain('私密咨询')
    expect(wrapper.text()).toContain('我想了解活动报名的后续流程。')
    expect(wrapper.text()).toContain('发送正式回复')
    expect(getConsultation).toHaveBeenCalledWith('q1')
  })

  it('快速切换队列时丢弃旧详情响应', async () => {
    let resolveFirst: ((value: ReturnType<typeof detail>) => void) | undefined
    let resolveSecond: ((value: ReturnType<typeof detail>) => void) | undefined
    vi.mocked(getConsultation).mockImplementation(id => new Promise(resolve => {
      if (id === 'q1') resolveFirst = resolve
      else resolveSecond = resolve
    }))
    const { wrapper } = await mountWithAppContext(WorkbenchHarness)
    mounted.push(wrapper)
    const exposed = wrapper.vm as unknown as {
      loadDetail: (id: string) => Promise<ConsultationDetail | null>
      detail: ConsultationDetail | null
    }
    const first = exposed.loadDetail('q1')
    const second = exposed.loadDetail('q2')
    resolveSecond?.(detail('q2', '第二条咨询'))
    await second
    resolveFirst?.(detail('q1', '第一条咨询'))
    await first
    expect(exposed.detail?.title).toBe('第二条咨询')
  })

  it('Phone 队列项直接进入独立任务页', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)', addEventListener: vi.fn(), removeEventListener: vi.fn()
    })))
    const { wrapper, router } = await mountWithAppContext(RouterHost, {
      initialRoute: '/ops/questions',
      routes: [{ path: '/ops/questions', component: OpsQuestionsPage }, { path: '/ops/questions/:id', name: 'ops-consultation-task', component: defineComponent({ template: '<div />' }) }],
      stubs: { MarkdownEditor: MarkdownEditorStub }
    })
    mounted.push(wrapper)
    await flushPromises()
    await wrapper.findAll('button').find(button => button.text().includes('活动报名如何处理'))!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('ops-consultation-task')
    expect(router.currentRoute.value.params.id).toBe('q1')
    vi.unstubAllGlobals()
  })

  it('独立任务页在路由参数变化时加载新的咨询', async () => {
    vi.mocked(getConsultation).mockImplementation(async id => detail(id, id === 'q1' ? '第一条咨询' : '第二条咨询'))
    const { wrapper, router } = await mountWithAppContext(RouterHost, {
      initialRoute: '/ops/questions/q1',
      routes: [{ path: '/ops/questions/:id', name: 'ops-consultation-task', component: ConsultationTaskPage }, { path: '/ops/questions', name: 'ops-questions', component: defineComponent({ template: '<div />' }) }],
      stubs: { MarkdownEditor: MarkdownEditorStub }
    })
    mounted.push(wrapper)
    await flushPromises()
    await router.push({ name: 'ops-consultation-task', params: { id: 'q2' } })
    await flushPromises()
    expect(getConsultation).toHaveBeenCalledWith('q2')
    expect(wrapper.findAll('h2').some(heading => heading.text() === '第二条咨询')).toBe(true)
  })
})
