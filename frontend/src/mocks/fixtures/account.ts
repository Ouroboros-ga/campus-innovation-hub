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
  identityType: 'STUDENT',
  nickname: '张同学',
  realName: '张明',
  studentNo: '20230001',
  major: '人工智能学院',
  grade: '2023级',
  bio: '关注编程与算法竞赛，乐于组队协作，一起冲击高目标。',
  skills: ['算法爱好者', '团队协作', '竞赛参与者'],
  avatar: { alt: '头像', src: null }
}

export const accountGames: AccountFollowedCompetition[] = [
  {
    id: 'ccpc-2024',
    name: '中国大学生程序设计竞赛（CCPC）',
    edition: '2024',
    deadlineAt: '2024-06-15T23:59:59+08:00',
    detailPath: '/competitions/ccpc-2024',
    followedAt: '2024-06-14T10:24:00+08:00'
  },
  {
    id: 'lanqiao-2024',
    name: '蓝桥杯全国软件和信息技术专业人才大赛',
    edition: '2024',
    deadlineAt: '2024-06-01T23:59:59+08:00',
    detailPath: '/competitions/lanqiao-2024',
    followedAt: '2024-05-30T09:00:00+08:00'
  },
  {
    id: 'huawei-ict-2024',
    name: '华为 ICT 大赛',
    edition: '2024',
    deadlineAt: '2024-07-20T23:59:59+08:00',
    detailPath: '/competitions/huawei-ict-2024',
    followedAt: '2024-06-18T09:00:00+08:00'
  },
  {
    id: 'lanqiao-2026',
    name: '全国大学生信息安全竞赛',
    edition: '2026',
    deadlineAt: '2026-09-10T23:59:59+08:00',
    detailPath: '/competitions/infosec-2026',
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
    id: 'team-ai-explorer',
    title: 'AI 探索者小队',
    competitionName: '“智汇未来”人工智能创新挑战赛',
    position: 'PUBLISHED',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    memberCount: 5,
    targetMemberCount: 6,
    publishedAt: '2024-05-19T10:00:00+08:00',
    detailPath: '/teams/team-ai-explorer'
  },
  {
    id: 'team-algo-advance',
    title: '算法进阶学习组',
    competitionName: '2024 高校算法精英大赛',
    position: 'JOINED',
    postType: 'TEAM_RECRUITING',
    status: 'RECRUITING',
    memberCount: 8,
    targetMemberCount: 10,
    publishedAt: '2024-05-18T10:00:00+08:00',
    detailPath: '/teams/team-algo-advance'
  },
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
    id: 'app-zhihui-2024',
    targetType: 'TEAM',
    targetName: '“智汇未来”人工智能创新挑战赛',
    positionName: 'AI 探索者小队',
    state: 'PENDING',
    submittedAt: '2024-05-20T14:32:00+08:00',
    detailPath: '/teams/team-ai-explorer'
  },
  {
    id: 'app-algo-elite-2024',
    targetType: 'TEAM',
    targetName: '2024 高校算法精英大赛',
    positionName: 'Byte Knights',
    state: 'ACCEPTED',
    submittedAt: '2024-05-10T09:15:00+08:00',
    detailPath: '/teams/team-algo-advance'
  },
  {
    id: 'app-incubation-1',
    targetType: 'ORG',
    targetName: '科创项目孵化计划（第一期）',
    positionName: null,
    state: 'REJECTED',
    submittedAt: '2024-04-28T18:40:00+08:00',
    detailPath: '/organizations/incubation-1'
  },
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
    id: 'math-competition-15',
    title: '第十五届全国大学生数学竞赛宣讲会',
    startAt: '2024-05-25T14:00:00+08:00',
    location: '图书馆报告厅',
    registrationState: 'OPEN',
    detailPath: '/activities/math-competition-15'
  },
  {
    id: 'algo-camp-4',
    title: '算法训练营（第 4 期）',
    startAt: '2024-05-28T19:00:00+08:00',
    location: '科技楼 3 楼报告厅',
    registrationState: 'OPEN',
    detailPath: '/activities/algo-camp-4'
  },
  {
    id: 'project-share-0602',
    title: '科创项目路演分享会',
    startAt: '2024-06-02T10:00:00+08:00',
    location: '创新创业中心',
    registrationState: 'OPEN',
    detailPath: '/activities/project-share-0602'
  },
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

export interface AccountTimelineItem {
  id: string
  title: string
  description: string
  timeLabel: string
  icon: string
  iconColor: 'primary' | 'success' | 'neutral'
  tone: 'default' | 'primary'
}

export const accountTimeline: AccountTimelineItem[] = [
  {
    id: 'tl-follow-ccpc',
    title: '你关注了竞赛',
    description: 'CCPC 竞赛',
    timeLabel: '10:24',
    icon: 'i-lucide-heart',
    iconColor: 'primary',
    tone: 'default'
  },
  {
    id: 'tl-app-accepted',
    title: '你的申请已通过',
    description: '2024 高校算法精英大赛',
    timeLabel: '昨天',
    icon: 'i-lucide-badge-check',
    iconColor: 'success',
    tone: 'default'
  },
  {
    id: 'tl-team-update',
    title: '团队“AI探索者小队”有了新进展',
    description: '提交了项目计划书',
    timeLabel: '05-20',
    icon: 'i-lucide-users',
    iconColor: 'neutral',
    tone: 'default'
  },
  {
    id: 'tl-qa-reply',
    title: '收到新的咨询回复',
    description: '关于大创项目申报的撰写规范咨询',
    timeLabel: '05-19',
    icon: 'i-lucide-message-circle',
    iconColor: 'neutral',
    tone: 'default'
  }
]
