import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createGuide,
  getGuide,
  publishGuide,
  updateGuide
} from '@/features/ops/api/opsGuideApi'
import { listCompetitions } from '@/features/ops/api/opsCompetitionApi'
import type { OpsGuide } from '@/features/ops/guides/types'
import GuideEditorPage from '@/pages/ops/GuideEditorPage.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import { AppError } from '@/shared/http/types'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsGuideApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/ops/api/opsGuideApi')>()
  return {
    ...original,
    createGuide: vi.fn(),
    getGuide: vi.fn(),
    publishGuide: vi.fn(),
    updateGuide: vi.fn()
  }
})

vi.mock('@/features/ops/api/opsCompetitionApi', () => ({
  listCompetitions: vi.fn()
}))

const MarkdownEditorStub = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  template: '<textarea data-test="body-editor" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const RouterHost = defineComponent({ template: '<RouterView />' })

const mounted: VueWrapper[] = []

function guide(state: OpsGuide['publicationState']): OpsGuide {
  const actions = state === 'DRAFT'
    ? ['EDIT', 'PUBLISH'] as const
    : state === 'PUBLISHED'
      ? ['EDIT', 'ARCHIVE', 'FEATURE'] as const
      : [] as const
  return {
    id: 'g1',
    title: `${state} 指南`,
    category: 'COMPETITION',
    summary: '摘要',
    bodyMd: '正文',
    competitionIds: ['c1'],
    relatedCompetitions: [{ id: 'c1', title: '蓝桥杯' }],
    isFeatured: state === 'PUBLISHED',
    featuredOrder: 2,
    publicationState: state,
    publishedAt: state === 'PUBLISHED' ? '2026-08-29T08:00:00+08:00' : null,
    updatedAt: '2026-08-29T09:00:00+08:00',
    allowedActions: [...actions],
    detailPath: '/qa/guides/g1'
  }
}

async function mountEditor(path: string) {
  const { wrapper, router } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/guides/new', name: 'ops-guide-new', component: GuideEditorPage },
      { path: '/ops/guides/:id/edit', name: 'ops-guide-edit', component: GuideEditorPage },
      { path: '/ops/guides', name: 'ops-guides', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub }
  })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listCompetitions).mockResolvedValue({ items: [], total: 0, page: 1 })
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('Task4 指南编辑页', () => {
  it.each([
    ['DRAFT', '草稿', '发布', true],
    ['PUBLISHED', '已发布', '保存更新', false],
    ['ARCHIVED', '已归档', null, false]
  ] as const)('%s 状态只展示后端允许的编辑动作', async (state, statusLabel, primary, hasDraftAction) => {
    vi.mocked(getGuide).mockResolvedValue(guide(state))

    const { wrapper } = await mountEditor('/ops/guides/g1/edit')

    expect(wrapper.text()).toContain(statusLabel)
    expect(wrapper.text().includes('保存草稿')).toBe(hasDraftAction)
    const primaryAction = wrapper.find('[data-test="editor-primary-action"]')
    expect(primaryAction.exists()).toBe(primary !== null)
    if (primary) expect(primaryAction.text()).toContain(primary)
    if (state === 'PUBLISHED') expect(wrapper.text()).toContain('保存后立即对学生生效')
    if (state === 'ARCHIVED') {
      expect(wrapper.text()).toContain('不可编辑')
      expect(wrapper.get('[data-test="body-editor"]').attributes('disabled')).toBeDefined()
    }
  })

  it('草稿只有 PUBLISH 权限时可直接发布，不发送无权的 PATCH', async () => {
    const publishOnly = {
      ...guide('DRAFT'),
      allowedActions: ['PUBLISH'] as OpsGuide['allowedActions']
    }
    vi.mocked(getGuide)
      .mockResolvedValueOnce(publishOnly)
      .mockResolvedValueOnce(guide('PUBLISHED'))
    vi.mocked(publishGuide).mockResolvedValue(undefined)
    const { wrapper } = await mountEditor('/ops/guides/g1/edit')

    const primary = wrapper.get('[data-test="editor-primary-action"]')
    expect(primary.attributes('disabled')).toBeUndefined()
    await primary.trigger('click')
    await flushPromises()

    expect(updateGuide).not.toHaveBeenCalled()
    expect(publishGuide).toHaveBeenCalledWith('g1')
  })

  it('新建并发布只调用一次 atomic create，不再追加 publish 请求', async () => {
    vi.mocked(createGuide).mockResolvedValue(guide('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/guides/new')

    await wrapper.get('input[placeholder*="组队与协作"]').setValue('组队协作指南')
    await wrapper.get('[data-test="body-editor"]').setValue('完整指南正文')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(createGuide).toHaveBeenCalledTimes(1)
    expect(createGuide).toHaveBeenCalledWith(
      expect.objectContaining({ title: '组队协作指南', bodyMd: '完整指南正文' }),
      true
    )
    expect(publishGuide).not.toHaveBeenCalled()
  })

  it('服务端字段错误回填字段并保留用户输入', async () => {
    vi.mocked(getGuide).mockResolvedValue(guide('PUBLISHED'))
    vi.mocked(updateGuide).mockRejectedValue(new AppError('字段校验失败', {
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { title: ['标题已存在'] }
    }))
    const { wrapper } = await mountEditor('/ops/guides/g1/edit')
    const title = wrapper.get('input[placeholder*="组队与协作"]')
    await title.setValue('用户尚未保存的标题')

    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('标题已存在')
    expect((title.element as HTMLInputElement).value).toBe('用户尚未保存的标题')
  })

  it('409 状态冲突后重新加载管理详情', async () => {
    vi.mocked(getGuide)
      .mockResolvedValueOnce(guide('PUBLISHED'))
      .mockResolvedValueOnce({ ...guide('ARCHIVED'), title: '服务器最新版本' })
    vi.mocked(updateGuide).mockRejectedValue(new AppError('状态已变化', {
      status: 409,
      code: 'INVALID_STATE'
    }))
    const { wrapper } = await mountEditor('/ops/guides/g1/edit')

    await wrapper.get('input[placeholder*="组队与协作"]').setValue('本地修改')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(getGuide).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('服务器最新版本')
    expect(wrapper.text()).toContain('已归档')
  })

  it('有未保存修改时阻止离开并显示确认对话框', async () => {
    const { wrapper, router } = await mountEditor('/ops/guides/new')

    await wrapper.get('input[placeholder*="组队与协作"]').setValue('尚未保存的指南')
    await router.push('/ops/guides')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/ops/guides/new')
    expect(document.body.textContent).toContain('有尚未保存的更改')
    expect(document.body.textContent).toContain('继续编辑')
    expect(document.body.textContent).toContain('放弃更改')
  })

  it('放弃一次修改后，路由复用时仍保护下一篇指南的未保存内容', async () => {
    vi.mocked(getGuide).mockImplementation(async id => ({
      ...guide('DRAFT'),
      id,
      title: `${id} 指南`
    }))
    const { wrapper, router } = await mountEditor('/ops/guides/g1/edit')

    await wrapper.get('input[placeholder*="组队与协作"]').setValue('g1 未保存')
    await router.push('/ops/guides/g2/edit')
    await flushPromises()
    wrapper.findComponent(UnsavedChangesDialog).vm.$emit('confirm')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/ops/guides/g2/edit')
    await wrapper.get('input[placeholder*="组队与协作"]').setValue('g2 未保存')
    await router.push('/ops/guides')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/ops/guides/g2/edit')
    expect(document.body.textContent).toContain('有尚未保存的更改')
  })
})
