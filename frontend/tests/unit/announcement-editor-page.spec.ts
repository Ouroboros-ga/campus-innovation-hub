import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createAnnouncement,
  getAnnouncement,
  publishAnnouncement,
  updateAnnouncement
} from '@/features/ops/api/opsAnnouncementApi'
import type { OpsAnnouncement } from '@/features/ops/announcements/types'
import AnnouncementEditorPage from '@/pages/ops/AnnouncementEditorPage.vue'
import { AppError } from '@/shared/http/types'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsAnnouncementApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/ops/api/opsAnnouncementApi')>()
  return {
    ...original,
    createAnnouncement: vi.fn(),
    getAnnouncement: vi.fn(),
    publishAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn()
  }
})

const MarkdownEditorStub = defineComponent({
  props: { modelValue: { type: String, default: '' }, disabled: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  template: '<textarea data-test="announcement-body-editor" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const RouterHost = defineComponent({ template: '<RouterView />' })
const mounted: VueWrapper[] = []

function announcement(state: OpsAnnouncement['publicationState']): OpsAnnouncement {
  const actions = state === 'DRAFT' ? ['EDIT', 'PUBLISH'] as const : state === 'PUBLISHED' ? ['EDIT', 'ARCHIVE'] as const : [] as const
  return {
    id: 'a1', title: `${state} 公告`, summary: '摘要', bodyMd: '正文', publisherScope: 'ACADEMY', sourceName: '竞赛官网', externalUrl: null,
    isPinned: true, isHomeFeatured: false, homeFeaturedOrder: 0,
    relation: { kind: 'COMPETITION', id: 'c1', title: '蓝桥杯', path: '/competitions/c1' },
    publicationState: state, publishedAt: state === 'PUBLISHED' ? '2026-08-29T08:00:00+08:00' : null,
    createdAt: '2026-08-29T07:00:00+08:00', updatedAt: '2026-08-29T09:00:00+08:00',
    allowedActions: [...actions], detailPath: '/activities/announcements/a1'
  }
}

async function mountEditor(path: string) {
  const { wrapper, router } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/announcements/new', name: 'ops-announcement-new', component: AnnouncementEditorPage },
      { path: '/ops/announcements/:id/edit', name: 'ops-announcement-edit', component: AnnouncementEditorPage },
      { path: '/ops/activities', name: 'ops-activities', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub }
  })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()); globalThis.document.body.innerHTML = '' })

describe('Task5 公告编辑页', () => {
  it('已发布公告显示立即生效的保存动作，并完整呈现关联信息', async () => {
    vi.mocked(getAnnouncement).mockResolvedValue(announcement('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/announcements/a1/edit')

    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.text()).toContain('蓝桥杯')
    expect(wrapper.text()).toContain('保存后立即对学生端生效')
  })

  it('归档公告只读，不显示提交动作', async () => {
    vi.mocked(getAnnouncement).mockResolvedValue(announcement('ARCHIVED'))
    const { wrapper } = await mountEditor('/ops/announcements/a1/edit')

    expect(wrapper.text()).toContain('已归档')
    expect(wrapper.find('[data-test="editor-primary-action"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="announcement-body-editor"]').attributes('disabled')).toBeDefined()
  })

  it('新建并发布只调用一次 atomic create', async () => {
    vi.mocked(createAnnouncement).mockResolvedValue(announcement('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/announcements/new')

    await wrapper.get('input[placeholder="如：竞赛报名时间调整通知"]').setValue('竞赛报名通知')
    await wrapper.get('[data-test="announcement-body-editor"]').setValue('完整公告正文')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(createAnnouncement).toHaveBeenCalledTimes(1)
    expect(createAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ title: '竞赛报名通知', bodyMd: '完整公告正文' }), true)
    expect(publishAnnouncement).not.toHaveBeenCalled()
  })

  it('409 状态冲突后重新加载管理详情', async () => {
    vi.mocked(getAnnouncement).mockResolvedValueOnce(announcement('PUBLISHED')).mockResolvedValueOnce({ ...announcement('ARCHIVED'), title: '服务器最新公告' })
    vi.mocked(updateAnnouncement).mockRejectedValue(new AppError('状态已变化', { status: 409, code: 'INVALID_STATE' }))
    const { wrapper } = await mountEditor('/ops/announcements/a1/edit')

    await wrapper.get('input[placeholder="如：竞赛报名时间调整通知"]').setValue('本地修改')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(getAnnouncement).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('服务器最新公告')
    expect(wrapper.text()).toContain('已归档')
  })
})
