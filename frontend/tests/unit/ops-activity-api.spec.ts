import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsActivityApi'
import { http } from '@/shared/http/client'
import type { ActivityEditorDraft } from '@/features/ops/lib/opsStore'

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
  descriptionMd: '活动介绍内容'
}

describe('FE-090 活动运营 API 适配器', () => {
  it('toActivityWriteDto 映射为蛇形 DTO 并带封面资产 id', () => {
    const dto = api.toActivityWriteDto(draft, 'asset-1')
    expect(dto.title).toBe('测试活动')
    expect(dto.activity_type).toBe('TECH_SHARING')
    expect(dto.start_at).toBe('2026-09-05T10:00')
    expect(dto.registration_end_at).toBe('2026-09-04T23:59')
    expect(dto.cover_asset_id).toBe('asset-1')
  })

  it('未报名活动清空报名时间与容量', () => {
    const dto = api.toActivityWriteDto(
      { ...draft, registrationRequired: false, registrationEndAt: '', capacity: 50 },
      null
    )
    expect(dto.registration_required).toBe(false)
    expect(dto.registration_end_at).toBeNull()
    expect(dto.capacity).toBeNull()
  })

  it('createActivity 调用 POST /ops/activities 并返回 id', async () => {
    vi.mocked(http.post).mockResolvedValue({ id: 'a1' })
    const id = await api.createActivity(draft, 'asset-1')
    expect(id).toBe('a1')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/activities',
      expect.objectContaining({ title: '测试活动', cover_asset_id: 'asset-1' })
    )
  })

  it('updateActivity 调用 PATCH /ops/activities/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(undefined)
    await api.updateActivity('a1', draft, null)
    expect(http.patch).toHaveBeenCalledWith('/ops/activities/a1', expect.any(Object))
  })
})
