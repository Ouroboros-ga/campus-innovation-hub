import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listFaqs } from '@/features/ops/api/opsFaqApi'
import type { OpsFaq } from '@/features/ops/faq/types'
import OpsFaqPage from '@/pages/ops/OpsFaqPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsFaqApi', () => ({
  listFaqs: vi.fn(),
  publishFaq: vi.fn()
}))

const RouterHost = defineComponent({ template: '<RouterView />' })
const mounted: VueWrapper[] = []

function faq(overrides: Partial<OpsFaq>): OpsFaq {
  return {
    id: 'f1',
    category: 'COMPETITION',
    question: '如何报名？',
    answerMd: '答案',
    sortOrder: 0,
    isFeatured: false,
    featuredOrder: 0,
    publicationState: 'DRAFT',
    publishedAt: null,
    updatedAt: '2026-08-29T09:00:00+08:00',
    allowedActions: ['EDIT', 'PUBLISH'],
    detailPath: '/qa/faqs#faq-f1',
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

describe('Task5 FAQ 管理列表', () => {
  it('操作按钮完全遵循 allowed_actions，归档项不会错误显示编辑', async () => {
    vi.mocked(listFaqs).mockResolvedValue({
      items: [
        faq({ id: 'draft', question: '草稿问题？' }),
        faq({
          id: 'archived',
          question: '归档问题？',
          publicationState: 'ARCHIVED',
          allowedActions: []
        })
      ],
      total: 2,
      page: 1
    })

    const { wrapper } = await mountWithAppContext(RouterHost, {
      initialRoute: '/ops/faq',
      routes: [
        { path: '/ops/faq', name: 'ops-faq', component: OpsFaqPage },
        { path: '/ops/faq/new', name: 'ops-faq-new', component: defineComponent({ template: '<div />' }) },
        { path: '/ops/faq/:id/edit', name: 'ops-faq-edit', component: defineComponent({ template: '<div />' }) }
      ]
    })
    mounted.push(wrapper)
    await flushPromises()

    const draftRow = wrapper.get('[data-test="faq-row-draft"]')
    expect(draftRow.text()).toContain('编辑')
    expect(draftRow.text()).toContain('发布')
    const archivedRow = wrapper.get('[data-test="faq-row-archived"]')
    expect(archivedRow.text()).toContain('已归档')
    expect(archivedRow.text()).not.toContain('编辑')
    expect(archivedRow.text()).not.toContain('发布')
  })
})
