import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsActivityApi'
import { http } from '@/shared/http/client'
import type { ActivityEditorDraft } from '@/features/ops/activities/types'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const draft: ActivityEditorDraft = {
  title: '测试活动',
  activityType: 'TECH_SHARING',
  startAt: '2026-09-05T10:00',
  endAt: '2026-09-05T12:00',
  location: '报告厅',
  organizerName: '人工智能协会',
  registrationRequired: true,
  registrationEndAt: '2026-09-04T23:59',
  capacity: 50,
  descriptionMd: '活动介绍内容',
  summary: '活动摘要',
  organizerOrganizationId: null,
  speaker: '王同学',
  notesMd: '携带学生证',
  cover: { id: 'asset-1', src: null, alt: '封面' },
  registrationStartAt: '2026-09-01T10:00'
}

const managementActivity = {
  id: 'a1', title: '测试活动', activity_type: 'TECH_SHARING', summary: '活动摘要', organizer_organization_id: null,
  organizer_name: '人工智能协会', speaker: '王同学', location: '报告厅', start_at: '2026-09-05T10:00:00Z',
  end_at: '2026-09-05T12:00:00Z', cover: { id: 'asset-1', url: 'https://example.com/cover.png', alt: '封面' },
  registration_required: true, registration_start_at: '2026-09-01T10:00:00Z', registration_end_at: '2026-09-04T23:59:00Z',
  capacity: 50, description_md: '活动介绍内容', notes_md: '携带学生证', publication_state: 'DRAFT', published_at: null,
  is_featured: false, featured_order: 0, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-02T00:00:00Z',
  allowed_actions: ['EDIT', 'PUBLISH']
}

describe('FE-090 活动运营 API 适配器', () => {
  it('toActivityWriteDto 映射为蛇形 DTO 并带封面资产 id', () => {
    const dto = api.toActivityWriteDto(draft)
    expect(dto.title).toBe('测试活动')
    expect(dto.activity_type).toBe('TECH_SHARING')
    expect(dto.start_at).toBe('2026-09-05T10:00')
    expect(dto.registration_end_at).toBe('2026-09-04T23:59')
    expect(dto.cover_asset_id).toBe('asset-1')
  })

  it('未报名活动清空报名时间与容量', () => {
    const dto = api.toActivityWriteDto(
      { ...draft, registrationRequired: false, registrationEndAt: '', capacity: 50 }
    )
    expect(dto.registration_required).toBe(false)
    expect(dto.registration_end_at).toBeNull()
    expect(dto.capacity).toBeNull()
  })

  it('创建并发布通过一次 POST 完成', async () => {
    vi.mocked(http.post).mockResolvedValue(managementActivity)
    const created = await api.createActivity(draft, true)
    expect(created.allowedActions).toContain('PUBLISH')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/activities',
      expect.objectContaining({ title: '测试活动', cover_asset_id: 'asset-1', publish: true })
    )
  })

  it('updateActivity 调用 PATCH /ops/activities/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(managementActivity)
    await api.updateActivity('a1', draft)
    expect(http.patch).toHaveBeenCalledWith('/ops/activities/a1', expect.any(Object))
  })

  it('组合发布只请求一个事务 endpoint，并携带 publish=true', async () => {
    vi.mocked(http.post).mockResolvedValue({ activity: managementActivity })
    await api.createActivityWithAnnouncement(draft, { title: '活动公告', publisherScope: 'ACADEMY', bodyMd: '正文', externalUrl: '' }, true)
    expect(http.post).toHaveBeenCalledWith('/ops/dynamics/activity-with-announcement', expect.objectContaining({ publish: true }))
  })
})
