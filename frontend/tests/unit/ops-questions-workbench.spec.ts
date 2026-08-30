import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getConsultation, listConsultations } from '@/features/ops/api/opsConsultationApi'
import OpsQuestionsPage from '@/pages/ops/OpsQuestionsPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsConsultationApi', () => ({ listConsultations: vi.fn(), getConsultation: vi.fn(), replyConsultation: vi.fn(), closeConsultation: vi.fn() }))

const RouterHost = defineComponent({ template: '<RouterView />' })
const MarkdownEditorStub = defineComponent({ template: '<textarea />' })
const mounted: VueWrapper[] = []

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
})
