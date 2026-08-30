import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsAnnouncementApi'
import type { AnnouncementEditorDraft } from '@/features/ops/announcements/types'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

const managementDetail = {
  id: 'a1',
  title: '竞赛报名通知',
  summary: '请在截止日前完成报名。',
  body_md: '    详细安排\n\n',
  publisher_scope: 'ACADEMY',
  source_name: '竞赛官网',
  external_url: 'https://example.com/notice',
  is_pinned: true,
  is_home_featured: true,
  home_featured_order: 2,
  linked_object: {
    type: 'COMPETITION',
    id: 'c1',
    title: '蓝桥杯',
    path: '/competitions/c1'
  },
  competition_id: 'c1',
  activity_id: null,
  organization_id: null,
  recruitment_id: null,
  publication_state: 'DRAFT',
  published_at: null,
  allowed_actions: ['EDIT', 'PUBLISH'],
  created_at: '2026-08-29T08:00:00+08:00',
  updated_at: '2026-08-29T09:00:00+08:00'
} as const

const draft: AnnouncementEditorDraft = {
  title: '竞赛报名通知',
  summary: '请在截止日前完成报名。',
  bodyMd: '    详细安排\n\n',
  publisherScope: 'ACADEMY',
  sourceName: '竞赛官网',
  externalUrl: 'https://example.com/notice',
  isPinned: true,
  isHomeFeatured: true,
  relation: {
    kind: 'COMPETITION',
    id: 'c1',
    title: '蓝桥杯',
    path: '/competitions/c1'
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Task5 公告运营 API 适配器', () => {
  it('严格映射管理详情，并在编辑后保留来源、展示设置与关联对象', async () => {
    vi.mocked(http.get).mockResolvedValue(managementDetail)
    const announcement = await api.getAnnouncement('a1')
    const edited = { ...api.toAnnouncementEditorDraft(announcement), title: '更新后的通知' }
    vi.mocked(http.patch).mockResolvedValue({ ...managementDetail, title: edited.title })
    await api.updateAnnouncement('a1', edited)

    expect(announcement.allowedActions).toEqual(['EDIT', 'PUBLISH'])
    expect(announcement.relation?.id).toBe('c1')
    expect(http.patch).toHaveBeenCalledWith('/ops/announcements/a1', {
      title: '更新后的通知',
      summary: '请在截止日前完成报名。',
      body_md: '    详细安排\n\n',
      publisher_scope: 'ACADEMY',
      source_name: '竞赛官网',
      external_url: 'https://example.com/notice',
      is_pinned: true,
      is_home_featured: true,
      competition_id: 'c1',
      activity_id: null,
      organization_id: null,
      recruitment_id: null
    })
  })

  it.each([
    ['publisher_scope', 'UNKNOWN'],
    ['home_featured_order', -1],
    ['linked_object', { type: 'UNKNOWN', id: 'c1', title: 'x', path: '/x' }],
    ['allowed_actions', ['EDIT', 'FEATURE']],
    ['updated_at', undefined]
  ])('拒绝非法管理 DTO 字段 %s=%s', async (field, value) => {
    vi.mocked(http.get).mockResolvedValue({ ...managementDetail, [field]: value })
    await expect(api.getAnnouncement('a1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('新建并发布只发送一次 POST，并携带完整关联字段', async () => {
    vi.mocked(http.post).mockResolvedValue({ ...managementDetail, publication_state: 'PUBLISHED', published_at: '2026-08-29T10:00:00+08:00', allowed_actions: ['EDIT', 'ARCHIVE'] })

    const announcement = await api.createAnnouncement(draft, true)

    expect(announcement.publicationState).toBe('PUBLISHED')
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post).toHaveBeenCalledWith('/ops/announcements', expect.objectContaining({
      competition_id: 'c1',
      activity_id: null,
      source_name: '竞赛官网',
      is_pinned: true,
      is_home_featured: true,
      publish: true
    }))
  })
})
