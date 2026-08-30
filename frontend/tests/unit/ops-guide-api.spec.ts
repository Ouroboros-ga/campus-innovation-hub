import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsGuideApi'
import type { GuideEditorDraft } from '@/features/ops/guides/types'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const managementDetail = {
  id: 'g1',
  title: '测试指南',
  category: 'COMPETITION',
  summary: '一句话概述',
  body_md: '指南正文',
  competition_ids: ['c1'],
  related_competitions: [{ id: 'c1', title: '蓝桥杯' }],
  is_featured: true,
  featured_order: 3,
  publication_state: 'DRAFT',
  published_at: null,
  allowed_actions: ['EDIT', 'PUBLISH'],
  created_at: '2026-08-29T08:00:00+08:00',
  updated_at: '2026-08-29T09:00:00+08:00'
} as const

const draft: GuideEditorDraft = {
  title: '测试指南',
  category: 'COMPETITION',
  summary: '一句话概述',
  bodyMd: '指南正文',
  competitionIds: ['c1'],
  isFeatured: true,
  featuredOrder: 3
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Task4 指南运营 API 适配器', () => {
  it('严格映射管理详情，并在只改标题后保留关联与精选排序', async () => {
    vi.mocked(http.get).mockResolvedValue(managementDetail)

    const guide = await api.getGuide('g1')
    const edited = { ...api.toGuideEditorDraft(guide), title: '更新后的标题' }
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, title: edited.title })
    await api.updateGuide('g1', edited)

    expect(edited.competitionIds).toEqual(['c1'])
    expect(http.patch).toHaveBeenCalledWith('/ops/guides/g1', {
      title: '更新后的标题',
      category: 'COMPETITION',
      summary: '一句话概述',
      body_md: '指南正文',
      competition_ids: ['c1'],
      is_featured: true,
      featured_order: 3
    })
  })

  it('保留 Markdown 首尾空白，避免改写缩进代码块', async () => {
    const bodyMd = '    const answer = 42\n\n'
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, body_md: bodyMd })

    await api.updateGuide('g1', { ...draft, bodyMd })

    expect(http.patch).toHaveBeenCalledWith('/ops/guides/g1', expect.objectContaining({
      body_md: bodyMd
    }))
  })

  it.each([
    ['summary', 42],
    ['featured_order', -1],
    ['featured_order', 1.5],
    ['featured_order', Number.NaN],
    ['updated_at', undefined],
    ['related_competitions', undefined]
  ])('拒绝非法管理 DTO 字段 %s=%s', async (field, value) => {
    vi.mocked(http.get).mockResolvedValue({ ...managementDetail, [field]: value })

    await expect(api.getGuide('g1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('新建并发布只发送一次 POST，publish intent 与内容同一请求提交', async () => {
    vi.mocked(http.post).mockResolvedValue({
      ...managementDetail,
      publication_state: 'PUBLISHED',
      allowed_actions: ['EDIT', 'ARCHIVE', 'FEATURE']
    })

    const guide = await api.createGuide(draft, true)

    expect(guide.publicationState).toBe('PUBLISHED')
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post).toHaveBeenCalledWith('/ops/guides', {
      title: '测试指南',
      category: 'COMPETITION',
      summary: '一句话概述',
      body_md: '指南正文',
      competition_ids: ['c1'],
      is_featured: true,
      featured_order: 3,
      publish: true
    })
  })

  it('校验标题、正文与精选排序', () => {
    const errors = api.validateGuide({
      ...draft,
      title: '',
      bodyMd: '',
      featuredOrder: -1
    })

    expect(errors.title).toBeTruthy()
    expect(errors.bodyMd).toBeTruthy()
    expect(errors.featuredOrder).toBeTruthy()
  })
})
