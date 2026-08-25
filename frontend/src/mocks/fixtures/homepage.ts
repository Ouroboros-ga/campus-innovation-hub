/**
 * 首页开发 Fixtures（Mock-First 开发脚手架）
 *
 * 位置：src/mocks/fixtures/（FrontendImplementationPlan.md FE-005）
 *
 * 规则（FrontendImplementationPlan.md FE-005 / database-design.md）：
 * - 日期一律使用 ISO 8601 字符串（+08:00，Asia/Shanghai 语义）；
 * - 不存放可推导的 UI 显示文本（如「还有 3 天截止」「报名中」），
 *   剩余时间 / 紧迫度 / 状态由 shared/lib/date.ts 运行时派生；
 * - 不虚构浏览量 / 热度等官方统计（database-design.md §28）；
 * - 这是开发脚手架，不是生产事实，不作为真实官方数据展示。
 *
 * 各区块数量遵循 database-design.md §23 的首页小模块上限：
 * 即将截止 <=6 / 热门竞赛 <=8 / 通知公告 <=6 / 热门指南 <=6 /
 * 正在组队 <=6 / 组织招新 <=6 / 近期活动 <=6 / FAQ <=6 / Banner <=4。
 */

import type {
  ActivitySummary,
  AnnouncementSummary,
  CarouselSlide,
  CompetitionSummary,
  DeadlineItem,
  FaqSummary,
  GuideSummary,
  OrganizationRecruitmentSummary,
  TeamRecruitmentSummary
} from '@/shared/types/homepage'

/**
 * 校园轮播（Banner）。图片 src 在占位阶段为空，由展示组件处理缺省封面。
 */
export const carouselSlides: CarouselSlide[] = [
  {
    id: 'banner-innovation-season-2026',
    title: '2026 校园科创季',
    subtitle: '探索科创机会，成就无限可能',
    categoryLabel: '学院科创季',
    image: { alt: '校园科创季主视觉', src: null },
    link: { type: 'INTERNAL', internalPath: '/competitions', externalUrl: null },
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-10-31T23:59:59+08:00',
    sortOrder: 1
  },
  {
    id: 'banner-mcm-2026',
    title: '全国大学生数学建模竞赛 2026',
    subtitle: '报名进行中，组队寻找队友',
    categoryLabel: '重要竞赛',
    image: { alt: '数学建模竞赛报名宣传图', src: null },
    link: { type: 'INTERNAL', internalPath: '/competitions/mcm-2026', externalUrl: null },
    startAt: '2026-08-15T00:00:00+08:00',
    endAt: '2026-09-10T23:59:59+08:00',
    sortOrder: 2
  },
  {
    id: 'banner-recruitment-season',
    title: '组织集中招新季',
    subtitle: '社团组织正在招募新成员',
    categoryLabel: '组织集中招新',
    image: { alt: '学生组织招新宣传图', src: null },
    link: { type: 'INTERNAL', internalPath: '/organizations', externalUrl: null },
    startAt: '2026-08-20T00:00:00+08:00',
    endAt: '2026-09-30T23:59:59+08:00',
    sortOrder: 3
  }
]

/** 即将截止（剩余时间 / 紧迫度由工具派生）。 */
export const deadlineItems: DeadlineItem[] = [
  {
    id: 'deadline-csdc-2026',
    kind: 'COMPETITION',
    title: '中国大学生计算机设计大赛 2026 报名',
    deadlineAt: '2026-08-31T23:59:59+08:00',
    detailPath: '/competitions/csdc-2026'
  },
  {
    id: 'deadline-ai-sharing',
    kind: 'ACTIVITY',
    title: 'AI 前沿技术分享会（第 4 期）报名',
    deadlineAt: '2026-08-28T18:00:00+08:00',
    detailPath: '/activities/ai-sharing-4'
  },
  {
    id: 'deadline-stu-union-recruit',
    kind: 'RECRUITMENT',
    title: '人工智能学院学生会 2026 秋季招新',
    deadlineAt: '2026-09-05T23:59:59+08:00',
    detailPath: '/organizations/ai-union/recruitments/fall-2026'
  },
  {
    id: 'deadline-lanqiao-2026',
    kind: 'COMPETITION',
    title: '蓝桥杯全国软件大赛 2026 校内选拔',
    deadlineAt: '2026-09-10T23:59:59+08:00',
    detailPath: '/competitions/lanqiao-2026'
  },
  {
    id: 'deadline-robot-lab-recruit',
    kind: 'RECRUITMENT',
    title: '机器人创新实验室 2026 招新',
    deadlineAt: '2026-09-12T23:59:59+08:00',
    detailPath: '/organizations/robot-lab/recruitments/fall-2026'
  }
]

