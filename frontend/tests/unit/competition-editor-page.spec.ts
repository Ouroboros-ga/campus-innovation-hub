import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCompetition, getCompetition, updateCompetition } from '@/features/ops/api/opsCompetitionApi'
import type { OpsCompetition } from '@/features/ops/competitions/types'
import CompetitionEditorPage from '@/pages/ops/CompetitionEditorPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsCompetitionApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/ops/api/opsCompetitionApi')>()
  return { ...original, createCompetition: vi.fn(), getCompetition: vi.fn(), updateCompetition: vi.fn() }
})

const RouterHost = defineComponent({ template: '<RouterView />' })
const MarkdownEditorStub = defineComponent({
  props: { modelValue: { type: String, default: '' } }, emits: ['update:modelValue'],
  template: '<textarea data-test="competition-markdown" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const mounted: VueWrapper[] = []

function competition(state: OpsCompetition['publicationState']): OpsCompetition {
  return {
    id: 'c1', name: '蓝桥杯', edition: '2026', category: 'AI', level: 'NATIONAL', participationMode: 'TEAM',
    descriptionMd: '正文', collegeOrganized: true, registrationStartAt: null, registrationEndAt: null,
    eventStartAt: null, eventEndAt: null, officialUrl: null, registrationUrl: null, officialNoticeUrl: null,
    cover: null, suitableGradeMin: null, suitableGradeMax: null, direction: null, summary: null,
    suitableForMd: null, preparationAdviceMd: null, collegeContactName: null, collegeContactText: null,
    timeline: [], publicationState: state, publishedAt: null, isFeatured: false, featuredOrder: 0,
    createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-02T00:00:00Z',
    allowedActions: state === 'PUBLISHED' ? ['EDIT', 'ARCHIVE'] : ['EDIT', 'PUBLISH', 'DELETE_DRAFT'],
    detailPath: '/competitions/c1'
  }
}

async function mountEditor(path: string) {
  const { wrapper } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/competitions/new', name: 'ops-competition-new', component: CompetitionEditorPage },
      { path: '/ops/competitions/:id/edit', name: 'ops-competition-edit', component: CompetitionEditorPage },
      { path: '/ops/competitions', name: 'ops-competitions', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub, CoverUpload: true }
  })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = '' })

describe('Task6 竞赛编辑任务', () => {
  it('已发布竞赛显示立即生效的保存动作', async () => {
    vi.mocked(getCompetition).mockResolvedValue(competition('PUBLISHED'))
    const wrapper = await mountEditor('/ops/competitions/c1/edit')
    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.text()).toContain('保存后立即对学生端生效')
  })

  it('新建发布只执行一次 createCompetition(publish=true)', async () => {
    vi.mocked(createCompetition).mockResolvedValue(competition('PUBLISHED'))
    const wrapper = await mountEditor('/ops/competitions/new')
    await wrapper.get('input[placeholder="如：蓝桥杯全国软件和信息技术专业人才大赛"]').setValue('蓝桥杯')
    await wrapper.get('input[placeholder="如：第十七届"]').setValue('2026')
    await wrapper.get('[data-test="competition-markdown"]').setValue('正文')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()
    expect(createCompetition).toHaveBeenCalledWith(expect.objectContaining({ name: '蓝桥杯', edition: '2026' }), true)
    expect(updateCompetition).not.toHaveBeenCalled()
  })
})
