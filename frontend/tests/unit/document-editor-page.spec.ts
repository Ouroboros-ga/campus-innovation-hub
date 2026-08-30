import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createDocument,
  getOpsDocument,
  publishDocument,
  updateDocument
} from '@/features/documents/api/documentApi'
import type { OpsDocument } from '@/features/documents/ops/types'
import DocumentEditorPage from '@/pages/ops/DocumentEditorPage.vue'
import { AppError } from '@/shared/http/types'
import { mountWithAppContext } from '../utils/mountWithAppContext'

vi.mock('@/features/documents/api/documentApi', async importOriginal => {
  const original = await importOriginal<typeof import('@/features/documents/api/documentApi')>()
  return {
    ...original,
    createDocument: vi.fn(),
    getOpsDocument: vi.fn(),
    publishDocument: vi.fn(),
    updateDocument: vi.fn()
  }
})

const MarkdownEditorStub = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  template: '<textarea data-test="document-body-editor" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />'
})
const RouterHost = defineComponent({ template: '<RouterView />' })
const mounted: VueWrapper[] = []

function siteDocument(state: OpsDocument['publicationState']): OpsDocument {
  const actions = state === 'DRAFT'
    ? ['EDIT', 'PUBLISH'] as const
    : state === 'PUBLISHED'
      ? ['EDIT', 'ARCHIVE'] as const
      : [] as const
  return {
    id: 'd1',
    slug: 'privacy',
    title: `${state} 文档`,
    category: 'PRIVACY',
    summary: '摘要',
    bodyMd: '正文',
    sortOrder: 1,
    version: '1.0',
    publicationState: state,
    publishedAt: state === 'PUBLISHED' ? '2026-08-29T08:00:00+08:00' : null,
    createdAt: '2026-08-29T07:00:00+08:00',
    updatedAt: '2026-08-29T09:00:00+08:00',
    createdById: 'u1',
    updatedById: 'u1',
    allowedActions: [...actions],
    detailPath: '/docs/privacy'
  }
}

async function mountEditor(path: string) {
  const { wrapper, router } = await mountWithAppContext(RouterHost, {
    initialRoute: path,
    routes: [
      { path: '/ops/documents/new', name: 'ops-document-new', component: DocumentEditorPage },
      { path: '/ops/documents/:id/edit', name: 'ops-document-edit', component: DocumentEditorPage },
      { path: '/ops/documents', name: 'ops-documents', component: defineComponent({ template: '<div />' }) }
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

describe('Task5 文档编辑页', () => {
  it('已发布文档可更新正文但 slug 不可修改', async () => {
    vi.mocked(getOpsDocument).mockResolvedValue(siteDocument('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/documents/d1/edit')

    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.get('input[placeholder="如 privacy"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('input[placeholder="如：隐私政策"]').attributes('disabled')).toBeUndefined()
  })

  it('归档文档只读，不显示主提交动作', async () => {
    vi.mocked(getOpsDocument).mockResolvedValue(siteDocument('ARCHIVED'))
    const { wrapper } = await mountEditor('/ops/documents/d1/edit')

    expect(wrapper.text()).toContain('已归档')
    expect(wrapper.find('[data-test="editor-primary-action"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="document-body-editor"]').attributes('disabled')).toBeDefined()
  })

  it('新建并发布只调用一次 atomic create', async () => {
    vi.mocked(createDocument).mockResolvedValue(siteDocument('PUBLISHED'))
    const { wrapper } = await mountEditor('/ops/documents/new')

    await wrapper.get('input[placeholder="如 privacy"]').setValue('help-center')
    await wrapper.get('input[placeholder="如：隐私政策"]').setValue('使用帮助')
    await wrapper.get('[data-test="document-body-editor"]').setValue('完整正文')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(createDocument).toHaveBeenCalledTimes(1)
    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'help-center', title: '使用帮助', bodyMd: '完整正文' }),
      true
    )
    expect(publishDocument).not.toHaveBeenCalled()
  })

  it('服务端 slug 错误回填字段并保留其他输入', async () => {
    vi.mocked(getOpsDocument).mockResolvedValue(siteDocument('DRAFT'))
    vi.mocked(updateDocument).mockRejectedValue(new AppError('字段校验失败', {
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: { slug: ['该标识已存在'] }
    }))
    const { wrapper } = await mountEditor('/ops/documents/d1/edit')
    const title = wrapper.get('input[placeholder="如：隐私政策"]')
    await title.setValue('用户尚未保存的标题')

    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('该标识已存在')
    expect((title.element as HTMLInputElement).value).toBe('用户尚未保存的标题')
  })

  it('409 状态冲突后重新加载管理详情', async () => {
    vi.mocked(getOpsDocument)
      .mockResolvedValueOnce(siteDocument('PUBLISHED'))
      .mockResolvedValueOnce({ ...siteDocument('ARCHIVED'), title: '服务器最新文档' })
    vi.mocked(updateDocument).mockRejectedValue(new AppError('状态已变化', {
      status: 409,
      code: 'INVALID_STATE'
    }))
    const { wrapper } = await mountEditor('/ops/documents/d1/edit')

    await wrapper.get('input[placeholder="如：隐私政策"]').setValue('本地修改')
    await wrapper.get('[data-test="editor-primary-action"]').trigger('click')
    await flushPromises()

    expect(getOpsDocument).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('服务器最新文档')
    expect(wrapper.text()).toContain('已归档')
  })
})