/** 首页热门竞赛（状态 / 剩余时间由工具派生）。 */
export const hotCompetitions: CompetitionSummary[] = [
  {
    id: 'csdc-2026',
    name: '中国大学生计算机设计大赛',
    edition: '2026',
    category: 'PROGRAMMING',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-01T00:00:00+08:00',
    registrationEndAt: '2026-08-31T23:59:59+08:00',
    eventStartAt: '2026-09-20T00:00:00+08:00',
    eventEndAt: '2026-09-22T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '中国大学生计算机设计大赛封面', src: null },
    detailPath: '/competitions/csdc-2026'
  },
  {
    id: 'mcm-2026',
    name: '全国大学生数学建模竞赛',
    edition: '2026',
    category: 'MATHEMATICAL_MODELING',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-15T00:00:00+08:00',
    registrationEndAt: '2026-09-10T23:59:59+08:00',
    eventStartAt: '2026-09-17T18:00:00+08:00',
    eventEndAt: '2026-09-20T20:00:00+08:00',
    officialUrl: null,
    cover: { alt: '全国大学生数学建模竞赛封面', src: null },
    detailPath: '/competitions/mcm-2026'
  },
  {
    id: 'lanqiao-2026',
    name: '蓝桥杯全国软件和信息技术专业人才大赛',
    edition: '2026',
    category: 'PROGRAMMING',
    level: 'NATIONAL',
    participationMode: 'INDIVIDUAL',
    registrationStartAt: '2026-08-01T00:00:00+08:00',
    registrationEndAt: '2026-09-10T23:59:59+08:00',
    eventStartAt: '2026-10-10T09:00:00+08:00',
    eventEndAt: '2026-10-10T13:00:00+08:00',
    officialUrl: null,
    cover: { alt: '蓝桥杯大赛封面', src: null },
    detailPath: '/competitions/lanqiao-2026'
  },
  {
    id: 'challenge-cup-2026',
    name: '「挑战杯」全国大学生课外学术科技作品竞赛',
    edition: '2026',
    category: 'INNOVATION',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-09-01T00:00:00+08:00',
    registrationEndAt: '2026-09-30T23:59:59+08:00',
    eventStartAt: '2026-11-15T00:00:00+08:00',
    eventEndAt: '2026-11-18T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '挑战杯竞赛封面', src: null },
    detailPath: '/competitions/challenge-cup-2026'
  },
  {
    id: 'icpc-regional-2026',
    name: 'ICPC 国际大学生程序设计竞赛（区域赛）',
    edition: '2026',
    category: 'PROGRAMMING',
    level: 'INTERNATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-09-01T00:00:00+08:00',
    registrationEndAt: '2026-09-22T23:59:59+08:00',
    eventStartAt: '2026-11-01T00:00:00+08:00',
    eventEndAt: '2026-11-01T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: 'ICPC 区域赛封面', src: null },
    detailPath: '/competitions/icpc-regional-2026'
  }
]

