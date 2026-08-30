import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFaq,
  getFaq,
  publishFaq,
  updateFaq
} from '@/features/ops/api/opsFaqApi'
import type { OpsFaq } from '@/features/ops/faq/types'
import FaqEditorPage from '@/pages/ops/FaqEditorPage.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import { AppError } from '@/shared/http/types'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/ops/api/opsFaqApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/ops/api/opsFaqApi')>()
  return {
    ...original,
    createFaq: vi.fn(),
    getFaq: vi.fn(),
    publishFaq: vi.fn(),
    updateFaq: vi.fn()
  }
})

const MarkdownEditorStub = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  template: '<textarea data-test="answer-editor" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const RouterHost = defineComponent({ template: '<RouterView />' })
const mounted: VueWrapper[] = []

function faq(state: OpsFaq['publicationState']): OpsFaq {
  const actions = state === 'DRAFT'
    ? ['EDIT', 'PUBLISH'] as const
    : state === 'PUBLISHED'
      ? ['EDIT', 'FEATURE', 'ARCHIVE'] as const
      : [] as const
  return {
    id: 'f1',
    category: 'COMPETITION',
    question: `${state} 问题？`,
    answerMd: '答案正文',
    sortOrder: 1,
    isFeatured: state === 'PUBLISHED',
    featuredOrder: 2,
    publicationState: state,
    publishedAt: state === 'PUBLISHED' ? '2026-08-29T08:00:00+08:00' : null,
    updatedAt: '2026-08-29T09:00:00+08:00',
    allowedActions: [...actions],
    detailPath: '/qa/faqs#faq-f1'
  }
}

async function mountEditor(path: string) {
  const { wrapper, router } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/faq/new', name: 'ops-faq-new', component: FaqEditorPage },
      { path: '/ops/faq/:id/edit', name: 'ops-faq-edit', component: FaqEditorPage },
      { path: '/ops/faq', name: 'ops-faq', component: defineComponent({ template: '<div />' }) }
    ],
    stubs: { MarkdownEditor: MarkdownEditorStub }
  })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('Task5 FAQ 编辑页', () => {
  it.each([
    ['DRAFT', '草稿', '发布', true],
    ['PUBLISHED', '已发布', '保存更新', false],
    ['ARCHIVED', '已归档', null, false]
  ] as const)('%s 状态只展示后端允许的编辑动作', async (state, statusLabel, primary, hasDraftAction) => {
    vi.mocked(getFaq).mockResolvedValue(faq(state))

    const { wrapper } = await mountEditor('/ops/faq/f1/edit')

    expect(wrapper.text()).toContain(statusLabel)
    expect(wrapper.text().includes('保存草稿')).toBe(hasDraftAction)
    const primaryAction = wrapper.find('[data-test="editor-primary-action"]')
    expect(primaryAction.exists()).toBe(primary !== null)
    if (primary) expect(primaryAction.text()).toContain(primary)
    if (state === 'ARCHIVED') {
      expect(wrapper.text()).toContain('不可编辑')
      expect(wrapper.get('[data-test="answer-editor"]').attributes('disabled')).toBeDefined()
    }
  })

  it('新建并发布只调用一次 atomic create', async () => {
    vi.mocked(createFaq).mockResolvedValue(faq('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/faq/new')

    await wrapper.get('input[placeholder*="报名流程"]').setValue('报名流程是什么？')
    await wrapper.get('[data-test="answer-editor"]').setValue('完整答案')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(createFaq).toHaveBeenCalledTimes(1)
    expect(createFaq).toHaveBeenCalledWith(
      expect.objectContaining({ question: '报名流程是什么？', answerMd: '完整答案' }),
      true
    )
    expect(publishFaq).not.toHaveBeenCalled()
  })

  it('服务端字段错误回填表单并保留用户输入', async () => {
    vi.mocked(getFaq).mockResolvedValue(faq('PUBLISHED'))
    vi.mocked(updateFaq).mockRejectedValue(new AppError('字段校验失败', {
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { answer_md: ['答案格式不正确'] }
    }))
    const { wrapper } = await mountEditor('/ops/faq/f1/edit')
    const answer = wrapper.get('[data-test="answer-editor"]')
    await answer.setValue('用户尚未保存的答案')

    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('答案格式不正确')
    expect((answer.element as HTMLTextAreaElement).value).toBe('用户尚未保存的答案')
  })

  it('409 状态冲突后重新加载管理详情', async () => {
    vi.mocked(getFaq)
      .mockResolvedValueOnce(faq('PUBLISHED'))
      .mockResolvedValueOnce({ ...faq('ARCHIVED'), question: '服务器最新问题？' })
    vi.mocked(updateFaq).mockRejectedValue(new AppError('状态已变化', {
      status: 409,
      code: 'INVALID_STATE'
    }))
    const { wrapper } = await mountEditor('/ops/faq/f1/edit')

    await wrapper.get('input[placeholder*="报名流程"]').setValue('本地修改？')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(getFaq).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('服务器最新问题？')
    expect(wrapper.text()).toContain('已归档')
  })

  it('有未保存修改时阻止离开并显示确认对话框', async () => {
    const { wrapper, router } = await mountEditor('/ops/faq/new')

    await wrapper.get('input[placeholder*="报名流程"]').setValue('尚未保存的问题？')
    await router.push('/ops/faq')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/ops/faq/new')
    expect(wrapper.findComponent(UnsavedChangesDialog).exists()).toBe(true)
    expect(document.body.textContent).toContain('有尚未保存的更改')
  })
})
