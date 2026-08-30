import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createManageRecruitment,
  getManageRecruitment,
  updateManageRecruitment
} from '@/features/organizations/api/orgManageApi'
import type { ManageRecruitment } from '@/features/organizations/api/orgManageApi'
import RecruitmentEditorPage from '@/pages/manage/RecruitmentEditorPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/organizations/api/orgManageApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/organizations/api/orgManageApi')>()
  return {
    ...original,
    createManageRecruitment: vi.fn(),
    getManageRecruitment: vi.fn(),
    updateManageRecruitment: vi.fn(),
    publishManageRecruitment: vi.fn()
  }
})

const RouterHost = defineComponent({ template: '<RouterView />' })
const MarkdownEditorStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  template: '<textarea data-test="recruitment-markdown" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const mounted: VueWrapper[] = []

function recruitment(state: 'DRAFT' | 'PUBLISHED'): ManageRecruitment {
  return {
    id: 'r1', title: '人工智能协会秋招', introMd: '介绍', applyStartAt: null, applyEndAt: '2026-09-10T10:00:00Z',
    targetGradeMin: null, targetGradeMax: null, notesMd: null, publicationState: state, publishedAt: state === 'PUBLISHED' ? '2026-09-01T10:00:00Z' : null,
    allowedActions: state === 'PUBLISHED' ? ['EDIT', 'CANCEL', 'COMPLETE', 'ARCHIVE'] : ['EDIT', 'PUBLISH', 'DELETE_DRAFT'],
    completedAt: null,
    positions: [{ id: 'position-1', name: '算法组', headcount: 3, description: '训练模型', requirements: 'Python' }],
    applicationCounts: { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 }
  }
}

async function mountEditor(path: string) {
  const { wrapper, router } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/manage/organizations/:organizationId/recruitments/new', name: 'org-manage-recruitment-new', component: RecruitmentEditorPage },
      { path: '/manage/organizations/:organizationId/recruitments/:recruitmentId/edit', name: 'org-manage-recruitment-edit', component: RecruitmentEditorPage },
      { path: '/manage/organizations/:organizationId/recruitments', name: 'org-manage-recruitments', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub }
  })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = '' })

describe('Task7 招新编辑任务', () => {
  it('已发布招新显示保存更新，并完整回填岗位', async () => {
    vi.mocked(getManageRecruitment).mockResolvedValue(recruitment('PUBLISHED'))
    const { wrapper } = await mountEditor('/manage/organizations/org-1/recruitments/r1/edit')
    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.get('input').element.value).toBe('人工智能协会秋招')
    expect(wrapper.text()).toContain('算法组')
  })

  it('新建发布只发出一个携带 publish=true 的 create 请求', async () => {
    vi.mocked(createManageRecruitment).mockResolvedValue(recruitment('PUBLISHED'))
    const { wrapper } = await mountEditor('/manage/organizations/org-1/recruitments/new')
    await wrapper.get('[data-test="recruitment-title"]').setValue('人工智能协会秋招')
    await wrapper.get('[data-test="recruitment-apply-end"]').setValue('2026-09-10T10:00')
    await wrapper.get('[data-test="recruitment-markdown"]').setValue('介绍')
    await wrapper.get('[data-test="recruitment-position-name"]').setValue('算法组')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()
    expect(createManageRecruitment).toHaveBeenCalledWith('org-1', expect.objectContaining({ title: '人工智能协会秋招', publish: true }))
    expect(updateManageRecruitment).not.toHaveBeenCalled()
  })

  it('组织路由切换后重新加载目标组织的招新', async () => {
    vi.mocked(getManageRecruitment).mockImplementation(async organizationId => ({
      ...recruitment('DRAFT'), title: organizationId === 'org-1' ? '组织一招新' : '组织二招新'
    }))
    const { wrapper, router } = await mountEditor('/manage/organizations/org-1/recruitments/r1/edit')
    expect(wrapper.get('input').element.value).toBe('组织一招新')
    await router.push('/manage/organizations/org-2/recruitments/r1/edit')
    await flushPromises()
    expect(getManageRecruitment).toHaveBeenCalledWith('org-2', 'r1', expect.any(AbortSignal))
    expect(wrapper.get('input').element.value).toBe('组织二招新')
  })
})