/** 正在组队（当前人数由 base + accepted 派生，此处仅存基础事实）。 */
export const recruitTeams: TeamRecruitmentSummary[] = [
  {
    id: 'team-mcm-2026-01',
    title: '数学建模 2026 组队，缺编程手',
    postType: 'TEAM_RECRUITING',
    competitionName: '全国大学生数学建模竞赛 2026',
    baseMemberCount: 2,
    targetMemberCount: 3,
    roles: ['编程手'],
    createdAt: '2026-08-20T10:30:00+08:00',
    detailPath: '/teams/team-mcm-2026-01'
  },
  {
    id: 'team-challenge-ai',
    title: '挑战杯智慧农业项目找论文手',
    postType: 'TEAM_RECRUITING',
    competitionName: '「挑战杯」全国大学生课外学术科技作品竞赛 2026',
    baseMemberCount: 3,
    targetMemberCount: 4,
    roles: ['论文撰写', '答辩'],
    createdAt: '2026-08-18T14:00:00+08:00',
    detailPath: '/teams/team-challenge-ai'
  },
  {
    id: 'team-icpc-lookup',
    title: '个人找 ICPC 队伍，C++ / 算法竞赛',
    postType: 'PERSON_LOOKING',
    competitionName: 'ICPC 国际大学生程序设计竞赛（区域赛）2026',
    baseMemberCount: 1,
    targetMemberCount: 3,
    roles: ['主力队员'],
    createdAt: '2026-08-22T09:15:00+08:00',
    detailPath: '/teams/team-icpc-lookup'
  }
]

/** 正在招新的组织（招新状态由工具派生，此处存基础事实）。 */
export const recruitingOrganizations: OrganizationRecruitmentSummary[] = [
  {
    id: 'recruit-ai-union-fall-2026',
    organizationId: 'ai-union',
    organizationName: '人工智能学院学生会',
    organizationType: 'STUDENT_CLUB',
    recruitmentId: 'ai-union-fall-2026',
    recruitmentTitle: '人工智能学院学生会 2026 秋季招新',
    positions: [
      { name: '办公室干事', headcount: 4 },
      { name: '宣传部干事', headcount: 3 }
    ],
    applyStartAt: '2026-08-20T00:00:00+08:00',
    applyEndAt: '2026-09-05T23:59:59+08:00',
    organizationPath: '/organizations/ai-union',
    recruitmentPath: '/organizations/ai-union/recruitments/fall-2026'
  },
  {
    id: 'recruit-robot-lab-fall-2026',
    organizationId: 'robot-lab',
    organizationName: '机器人创新实验室',
    organizationType: 'LABORATORY',
    recruitmentId: 'robot-lab-fall-2026',
    recruitmentTitle: '机器人创新实验室 2026 招新',
    positions: [
      { name: '嵌入式开发', headcount: 5 },
      { name: '机械结构', headcount: 3 }
    ],
    applyStartAt: '2026-08-22T00:00:00+08:00',
    applyEndAt: '2026-09-12T23:59:59+08:00',
    organizationPath: '/organizations/robot-lab',
    recruitmentPath: '/organizations/robot-lab/recruitments/fall-2026'
  },
  {
    id: 'recruit-cs-club-fall-2026',
    organizationId: 'cs-club',
    organizationName: '计算机协会',
    organizationType: 'STUDENT_CLUB',
    recruitmentId: 'cs-club-fall-2026',
    recruitmentTitle: '计算机协会 2026 秋季招新',
    positions: [{ name: '技术部成员', headcount: 6 }],
    applyStartAt: '2026-08-25T00:00:00+08:00',
    applyEndAt: '2026-09-15T23:59:59+08:00',
    organizationPath: '/organizations/cs-club',
    recruitmentPath: '/organizations/cs-club/recruitments/fall-2026'
  }
]

