import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsGuideApi'
import { http } from '@/shared/http/client'
import type { GuideEditorDraft } from '@/features/ops/api/opsGuideApi'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const draft: GuideEditorDraft = {
  title: '测试指南',
  category: 'COMPETITION',
  summary: '一句话概述',
  bodyMd: '指南正文',
  isFeatured: true
}

describe('FE-090 指南运营 API 适配器', () => {
  it('validateGuide 校验必填', () => {
    const errors = api.validateGuide({ ...draft, title: '', bodyMd: '' })
    expect(errors.title).toBeTruthy()
    expect(errors.bodyMd).toBeTruthy()
  })

  it('toGuideWriteDto 映射为蛇形 DTO', () => {
    const dto = api.toGuideWriteDto(draft)
    expect(dto.title).toBe('测试指南')
    expect(dto.category).toBe('COMPETITION')
    expect(dto.body_md).toBe('指南正文')
    expect(dto.is_featured).toBe(true)
    expect(dto.featured_order).toBe(0)
    expect(dto.competition_ids).toEqual([])
  })

  it('createGuide 调用 POST /ops/guides 并返回 id', async () => {
    vi.mocked(http.post).mockResolvedValue({ id: 'g1' })
    const id = await api.createGuide(draft)
    expect(id).toBe('g1')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/guides',
      expect.objectContaining({ title: '测试指南', body_md: '指南正文' })
    )
  })

  it('updateGuide 调用 PATCH /ops/guides/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(undefined)
    await api.updateGuide('g1', draft)
    expect(http.patch).toHaveBeenCalledWith('/ops/guides/g1', expect.any(Object))
  })
})
