import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsCompetitionApi'
import { http } from '@/shared/http/client'
import type { CompetitionEditorDraft } from '@/features/ops/lib/opsStore'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const draft: CompetitionEditorDraft = {
  name: '测试竞赛',
  edition: '2026',
  category: 'AI',
  level: 'NATIONAL',
  participationMode: 'TEAM',
  registrationStartAt: '2026-09-01T00:00',
  registrationEndAt: '2026-09-20T00:00',
  officialUrl: 'https://example.com',
  descriptionMd: '竞赛介绍内容',
  collegeOrganized: false
}

describe('FE-090 竞赛运营 API 适配器', () => {
  it('toCompetitionWriteDto 映射为蛇形 DTO 并带封面资产 id', () => {
    const dto = api.toCompetitionWriteDto(draft, 'asset-1')
    expect(dto.name).toBe('测试竞赛')
    expect(dto.edition).toBe('2026')
    expect(dto.participation_mode).toBe('TEAM')
    expect(dto.description_md).toBe('竞赛介绍内容')
    expect(dto.college_organized).toBe(false)
    expect(dto.cover_asset_id).toBe('asset-1')
  })

  it('createCompetition 调用 POST /ops/competitions 并返回 id', async () => {
    vi.mocked(http.post).mockResolvedValue({ id: 'c1' })
    const id = await api.createCompetition(draft, 'asset-1')
    expect(id).toBe('c1')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/competitions',
      expect.objectContaining({ name: '测试竞赛', cover_asset_id: 'asset-1' })
    )
  })

  it('publishCompetition 调用 POST /ops/competitions/{id}/publish', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.publishCompetition('c1')
    expect(http.post).toHaveBeenCalledWith('/ops/competitions/c1/publish')
  })

  it('updateCompetition 调用 PATCH /ops/competitions/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(undefined)
    await api.updateCompetition('c1', draft, null)
    expect(http.patch).toHaveBeenCalledWith('/ops/competitions/c1', expect.any(Object))
  })
})
