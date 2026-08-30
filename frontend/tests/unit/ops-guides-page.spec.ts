import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { listGuides } from '@/features/ops/api/opsGuideApi'
import type { GuideAllowedAction, GuidePublicationState, OpsGuide } from '@/features/ops/guides/types'
import OpsGuidesPage from '@/pages/ops/OpsGuidesPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsGuideApi', () => ({ listGuides: vi.fn() }))

const mounted: VueWrapper[] = []

function item(
  id: string,
  state: GuidePublicationState,
  actions: GuideAllowedAction[]
): OpsGuide {
  return {
    id,
    title: `${state} 指南`,
    category: 'COMPETITION',
    summary: null,
    bodyMd: '正文',
    competitionIds: [],
    relatedCompetitions: [],
    isFeatured: false,
    featuredOrder: 0,
    publicationState: state,
    publishedAt: state === 'PUBLISHED' ? '2026-08-29T08:00:00+08:00' : null,
    updatedAt: '2026-08-29T09:00:00+08:00',
    allowedActions: actions,
    detailPath: `/qa/guides/${id}`
  }
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('Task4 指南管理列表', () => {
  it('状态与编辑入口完全服从 publicationState / allowedActions', async () => {
    vi.mocked(listGuides).mockResolvedValue({
      items: [
        item('draft', 'DRAFT', ['EDIT', 'PUBLISH']),
        item('published', 'PUBLISHED', ['EDIT', 'ARCHIVE']),
        item('archived', 'ARCHIVED', [])
      ],
      total: 3,
      page: 1
    })
    const { wrapper } = await mountWithAppContext(OpsGuidesPage, {
      initialRoute: '/ops/guides',
      routes: [
        { path: '/ops/guides', name: 'ops-guides', component: OpsGuidesPage },
        { path: '/ops/guides/new', name: 'ops-guide-new', component: defineComponent({ template: '<div />' }) },
        { path: '/ops/guides/:id/edit', name: 'ops-guide-edit', component: defineComponent({ template: '<div />' }) },
        { path: '/qa/guides/:id', component: defineComponent({ template: '<div />' }) }
      ]
    })
    mounted.push(wrapper)
    await flushPromises()

    const rows = wrapper.findAll('[data-test="guide-row"]')
    expect(rows).toHaveLength(3)
    const draftRow = rows[0]!
    const publishedRow = rows[1]!
    const archivedRow = rows[2]!
    expect(draftRow.text()).toContain('草稿')
    expect(publishedRow.text()).toContain('已发布')
    expect(archivedRow.text()).toContain('已归档')
    expect(draftRow.text()).toContain('编辑')
    expect(publishedRow.text()).toContain('编辑')
    expect(archivedRow.text()).not.toContain('编辑')
    expect(draftRow.text()).not.toContain('查看学生端')
    expect(publishedRow.text()).toContain('查看学生端')
  })
})
