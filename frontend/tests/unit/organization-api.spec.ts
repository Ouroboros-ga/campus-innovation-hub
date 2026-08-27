import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applyToRecruitment,
  getOrganization,
  getRecruitment,
  listOrganizations,
  withdrawRecruitmentApplication
} from '@/features/organizations/api/organizationApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn() }
}))

const listItemDto = {
  id: 'ai-union',
  name: '人工智能协会',
  organization_type: 'STUDENT_CLUB' as const,
  short_intro: '共建 AI 前沿技术，分享交流成长。',
  logo: { id: 'l1', url: 'https://media.example.edu/ai-union.webp' },
  is_recruiting: true
}

const detailDto = {
  ...listItemDto,
  description_md: '面向全校的 AI 技术社群（Markdown）',
  direction: '机器学习 / 计算机视觉 / 自然语言处理',
  founded_at: '2018-09-01T00:00:00+08:00',
  member_count: 286,
  college: '人工智能学院',
  advisors: [{ membership_id: 'adv-1', user_id: 'teacher-1', public_name: '王丽华', display_name: '王丽华', department: '人工智能学院', academic_title: '教授', public_email: 'wang@ai.edu.cn', office_location: '科研楼 210', research_interests: ['机器学习', '自然语言处理'], title: '指导老师' }],
  leaders: [],
  can_manage: null,
  current_user_organization_role: null,
  leader_name: '张同学',
  leader_title: '会长',
  leader_grade: '2023级',
  contact_email: 'ai.association@ai.edu.cn',
  contact_phone: '010-1234 5678',
  contact_address: '科技楼 3 楼',
  wechat_name: 'AI 人工智能协会',
  public_contact: 'ai-union@example.edu.cn',
  current_recruitments: [
    {
      id: 'ai-union-fall-2026',
      title: '人工智能协会 2026 秋季招新',
      apply_start_at: '2026-08-20T00:00:00+08:00',
      apply_end_at: '2026-09-05T23:59:59+08:00',
      publication_state: 'PUBLISHED' as const
    }
  ],
  recent_activities: [
    {
      id: 'a1',
      title: '大模型应用实战分享会',
      start_at: '2026-08-24T19:00:00+08:00',
      detail_path: '/activities/a1'
    }
  ],
  is_leader: false
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FE-103 组织 API 适配器', () => {
  it('listOrganizations 映射列表项（is_recruiting -> 最小招新）', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [listItemDto]
    })

    const result = await listOrganizations({
      q: 'AI',
      organizationType: 'STUDENT_CLUB',
      recruiting: true,
      page: 1,
      pageSize: 12
    })

    expect(http.get).toHaveBeenCalledWith('/organizations', {
      query: {
        q: 'AI',
        organization_type: 'STUDENT_CLUB',
        recruiting: 'true',
        page: 1,
        page_size: 12
      }
    })
    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({
      id: 'ai-union',
      name: '人工智能协会',
      type: 'STUDENT_CLUB',
      description: '共建 AI 前沿技术，分享交流成长。',
      detailPath: '/organizations/ai-union',
      recruitmentPath: null,
      recruitment: {
        id: '',
        title: '',
        publicationState: 'PUBLISHED'
      }
    })
    expect(result.items[0]!.logo.src).toBe('https://media.example.edu/ai-union.webp')
  })

  it('listOrganizations 在 is_recruiting=false 时给出 null 招新', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...listItemDto, is_recruiting: false }]
    })

    const result = await listOrganizations({})
    expect(result.items[0]!.recruitment).toBeNull()
  })

  it('getOrganization 映射主页全字段与当前招新', async () => {
    vi.mocked(http.get).mockResolvedValue(detailDto)

    const detail = await getOrganization('ai-union')

    expect(http.get).toHaveBeenCalledWith('/organizations/ai-union')
    expect(detail).toMatchObject({
      name: '人工智能协会',
      descriptionMd: '面向全校的 AI 技术社群（Markdown）',
      direction: '机器学习 / 计算机视觉 / 自然语言处理',
      foundedAt: '2018-09-01T00:00:00+08:00',
      memberCount: 286,
      college: '人工智能学院',
      leaderName: '张同学',
      contactEmail: 'ai.association@ai.edu.cn'
    })
    expect(detail.advisors[0]).toMatchObject({ publicName: '王丽华', academicTitle: '教授' })
    expect(detail.recentActivities[0]).toMatchObject({
      title: '大模型应用实战分享会',
      detailPath: '/activities/a1'
    })
    expect(detail.currentRecruitments[0]).toMatchObject({
      id: 'ai-union-fall-2026',
      title: '人工智能协会 2026 秋季招新',
      publicationState: 'PUBLISHED'
    })
  })

  it('getRecruitment 补拉组织以映射 type/logo', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        id: 'ai-union-fall-2026',
        organization_id: 'ai-union',
        organization_name: '人工智能协会',
        title: '人工智能协会 2026 秋季招新',
        intro_md: '欢迎加入（Markdown）',
        apply_start_at: '2026-08-20T00:00:00+08:00',
        apply_end_at: '2026-09-05T23:59:59+08:00',
        target_grade_min: 1,
        target_grade_max: 4,
        notes_md: '面试安排在 9 月上旬。',
        publication_state: 'PUBLISHED',
        positions: [
          {
            id: 'ai-union-ml',
            name: '机器学习方向',
            headcount: 12,
            description_md: '参与模型开发与论文复现。',
            requirements_md: '熟悉 Python，了解一种深度学习框架。'
          }
        ]
      })
      .mockResolvedValueOnce(detailDto)

    const detail = await getRecruitment('ai-union-fall-2026')

    expect(detail).toMatchObject({
      id: 'ai-union-fall-2026',
      title: '人工智能协会 2026 秋季招新',
      introMd: '欢迎加入（Markdown）',
      publicationState: 'PUBLISHED',
      organization: {
        name: '人工智能协会',
        type: 'STUDENT_CLUB',
        detailPath: '/organizations/ai-union'
      }
    })
    expect(detail.positions[0]).toMatchObject({
      name: '机器学习方向',
      headcount: 12,
      description: '参与模型开发与论文复现。',
      requirements: '熟悉 Python，了解一种深度学习框架。'
    })
  })

  it('applyToRecruitment 发送申请负载', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)

    await applyToRecruitment('ai-union-fall-2026', {
      positionId: 'ai-union-ml',
      selfIntro: '我是 AI 专业学生',
      skills: 'Python',
      experience: '一次竞赛经历',
      motivation: '想加入机器学习方向'
    })

    expect(http.post).toHaveBeenCalledWith('/recruitments/ai-union-fall-2026/applications', {
      position_id: 'ai-union-ml',
      self_intro: '我是 AI 专业学生',
      skills: 'Python',
      experience: '一次竞赛经历',
      motivation: '想加入机器学习方向'
    })
  })

  it('withdrawRecruitmentApplication 发送撤回请求', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)

    await withdrawRecruitmentApplication('app-1')

    expect(http.post).toHaveBeenCalledWith('/recruitment-applications/app-1/withdraw')
  })
})
