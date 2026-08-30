import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createActivity, createActivityWithAnnouncement, getActivity } from '@/features/ops/api/opsActivityApi'
import type { OpsActivity } from '@/features/ops/activities/types'
import ActivityEditorPage from '@/pages/ops/ActivityEditorPage.vue'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsActivityApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/ops/api/opsActivityApi')>()
  return { ...original, createActivity: vi.fn(), createActivityWithAnnouncement: vi.fn(), getActivity: vi.fn() }
})

const RouterHost = defineComponent({ template: '<RouterView />' })
const MarkdownEditorStub = defineComponent({
  props: { modelValue: { type: String, default: '' } }, emits: ['update:modelValue'],
  template: '<textarea data-test="activity-markdown" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const mounted: VueWrapper[] = []

function activity(state: OpsActivity['publicationState']): OpsActivity {
  return {
    id: 'a1', title: '技术分享', activityType: 'TECH_SHARING', summary: null, organizerName: null,
    organizerOrganizationId: null, speaker: null, location: '报告厅', startAt: '2026-09-10T10:00:00Z',
    endAt: null, registrationRequired: false, registrationStartAt: null, registrationEndAt: null, capacity: null,
    descriptionMd: '正文', notesMd: null, isFeatured: false, publicationState: state, publishedAt: null,
    createdAt: null, updatedAt: null, allowedActions: state === 'PUBLISHED' ? ['EDIT', 'ARCHIVE'] : ['EDIT', 'PUBLISH'],
    cover: null, detailPath: '/activities/a1'
  }
}

async function mountEditor(path: string) {
  const { wrapper } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/activities/new', name: 'ops-activity-new', component: ActivityEditorPage },
      { path: '/ops/activities/:id/edit', name: 'ops-activity-edit', component: ActivityEditorPage },
      { path: '/ops/activities', name: 'ops-activities', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub, CoverUpload: true }
  })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = '' })

describe('Task6 活动编辑任务', () => {
  it('已发布活动显示立即生效的保存动作', async () => {
    vi.mocked(getActivity).mockResolvedValue(activity('PUBLISHED'))
    const wrapper = await mountEditor('/ops/activities/a1/edit')
    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存更新')
  })

  it('携带公告的新建发布只调用组合事务 endpoint', async () => {
    vi.mocked(createActivityWithAnnouncement).mockResolvedValue({ activity: activity('PUBLISHED') })
    const wrapper = await mountEditor('/ops/activities/new?withAnnouncement=1')
    await wrapper.get('input[placeholder="如：AI 前沿技术分享会"]').setValue('技术分享')
    await wrapper.get('input[placeholder="如：信息楼报告厅"]').setValue('报告厅')
    await wrapper.get('input[type="datetime-local"]').setValue('2026-09-10T10:00')
    await wrapper.get('[data-test="activity-markdown"]').setValue('正文')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()
    expect(createActivityWithAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ title: '技术分享' }), expect.any(Object), true)
    expect(createActivity).not.toHaveBeenCalled()
  })
})
