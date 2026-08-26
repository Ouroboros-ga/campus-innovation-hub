import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  cancelActivityRegistration,
  getActivity,
  getAnnouncement,
  listActivities,
  listAnnouncements,
  registerActivity
} from '@/features/dynamics/api/dynamicsApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn() }
}))

const activityDto = {
  id: 'ai-sharing-4',
  title: 'AI 前沿技术分享会（第 4 期）',
  activity_type: 'TECH_SHARING' as const,
  summary: '大模型与智能体工程实践分享',
  organizer_name: '人工智能学院学生会',
  speaker: '王教授',
  location: '人工智能学院报告厅',
  start_at: '2026-09-02T19:00:00+08:00',
  end_at: '2026-09-02T21:00:00+08:00',
  cover: { id: 'c1', url: 'https://media.example.edu/activity-cover.webp' },
  registration_required: true,
  registration_state: 'OPEN',
  capacity: 120,
  registered_count: 42,
  publication_state: 'PUBLISHED'
}

const activityDetailDto = {
  ...activityDto,
  description_md: '本期分享聚焦大模型与智能体工程实践（Markdown）',
  registration_start_at: '2026-08-20T00:00:00+08:00',
  registration_end_at: '2026-08-28T18:00:00+08:00',
  notes_md: '含现场答疑。',
  registered: false
}

const announcementDto = {
  id: 'announcement-mcm-2026',
  title: '关于组织参加 2026 年全国大学生数学建模竞赛的通知',
  summary: '2026 年全国大学生数学建模竞赛报名现已开始。',
  published_at: '2026-08-18T09:00:00+08:00',
  is_pinned: true,
  publisher_scope: 'ACADEMY' as 'ACADEMY' | 'UNIVERSITY' | 'PLATFORM',
  external_url: null,
  linked_object: { type: 'COMPETITION', id: 'mcm-2026', path: '/competitions/mcm-2026' }
}

const announcementDetailDto = {
  ...announcementDto,
  body_md: '请有意向的同学按通知要求完成组队与报名。'
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FE-104 校园动态/活动/公告 API 适配器', () => {
  it('listActivities 映射查询参数与列表项', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [activityDto]
    })

    const result = await listActivities({
      q: '分享会',
      status: 'OPEN',
      activityType: 'TECH_SHARING',
      page: 1,
      pageSize: 6
    })

    expect(http.get).toHaveBeenCalledWith('/activities', {
      query: {
        q: '分享会',
        status: 'OPEN',
        activity_type: 'TECH_SHARING',
        page: 1,
        page_size: 6
      }
    })
    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({
      id: 'ai-sharing-4',
      activityType: 'TECH_SHARING',
      registrationRequired: true,
      capacity: 120,
      isFeatured: false,
      detailPath: '/activities/ai-sharing-4'
    })
    // 列表项缺报名窗口 / 正文 → 默认空
    expect(result.items[0]!.registrationStartAt).toBeNull()
    expect(result.items[0]!.descriptionMd).toBeNull()
    expect(result.items[0]!.cover.src).toBe('https://media.example.edu/activity-cover.webp')
  })

  it('getActivity 映射详情字段（报名窗口 + 正文）', async () => {
    vi.mocked(http.get).mockResolvedValue(activityDetailDto)

    const detail = await getActivity('ai-sharing-4')

    expect(http.get).toHaveBeenCalledWith('/activities/ai-sharing-4')
    expect(detail).toMatchObject({
      descriptionMd: '本期分享聚焦大模型与智能体工程实践（Markdown）',
      registrationStartAt: '2026-08-20T00:00:00+08:00',
      registrationEndAt: '2026-08-28T18:00:00+08:00'
    })
  })

  it('listAnnouncements 映射查询参数与列表项（正文为 null）', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [announcementDto]
    })

    const result = await listAnnouncements({ publisherScope: 'ACADEMY', page: 1, pageSize: 10 })

    expect(http.get).toHaveBeenCalledWith('/announcements', {
      query: { publisher_scope: 'ACADEMY', page: 1, page_size: 10 }
    })
    expect(result.items[0]).toMatchObject({
      id: 'announcement-mcm-2026',
      publisherScope: 'ACADEMY',
      bodyMd: null,
      detailPath: '/activities/announcements/announcement-mcm-2026',
      linkedObject: {
        kind: 'COMPETITION',
        to: '/competitions/mcm-2026',
        label: 'mcm-2026'
      }
    })
  })

  it('getAnnouncement 映射正文与关联对象', async () => {
    vi.mocked(http.get).mockResolvedValue(announcementDetailDto)

    const detail = await getAnnouncement('announcement-mcm-2026')

    expect(http.get).toHaveBeenCalledWith('/announcements/announcement-mcm-2026')
    expect(detail).toMatchObject({
      bodyMd: '请有意向的同学按通知要求完成组队与报名。',
      externalUrl: null
    })
  })

  it('registerActivity 发送报名请求', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await registerActivity('ai-sharing-4')
    expect(http.post).toHaveBeenCalledWith('/activities/ai-sharing-4/register')
  })

  it('cancelActivityRegistration 发送取消报名请求', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await cancelActivityRegistration('ai-sharing-4')
    expect(http.post).toHaveBeenCalledWith('/activities/ai-sharing-4/cancel-registration')
  })
})
