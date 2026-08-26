import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyToTeam,
  createTeam,
  getTeam,
  listTeams
} from '@/features/teams/api/teamApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn() }
}))

const listItemDto = {
  id: 'team-algo-01',
  post_type: 'TEAM_RECRUITING' as const,
  title: '智能算法突破小队',
  competition_id: 'lanqiao',
  competition_name: '第十六届蓝桥杯大赛',
  team_name: null,
  direction: '蓝桥杯 / 智能算法赛项',
  base_member_count: 2,
  target_member_count: 5,
  current_member_count: 2,
  members_summary: '已有 2 名成员',
  goal: '目标冲击省赛一等奖',
  weekly_commitment: '每周约 8 小时',
  roles: [
    { id: 'r1', name: '算法设计', headcount: 2, skills: 'Python, 机器学习' },
    { id: 'r2', name: '数据分析', headcount: 1, skills: 'Python, 算法设计' }
  ],
  status: 'RECRUITING' as const,
  author: { id: 'u1', nickname: '李同学', avatar: null },
  created_at: '2026-08-20T10:00:00+08:00'
}

const detailDto = {
  ...listItemDto,
  notes_md: '详细目标说明（Markdown 正文）',
  my_application_state: 'PENDING' as const,
  creator_bio: '人工智能学院 2024 级本科生'
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FE-102 队伍 API 适配器', () => {
  it('listTeams 映射查询参数与列表项', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [listItemDto]
    })

    const result = await listTeams({
      q: '蓝桥',
      competitionId: 'lanqiao',
      postType: 'TEAM_RECRUITING',
      status: 'RECRUITING',
      page: 2,
      pageSize: 6
    })

    expect(http.get).toHaveBeenCalledWith('/teams', {
      query: {
        q: '蓝桥',
        competition_id: 'lanqiao',
        post_type: 'TEAM_RECRUITING',
        status: 'RECRUITING',
        page: 2,
        page_size: 6
      }
    })
    expect(result.total).toBe(1)
    expect(result.page).toBe(2)
    expect(result.items[0]).toMatchObject({
      id: 'team-algo-01',
      postType: 'TEAM_RECRUITING',
      status: 'RECRUITING',
      competitionName: '第十六届蓝桥杯大赛',
      roles: ['算法设计', '数据分析'],
      skills: ['Python', '机器学习', '算法设计'],
      creatorName: '李同学',
      isOwned: false,
      detailPath: '/teams/team-algo-01'
    })
  })

  it('getTeam 映射详情字段与本人申请状态', async () => {
    vi.mocked(http.get).mockResolvedValue(detailDto)

    const detail = await getTeam('team-algo-01')

    expect(http.get).toHaveBeenCalledWith('/teams/team-algo-01')
    expect(detail).toMatchObject({
      direction: '蓝桥杯 / 智能算法赛项',
      currentMembers: '已有 2 名成员',
      expectedEffort: '每周约 8 小时',
      intro: '详细目标说明（Markdown 正文）',
      creatorBio: '人工智能学院 2024 级本科生',
      myApplicationState: 'PENDING'
    })
  })

  it('getTeam 在 notes_md 缺省时回退到 goal', async () => {
    vi.mocked(http.get).mockResolvedValue({ ...detailDto, notes_md: null })

    const detail = await getTeam('team-algo-01')

    expect(detail.intro).toBe('目标冲击省赛一等奖')
  })

  it('createTeam 发送契约负载并映射详情', async () => {
    vi.mocked(http.post).mockResolvedValue(detailDto)

    await createTeam({
      competitionId: 'lanqiao',
      postType: 'TEAM_RECRUITING',
      title: '智能算法突破小队',
      teamName: '算法冲锋队',
      direction: '蓝桥杯 / 智能算法赛项',
      baseMemberCount: 2,
      targetMemberCount: 5,
      currentMembers: '已有 2 名成员',
      roles: ['算法设计', '数据分析'],
      skills: ['Python', '机器学习'],
      goal: '目标冲击省赛一等奖',
      expectedEffort: '每周约 8 小时',
      contact: 'wx: lee',
      notes: '补充说明'
    })

    expect(http.post).toHaveBeenCalledWith('/teams', {
      competition_id: 'lanqiao',
      post_type: 'TEAM_RECRUITING',
      title: '智能算法突破小队',
      team_name: '算法冲锋队',
      direction: '蓝桥杯 / 智能算法赛项',
      members_summary: '已有 2 名成员',
      base_member_count: 2,
      target_member_count: 5,
      goal: '目标冲击省赛一等奖',
      weekly_commitment: '每周约 8 小时',
      contact_method: 'OTHER',
      contact_value: 'wx: lee',
      notes_md: '补充说明',
      roles: [
        { name: '算法设计', headcount: 1, requirements: '', skills: 'Python, 机器学习' },
        { name: '数据分析', headcount: 1, requirements: '', skills: 'Python, 机器学习' }
      ]
    })
  })

  it('applyToTeam 发送申请负载', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)

    await applyToTeam('team-algo-01', {
      selfIntro: '我是 XX 专业学生',
      skills: 'Python',
      experience: '两次省赛经历',
      motivation: '想加入算法小队',
      weeklyCommitment: '每周 8 小时',
      contact: 'wx: lee'
    })

    expect(http.post).toHaveBeenCalledWith('/teams/team-algo-01/applications', {
      self_intro: '我是 XX 专业学生',
      skills: 'Python',
      experience: '两次省赛经历',
      motivation: '想加入算法小队',
      weekly_commitment: '每周 8 小时',
      contact_method: 'OTHER',
      contact_value: 'wx: lee'
    })
  })
})