/** 近期活动（报名状态由工具派生）。 */
export const recentActivities: ActivitySummary[] = [
  {
    id: 'ai-sharing-4',
    title: 'AI 前沿技术分享会（第 4 期）',
    activityType: 'TECH_SHARING',
    summary: '大模型与智能体工程实践分享',
    startAt: '2026-09-02T19:00:00+08:00',
    endAt: '2026-09-02T21:00:00+08:00',
    location: '人工智能学院报告厅',
    organizerName: '人工智能学院学生会',
    registrationRequired: true,
    registrationEndAt: '2026-08-28T18:00:00+08:00',
    cover: { alt: 'AI 前沿技术分享会封面', src: null },
    detailPath: '/activities/ai-sharing-4'
  },
  {
    id: 'mcm-briefing-2026',
    title: '数学建模竞赛 2026 赛前宣讲会',
    activityType: 'COMPETITION_BRIEFING',
    summary: '选题、建模与论文写作攻略',
    startAt: '2026-08-29T14:00:00+08:00',
    endAt: '2026-08-29T16:00:00+08:00',
    location: '第一教学楼 201',
    organizerName: '人工智能学院',
    registrationRequired: false,
    registrationEndAt: null,
    cover: { alt: '数学建模宣讲会封面', src: null },
    detailPath: '/activities/mcm-briefing-2026'
  },
  {
    id: 'further-study-sharing',
    title: '研究生升学经验分享会',
    activityType: 'FURTHER_STUDY',
    summary: '保研与考研经验交流',
    startAt: '2026-09-10T19:00:00+08:00',
    endAt: '2026-09-10T21:00:00+08:00',
    location: '人工智能学院报告厅',
    organizerName: '人工智能学院学生会',
    registrationRequired: true,
    registrationEndAt: '2026-09-08T23:59:59+08:00',
    cover: { alt: '升学经验分享会封面', src: null },
    detailPath: '/activities/further-study-sharing'
  }
]

/** 通知公告（日期展示由工具派生）。 */
export const announcementList: AnnouncementSummary[] = [
  {
    id: 'announcement-mcm-2026',
    title: '关于组织参加 2026 年全国大学生数学建模竞赛的通知',
    publishedAt: '2026-08-18T09:00:00+08:00',
    detailPath: '/announcements/mcm-2026'
  },
  {
    id: 'announcement-platform-launch',
    title: '人工智能学院科创与就业服务平台正式上线',
    publishedAt: '2026-08-20T10:00:00+08:00',
    detailPath: '/announcements/platform-launch'
  },
  {
    id: 'announcement-csdc-selection',
    title: '中国大学生计算机设计大赛校内选拔通知',
    publishedAt: '2026-08-16T14:30:00+08:00',
    detailPath: '/announcements/csdc-selection'
  }
]

/** 热门指南（分类为稳定枚举）。 */
export const guideList: GuideSummary[] = [
  {
    id: 'guide-math-modeling',
    title: '新手如何准备数学建模竞赛',
    category: 'COMPETITION',
    summary: '从组队、选题到论文写作的完整路径',
    publishedAt: '2026-08-15T08:00:00+08:00',
    detailPath: '/qa/guides/math-modeling'
  },
  {
    id: 'guide-innovation-training',
    title: '大学生创新创业训练计划申报指南',
    category: 'PROCESS',
    summary: '申报流程、材料准备与常见问题',
    publishedAt: '2026-08-12T08:00:00+08:00',
    detailPath: '/qa/guides/innovation-training'
  },
  {
    id: 'guide-research-start',
    title: '面向新生的科研入门指南',
    category: 'RESEARCH',
    summary: '如何进入实验室并开始科研',
    publishedAt: '2026-08-10T08:00:00+08:00',
    detailPath: '/qa/guides/research-start'
  }
]

/** 常见问题。 */
export const faqList: FaqSummary[] = [
  {
    id: 'faq-how-register-competition',
    category: 'COMPETITION',
    question: '如何报名参加一项竞赛？',
    detailPath: '/qa/questions/how-register-competition'
  },
  {
    id: 'faq-how-create-team',
    category: 'TEAM',
    question: '如何发布组队或寻找队友？',
    detailPath: '/qa/questions/how-create-team'
  },
  {
    id: 'faq-cancel-activity',
    category: 'ACTIVITY',
    question: '活动报名后可以取消吗？',
    detailPath: '/qa/questions/cancel-activity'
  },
  {
    id: 'faq-join-organization',
    category: 'ORGANIZATION',
    question: '如何加入一个学生组织？',
    detailPath: '/qa/questions/join-organization'
  }
]

/** 首页各区块 fixture 的聚合导出，便于一次性导入。 */
export const homepageFixtures = {
  carouselSlides,
  deadlineItems,
  hotCompetitions,
  recruitTeams,
  recruitingOrganizations,
  recentActivities,
  announcementList,
  guideList,
  faqList
} as const
