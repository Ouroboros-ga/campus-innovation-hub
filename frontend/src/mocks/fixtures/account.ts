/**
 * 账号外壳（FE-070）开发 Fixtures（Mock-First）。
 *
 * 规则：使用占位数据；组织身份不属于账号页（FE-040）；日期 ISO 8601。
 * 不实现在线认证。
 */

import type {
  AccountActivity,
  AccountApplication,
  AccountFollowedCompetition,
  AccountProfile,
  AccountQuestion,
  AccountTeamPost
} from '@/features/account/types'

export const accountProfile: AccountProfile = {
  nickname: '张同学',
  realName: '张明',
  major: '人工智能学院',
  grade: '2023级',
  bio: '关注编程与算法竞赛，乐于组队协作，一起冲击高目标。',
  skills: ['Python', '算法', '数据分析'],
  avatar: { alt: '头像', src: null }
}

export const accountGames: AccountFollowedCompetition[] = [
  {
    id: 'lanqiao-2026',
    name: '蓝桥杯全国软件和信息技术专业人才大赛',
    edition: '2026',
    deadlineAt: '2026-09-10T23:59:59+08:00',
    detailPath: '/competitions/lanqiao-2026',
    followedAt: '2026-08-20T10:00:00+08:00'
  },
  {
    id: 'csdc-2026',
    name: '中国大学生计算机设计大赛',
    edition: '2026',
    deadlineAt: '2026-08-31T23:59:59+08:00',
    detailPath: '/competitions/csdc-2026',
    followedAt: '2026-08-18T09:00:00+08:00'
  },
  {
    id: 'mcm-2026',
    name: '全国大学生数学建模竞赛',
    edition: '2026',
    deadlineAt: '2026-09-10T23:59:59+08:00',
    detailPath: '/competitions/mcm-2026',
    followedAt: '2026-08-15T09:00:00+08:00'
  }
]

export const accountTeamPosts: AccountTeamPost[] = [
  {
    id: 'team-acm-06',
    title: 'ACM 队招 2 名队员',
    competitionName: 'ACM 国际大学生程序设计竞赛 2026',
    position: 'PUBLISHED',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    memberCount: 1,
    targetMemberCount: 3,
    publishedAt: '2026-08-19T14:00:00+08:00',
    detailPath: '/teams/team-acm-06'
  },
  {
    id: 'team-bigdata-07',
    title: '大数据项目找搭子',
    competitionName: '中国大学生计算机设计大赛 2026',
    position: 'PUBLISHED',
    postType: 'PERSON_LOOKING',
    status: 'FULL',
    memberCount: 3,
    targetMemberCount: 3,
    publishedAt: '2026-08-18T10:00:00+08:00',
    detailPath: '/teams/team-bigdata-07'
  },
  {
    id: 'team-math-01',
    title: '数模 2026 组队，缺论文手',
    competitionName: '全国大学生数学建模竞赛 2026',
    position: 'JOINED',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    memberCount: 2,
    targetMemberCount: 3,
    publishedAt: '2026-08-17T09:00:00+08:00',
    detailPath: '/teams/team-math-01'
  }
]

export const accountApplications: AccountApplication[] = [
  {
    id: 'app-team-acm-06',
    targetType: 'TEAM',
    targetName: 'ACM 队招 2 名队员',
    positionName: '算法',
    state: 'PENDING',
    submittedAt: '2026-08-21T11:00:00+08:00',
    detailPath: '/teams/team-acm-06'
  },
  {
    id: 'app-org-ai-union',
    targetType: 'ORG',
    targetName: '人工智能协会 2026 秋季招新',
    positionName: '机器学习方向',
    state: 'ACCEPTED',
    submittedAt: '2026-08-20T15:00:00+08:00',
    detailPath: '/organizations/ai-union/recruitments/ai-union-fall-2026'
  },
  {
    id: 'app-team-math-01',
    targetType: 'TEAM',
    targetName: '数模 2026 组队',
    positionName: '论文写作',
    state: 'REJECTED',
    submittedAt: '2026-08-16T09:00:00+08:00',
    detailPath: '/teams/team-math-01'
  }
]

export const accountActivities: AccountActivity[] = [
  {
    id: 'ai-sharing-4',
    title: '大模型应用实战分享会',
    startAt: '2026-08-24T19:00:00+08:00',
    location: '科技楼 3 楼报告厅',
    registrationState: 'OPEN',
    detailPath: '/activities/ai-sharing-4'
  },
  {
    id: 'mcm-briefing-2026',
    title: '2026 数模竞赛宣讲会',
    startAt: '2026-08-22T19:00:00+08:00',
    location: '图书馆报告厅',
    registrationState: 'CLOSED',
    detailPath: '/activities/mcm-briefing-2026'
  }
]

export const accountQuestions: AccountQuestion[] = [
  {
    id: 'qa-lanqiao-both',
    title: '蓝桥杯省赛和国赛可以同时参加吗？',
    visibility: 'PUBLIC',
    state: 'ANSWERED',
    updatedAt: '2026-08-20T14:00:00+08:00',
    detailPath: '/qa/questions/lanqiao-both'
  },
  {
    id: 'qa-duplicate-rate',
    title: '项目申报的查重率有要求吗？',
    visibility: 'PUBLIC',
    state: 'ANSWERED',
    updatedAt: '2026-08-13T10:00:00+08:00',
    detailPath: '/qa/questions/duplicate-rate'
  }
]
