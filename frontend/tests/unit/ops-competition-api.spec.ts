import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsCompetitionApi'
import { http } from '@/shared/http/client'
import type { CompetitionEditorDraft } from '@/features/ops/competitions/types'

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
  collegeOrganized: false,
  registrationUrl: 'https://example.com/register',
  officialNoticeUrl: '',
  cover: { id: 'asset-1', src: null, alt: '封面' },
  suitableGradeMin: 1,
  suitableGradeMax: 4,
  direction: '人工智能',
  summary: '摘要',
  suitableForMd: '适合所有同学',
  preparationAdviceMd: '提前准备',
  eventStartAt: '2026-10-01T00:00',
  eventEndAt: '2026-10-03T00:00',
  collegeContactName: '李老师',
  collegeContactText: 'teacher@example.com'
}

const managementCompetition = {
  id: 'c1', name: '测试竞赛', edition: '2026', category: 'AI', level: 'NATIONAL', participation_mode: 'TEAM',
  description_md: '竞赛介绍内容', college_organized: false, registration_start_at: '2026-09-01T00:00:00Z',
  registration_end_at: '2026-09-20T00:00:00Z', event_start_at: '2026-10-01T00:00:00Z', event_end_at: '2026-10-03T00:00:00Z',
  official_url: 'https://example.com', registration_url: 'https://example.com/register', official_notice_url: null,
  cover: { id: 'asset-1', url: 'https://example.com/cover.png', alt: '封面' }, suitable_grade_min: 1, suitable_grade_max: 4,
  direction: '人工智能', summary: '摘要', suitable_for_md: '适合所有同学', preparation_advice_md: '提前准备',
  college_contact_name: '李老师', college_contact_text: 'teacher@example.com', timeline: [], publication_state: 'DRAFT',
  published_at: null, is_featured: false, featured_order: 0, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-02T00:00:00Z',
  allowed_actions: ['EDIT', 'PUBLISH', 'DELETE_DRAFT']
}

describe('FE-090 竞赛运营 API 适配器', () => {
  it('完整 round-trip 草稿映射为蛇形 DTO，包含时间、联系人与封面', () => {
    const dto = api.toCompetitionWriteDto(draft)
    expect(dto.name).toBe('测试竞赛')
    expect(dto.edition).toBe('2026')
    expect(dto.participation_mode).toBe('TEAM')
    expect(dto.description_md).toBe('竞赛介绍内容')
    expect(dto.college_organized).toBe(false)
    expect(dto.cover_asset_id).toBe('asset-1')
    expect(dto.event_end_at).toBe('2026-10-03T00:00')
    expect(dto.college_contact_name).toBe('李老师')
    expect(dto.registration_url).toBe('https://example.com/register')
  })

  it('新建并发布在一次 POST 中携带 publish=true', async () => {
    vi.mocked(http.post).mockResolvedValue(managementCompetition)
    const created = await api.createCompetition(draft, true)
    expect(created.cover?.id).toBe('asset-1')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/competitions',
      expect.objectContaining({ name: '测试竞赛', cover_asset_id: 'asset-1', publish: true })
    )
  })

  it('publishCompetition 调用 POST /ops/competitions/{id}/publish', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.publishCompetition('c1')
    expect(http.post).toHaveBeenCalledWith('/ops/competitions/c1/publish')
  })

  it('updateCompetition 调用 PATCH /ops/competitions/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(managementCompetition)
    await api.updateCompetition('c1', draft)
    expect(http.patch).toHaveBeenCalledWith('/ops/competitions/c1', expect.any(Object))
  })

  it('管理详情完整回填时间线和已发布编辑动作', async () => {
    vi.mocked(http.get).mockResolvedValue({ ...managementCompetition, publication_state: 'PUBLISHED', allowed_actions: ['EDIT', 'ARCHIVE'], timeline: [{ id: 't1', title: '报名开始', event_at: '2026-09-01T00:00:00Z', end_at: null, description: null, sort_order: 0 }] })
    const item = await api.getCompetition('c1')
    expect(item.timeline[0]).toMatchObject({ id: 't1', eventAt: '2026-09-01T00:00:00Z' })
    expect(item.allowedActions).toEqual(['EDIT', 'ARCHIVE'])
  })
})
