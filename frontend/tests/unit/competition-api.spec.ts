import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getCompetition,
  listCompetitions
} from '@/features/competitions/api/competitionApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: { get: vi.fn() }
}))

const listItemDto = {
  id: 'lanqiao-2026',
  name: '蓝桥杯全国软件和信息技术专业人才大赛',
  edition: '2026',
  category: 'PROGRAMMING',
  level: 'NATIONAL',
  participation_mode: 'TEAM',
  suitable_grade_min: 1,
  suitable_grade_max: 4,
  direction: '软件开发',
  summary: '面向高校学生',
  cover: { id: 'c1', url: 'https://media.example/cover.webp' },
  registration_start_at: '2026-08-01T00:00:00+08:00',
  registration_end_at: '2026-09-10T23:59:59+08:00',
  event_start_at: '2026-10-10T09:00:00+08:00',
  publication_state: 'PUBLISHED',
  registration_state: 'OPEN',
  event_phase: 'UPCOMING',
  official_url: 'https://dasai.lanqiao.cn',
  followed: false
}

const detailDto = {
  ...listItemDto,
  description_md: '比赛简介（Markdown）',
  suitable_for_md: '面向对编程有兴趣的在校学生',
  preparation_advice_md: '提前准备算法基础',
  registration_url: 'https://dasai.lanqiao.cn/login',
  official_notice_url: 'https://dasai.lanqiao.cn/notice',
  college_contact_name: '王老师',
  timeline: [
    { id: 't1', title: '开放报名', event_at: '2026-09-01T00:00:00+08:00', description: '官网注册' }
  ],
  related_guides: [],
  related_announcements: [],
  team_posts: []
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FE-101 竞赛 API 适配器', () => {
  it('listCompetitions 映射查询参数与列表项', async () => {
    vi.mocked(http.get).mockResolvedValue({ count: 1, next: null, previous: null, results: [listItemDto] })

    const result = await listCompetitions({ q: '蓝桥', status: 'CLOSED', format: 'TEAM', page: 2, pageSize: 6 })

    expect(http.get).toHaveBeenCalledWith('/competitions', {
      query: expect.objectContaining({ status: 'ENDED', participation_mode: 'TEAM', page: 2, page_size: 6 })
    })
    expect(result.total).toBe(1)
    expect(result.page).toBe(2)
    expect(result.items[0]).toMatchObject({
      id: 'lanqiao-2026',
      participationMode: 'TEAM',
      detailPath: '/competitions/lanqiao-2026'
    })
    expect(result.items[0]!.cover.src).toBe('https://media.example/cover.webp')
  })

  it('getCompetition 映射详情字段', async () => {
    vi.mocked(http.get).mockResolvedValue(detailDto)

    const detail = await getCompetition('lanqiao-2026')

    expect(detail.intro).toBe('比赛简介（Markdown）')
    expect(detail.whoShouldJoin).toBe('面向对编程有兴趣的在校学生')
    expect(detail.timeline[0]).toMatchObject({ title: '开放报名', date: '2026-09-01T00:00:00+08:00' })
    expect(detail.officialLinks).toEqual([
      { label: '报名入口', url: 'https://dasai.lanqiao.cn/login' },
      { label: '官方通知', url: 'https://dasai.lanqiao.cn/notice' }
    ])
  })
})
