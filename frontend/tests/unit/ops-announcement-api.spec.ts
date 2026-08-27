import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsAnnouncementApi'
import { http } from '@/shared/http/client'
import type { AnnouncementEditorDraft } from '@/features/ops/lib/opsStore'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const draft: AnnouncementEditorDraft = {
  title: '测试公告',
  publisherScope: 'ACADEMY',
  bodyMd: '公告正文',
  linkedObject: { kind: 'ACTIVITY', label: '测试活动', to: '/activities/a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  externalUrl: 'https://example.com'
}

const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

describe('FE-090 公告运营 API 适配器', () => {
  it('toAnnouncementWriteDto 映射关联对象 id 与蛇形 DTO', () => {
    const dto = api.toAnnouncementWriteDto(draft)
    expect(dto.title).toBe('测试公告')
    expect(dto.body_md).toBe('公告正文')
    expect(dto.publisher_scope).toBe('ACADEMY')
    expect(dto.activity_id).toBe(uuid)
    expect(dto.competition_id).toBeNull()
    expect(dto.external_url).toBe('https://example.com')
  })

  it('无关联对象时所有关联 id 为空', () => {
    const dto = api.toAnnouncementWriteDto({ ...draft, linkedObject: null })
    expect(dto.activity_id).toBeNull()
    expect(dto.competition_id).toBeNull()
  })

  it('createAnnouncement 调用 POST /ops/announcements 并返回 id', async () => {
    vi.mocked(http.post).mockResolvedValue({ id: 'ann-1' })
    const id = await api.createAnnouncement(draft)
    expect(id).toBe('ann-1')
    expect(http.post).toHaveBeenCalledWith(
      '/ops/announcements',
      expect.objectContaining({ title: '测试公告', activity_id: uuid })
    )
  })

  it('updateAnnouncement 调用 PATCH /ops/announcements/{id}', async () => {
    vi.mocked(http.patch).mockResolvedValue(undefined)
    await api.updateAnnouncement('ann-1', draft)
    expect(http.patch).toHaveBeenCalledWith('/ops/announcements/ann-1', expect.any(Object))
  })
})
