import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/features/documents/api/documentApi'
import type { DocumentEditorDraft } from '@/features/documents/ops/types'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const managementDetail = {
  id: 'd1',
  slug: 'privacy',
  title: '隐私政策',
  category: 'PRIVACY',
  summary: '隐私说明',
  body_md: '    保留缩进\n\n',
  publication_state: 'PUBLISHED',
  published_at: '2026-08-29T08:00:00+08:00',
  allowed_actions: ['EDIT', 'ARCHIVE'],
  sort_order: 2,
  version: '1.0',
  created_at: '2026-08-29T07:00:00+08:00',
  updated_at: '2026-08-29T09:00:00+08:00',
  created_by_id: 'u1',
  updated_by_id: 'u1'
} as const

const draft: DocumentEditorDraft = {
  slug: 'privacy',
  title: '隐私政策',
  category: 'PRIVACY',
  summary: '隐私说明',
  bodyMd: '    保留缩进\n\n',
  sortOrder: 2,
  version: '1.0'
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Task5 文档运营 API 适配器', () => {
  it('严格映射管理详情并完整往返字段', async () => {
    vi.mocked(http.get).mockResolvedValue(managementDetail)
    const document = await api.getOpsDocument('d1')

    expect(document.allowedActions).toEqual(['EDIT', 'ARCHIVE'])
    expect(api.toDocumentEditorDraft(document)).toEqual(draft)
  })

  it('编辑已发布文档时不发送不可修改的 slug，且保留 Markdown 空白', async () => {
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, title: '更新后的隐私政策' })

    await api.updateDocument('d1', { ...draft, slug: 'should-not-change', title: '更新后的隐私政策' }, false)

    expect(http.patch).toHaveBeenCalledWith('/ops/documents/d1', {
      title: '更新后的隐私政策',
      category: 'PRIVACY',
      summary: '隐私说明',
      body_md: '    保留缩进\n\n',
      sort_order: 2,
      version: '1.0'
    })
  })

  it.each([
    ['category', 'UNKNOWN'],
    ['sort_order', -1],
    ['allowed_actions', ['EDIT', 'FEATURE']],
    ['body_md', undefined],
    ['updated_at', undefined]
  ])('拒绝非法管理 DTO 字段 %s=%s', async (field, value) => {
    vi.mocked(http.get).mockResolvedValue({ ...managementDetail, [field]: value })

    await expect(api.getOpsDocument('d1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('新建并发布只发送一次 POST', async () => {
    vi.mocked(http.post).mockResolvedValue(managementDetail)

    await api.createDocument(draft, true)

    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post).toHaveBeenCalledWith('/ops/documents', {
      slug: 'privacy',
      title: '隐私政策',
      category: 'PRIVACY',
      summary: '隐私说明',
      body_md: '    保留缩进\n\n',
      sort_order: 2,
      version: '1.0',
      publish: true
    })
  })
})
