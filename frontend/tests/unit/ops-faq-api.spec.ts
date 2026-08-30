import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsFaqApi'
import type { FaqEditorDraft } from '@/features/ops/api/opsFaqApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const managementDetail = {
  id: 'f1',
  category: 'COMPETITION',
  question: '如何报名？',
  answer_md: '请在竞赛详情页报名。',
  sort_order: 2,
  is_featured: true,
  featured_order: 4,
  publication_state: 'DRAFT',
  published_at: null,
  allowed_actions: ['EDIT', 'PUBLISH'],
  created_at: '2026-08-29T08:00:00+08:00',
  updated_at: '2026-08-29T09:00:00+08:00',
  created_by_id: 'u1',
  updated_by_id: 'u1'
} as const

const draft: FaqEditorDraft = {
  category: 'COMPETITION',
  question: '如何报名？',
  answerMd: '请在竞赛详情页报名。',
  sortOrder: 2,
  isFeatured: true,
  featuredOrder: 4
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Task5 FAQ 运营 API 适配器', () => {
  it('严格映射管理详情，并在只改问题后保留展示字段', async () => {
    vi.mocked(http.get).mockResolvedValue(managementDetail)

    const faq = await api.getFaq('f1')
    const edited = { ...api.toFaqEditorDraft(faq), question: '更新后的问题？' }
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, question: edited.question })
    await api.updateFaq('f1', edited)

    expect(faq.allowedActions).toEqual(['EDIT', 'PUBLISH'])
    expect(faq.updatedAt).toBe('2026-08-29T09:00:00+08:00')
    expect(http.patch).toHaveBeenCalledWith('/ops/faq/f1', {
      category: 'COMPETITION',
      question: '更新后的问题？',
      answer_md: '请在竞赛详情页报名。',
      sort_order: 2,
      is_featured: true,
      featured_order: 4
    })
  })

  it('保留 Markdown 首尾空白，避免改写缩进内容', async () => {
    const answerMd = '    pnpm check\n\n'
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, answer_md: answerMd })

    await api.updateFaq('f1', { ...draft, answerMd })

    expect(http.patch).toHaveBeenCalledWith('/ops/faq/f1', expect.objectContaining({
      answer_md: answerMd
    }))
  })

  it.each([
    ['category', 'UNKNOWN'],
    ['featured_order', -1],
    ['sort_order', 1.5],
    ['allowed_actions', ['EDIT', 'CANCEL']],
    ['published_at', undefined],
    ['updated_at', undefined]
  ])('拒绝非法管理 DTO 字段 %s=%s', async (field, value) => {
    vi.mocked(http.get).mockResolvedValue({ ...managementDetail, [field]: value })

    await expect(api.getFaq('f1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('新建并发布只发送一次 POST，并携带 publish intent', async () => {
    vi.mocked(http.post).mockResolvedValue({
      ...managementDetail,
      publication_state: 'PUBLISHED',
      published_at: '2026-08-29T10:00:00+08:00',
      allowed_actions: ['EDIT', 'FEATURE', 'ARCHIVE']
    })

    const faq = await api.createFaq(draft, true)

    expect(faq.publicationState).toBe('PUBLISHED')
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post).toHaveBeenCalledWith('/ops/faq', {
      category: 'COMPETITION',
      question: '如何报名？',
      answer_md: '请在竞赛详情页报名。',
      sort_order: 2,
      is_featured: true,
      featured_order: 4,
      publish: true
    })
  })

  it('校验问题、答案与非负整数排序', () => {
    const errors = api.validateFaq({
      ...draft,
      question: '',
      answerMd: '',
      sortOrder: -1,
      featuredOrder: 1.5
    })

    expect(errors.question).toBeTruthy()
    expect(errors.answerMd).toBeTruthy()
    expect(errors.sortOrder).toBeTruthy()
    expect(errors.featuredOrder).toBeTruthy()
  })
})
