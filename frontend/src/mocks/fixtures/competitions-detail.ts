/**
 * 竞赛详情开发 Fixtures（Mock-First）
 *
 * 规则（database-design.md §1.3 / §36）：
 * - 日期一律 ISO 8601（+08:00）；
 * - 不虚构官方统计；
 * - 展示型区块（亮点 / 参赛要求 / 报名提示）由本文件提供展示文案；
 * - 关联的通知 / 指南 / 组队数据为演示用子集，与首页 fixtures 语义一致；
 * - 这是开发脚手架，不是生产事实。
 */

import type { CompetitionDetail } from '@/features/competitions/types'

/** 蓝桥杯：与参考设计稿一致的完整样例。 */
const lanqiao: CompetitionDetail = {
  id: 'lanqiao-2026',
  name: '蓝桥杯全国软件和信息技术专业人才大赛',
  edition: '2026',
  category: 'PROGRAMMING',
  level: 'NATIONAL',
  participationMode: 'TEAM',
  registrationStartAt: '2026-08-01T00:00:00+08:00',
  registrationEndAt: '2026-09-10T23:59:59+08:00',
  eventStartAt: '2026-10-10T09:00:00+08:00',
  eventEndAt: '2026-10-10T13:00:00+08:00',
  officialUrl: 'https://dasai.lanqiao.cn',
  cover: { alt: '蓝桥杯大赛封面', src: null },
  detailPath: '/competitions/lanqiao-2026',
  brief:
    '面向高校学生，覆盖软件、电子、Python、大数据、人工智能等多个赛项，旨在提升学生的专业技能与实践能力，发现和培养优秀的行业人才。',
  intro:
      '蓝桥杯全国软件和信息技术专业人才大赛是工业和信息化部人才交流中心主办的全国性专业赛事，已连续举办多届，赛事影响力广泛。大赛注重参赛者的实践能力与创新思维，提供丰富的实践平台和行业交流机会。',
    whoShouldJoin:
      '面向对编程与软件开发有兴趣的全日制在校学生（本科、专科），适合有一定编程基础、或希望系统提升算法与工程实践能力的同学。',
  highlights: [
    { icon: 'i-lucide-graduation-cap', title: '面向高校学生', note: '本科 / 专科均可参与' },
    { icon: 'i-lucide-layers', title: '多赛项覆盖', note: '软件 / 电子 / AI 等' },
    { icon: 'i-lucide-badge-check', title: '权威认证', note: '国家级赛事认证' },
    { icon: 'i-lucide-award', title: '荣誉与奖励', note: '证书 / 奖项 / 就业加分' }
  ],
  requirement: {
    audience: '全日制在校学生（本科、专科）',
    teamRequirement: '团队赛（2–3 人 / 队）',
    domains: '软件开发、人工智能、电子、大数据、嵌入式等',
    organizer: '工业和信息化部人才交流中心',
    contactEmail: 'lanqiao@lanqiao.cn'
  },
  timeline: [
    { date: '2026-08-01T00:00:00+08:00', title: '报名开始', description: null },
    {
      date: '2026-09-10T23:59:59+08:00',
      title: '报名截止',
      description: null,
      highlighted: true
    },
    { date: '2026-09-01T00:00:00+08:00', title: '赛前培训（校内组织）', description: null },
    { date: '2026-10-10T09:00:00+08:00', title: '比赛时间', description: '09:00 – 12:00' },
    { date: '2026-11-20T00:00:00+08:00', title: '成绩发布', description: null }
  ],
  registrationTips: [
    '以团队形式报名参赛（2–3 人 / 队）',
    '报名成功后请及时加入校内交流群',
    '赛前培训与模拟题将通过群内通知发布',
    '获奖团队将获得荣誉证书与奖品'
  ],
  officialLinks: [{ label: '蓝桥杯官方网站', url: 'https://dasai.lanqiao.cn' }],
  guidePath: '/qa/guides/lanqiao-guide',
  relatedAnnouncements: [
    {
      id: 'announcement-lanqiao-selection',
      title: '关于举办蓝桥杯校内选拔赛的通知',
      publishedAt: '2026-08-20T10:00:00+08:00',
      detailPath: '/activities/announcements/announcement-lanqiao-selection'
    },
    {
      id: 'announcement-lanqiao-briefing',
      title: '校内宣讲答疑时间安排（第一期）',
      publishedAt: '2026-08-16T14:30:00+08:00',
      detailPath: '/activities/announcements/announcement-lanqiao-briefing'
    },
    {
      id: 'announcement-lanqiao-tracks',
      title: '最新赛项及组队要求说明',
      publishedAt: '2026-08-10T09:00:00+08:00',
      detailPath: '/activities/announcements/announcement-lanqiao-tracks'
    }
  ],
  relatedGuides: [
    {
      id: 'guide-lanqiao-official',
      title: '蓝桥杯官方参赛指南（2025）',
      publishedAt: '2026-08-10T09:00:00+08:00',
      detailPath: '/qa/guides/lanqiao-official'
    },
    {
      id: 'guide-lanqiao-scoring',
      title: '各赛项题型与评分规则说明',
      publishedAt: '2026-08-08T09:00:00+08:00',
      detailPath: '/qa/guides/lanqiao-scoring'
    },
    {
      id: 'guide-lanqiao-experience',
      title: '优秀作品与获奖经验分享',
      publishedAt: '2026-08-04T09:00:00+08:00',
      detailPath: '/qa/guides/lanqiao-experience'
    }
  ],
  recruitingTeams: [
    {
      id: 'team-lanqiao-01',
      title: '一起冲省一！',
      competitionName: '蓝桥杯全国软件和信息技术专业人才大赛 2026',
      baseMemberCount: 2,
      targetMemberCount: 3,
      roles: ['Python', '算法', '大数据'],
      leaderName: '李同学',
      leaderNote: '大二',
      createdAt: '2026-08-22T10:30:00+08:00',
      detailPath: '/teams/team-lanqiao-01'
    },
    {
      id: 'team-lanqiao-02',
      title: 'C++算法冲锋队',
      competitionName: '蓝桥杯全国软件和信息技术专业人才大赛 2026',
      baseMemberCount: 1,
      targetMemberCount: 3,
      roles: ['C/C++', '算法', 'ACM基础'],
      leaderName: '王同学',
      leaderNote: '大二',
      createdAt: '2026-08-21T14:00:00+08:00',
      detailPath: '/teams/team-lanqiao-02'
    }
  ]
}

/** 中国大学生计算机设计大赛（团队赛，含组队信息）。 */
const csdc: CompetitionDetail = {
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
  officialUrl: 'https://www.jsjds.com.cn',
  cover: { alt: '中国大学生计算机设计大赛封面', src: null },
  detailPath: '/competitions/csdc-2026',
  brief:
    '面向在校大学生的计算机类重要赛事，覆盖软件开发、数字媒体、人工智能等多个赛道，注重作品创新性与工程实践能力。',
  intro:
      '中国大学生计算机设计大赛是我国面向在校大学生的重要计算机类赛事，覆盖软件开发、数字媒体、人工智能等多个赛道，注重作品创新性与工程实践能力。大赛以赛促学、以赛促创，为优秀作品提供展示与交流的平台。',
    whoShouldJoin:
      '面向计算机相关专业及对软件开发、数字媒体、人工智能感兴趣的在校大学生，适合已有作品创意并愿意动手实现的团队或个人。',
  highlights: [
    { icon: 'i-lucide-graduation-cap', title: '面向高校学生', note: '本科 / 专科在校生' },
    { icon: 'i-lucide-layers', title: '多赛项覆盖', note: '软件 / 数媒 / AI 等' },
    { icon: 'i-lucide-badge-check', title: '权威认证', note: '国家级赛事认证' },
    { icon: 'i-lucide-award', title: '荣誉与奖励', note: '证书 / 奖项 / 保研加分' }
  ],
  requirement: {
    audience: '在校本科生、专科生',
    teamRequirement: '团队赛（2–5 人 / 队）',
    domains: '计算机设计、软件开发、算法应用、人工智能',
    organizer: '中国大学生计算机设计大赛组委会',
    contactEmail: null
  },
  timeline: [
    { date: '2026-08-01T00:00:00+08:00', title: '报名开始', description: '开放校内报名通道。' },
    {
      date: '2026-08-31T23:59:59+08:00',
      title: '报名截止',
      description: '关闭报名，逾期不可补报。',
      highlighted: true
    },
    { date: '2026-09-20T00:00:00+08:00', title: '校赛 / 初赛', description: '校内作品评审与选拔。' },
    { date: '2026-09-22T23:59:59+08:00', title: '入围公布', description: '公布晋级名单。' }
  ],
  registrationTips: [
    '以团队形式报名参赛，每队 2–5 人',
    '需在报名截止前提交完整作品简介',
    '关注公告获取赛前培训安排'
  ],
  officialLinks: [{ label: '中国大学生计算机设计大赛官网', url: 'https://www.jsjds.com.cn' }],
  guidePath: '/qa/guides/csdc-guide',
  relatedAnnouncements: [
    {
      id: 'announcement-csdc-selection',
      title: '中国大学生计算机设计大赛校内选拔通知',
      publishedAt: '2026-08-16T14:30:00+08:00',
      detailPath: '/activities/announcements/announcement-csdc-selection'
    }
  ],
  relatedGuides: [
    {
      id: 'guide-csdc',
      title: '中国大学生计算机设计大赛申报指南',
      publishedAt: '2026-08-10T08:00:00+08:00',
      detailPath: '/qa/guides/csdc-guide'
    }
  ],
  recruitingTeams: [
    {
      id: 'team-csdc-01',
      title: '软件开发方向组队，缺前端',
      competitionName: '中国大学生计算机设计大赛 2026',
      baseMemberCount: 2,
      targetMemberCount: 4,
      roles: ['前端开发', 'UI 设计'],
      leaderName: '张同学',
      leaderNote: '大三',
      createdAt: '2026-08-20T10:30:00+08:00',
      detailPath: '/teams/team-csdc-01'
    },
    {
      id: 'team-csdc-02',
      title: 'AI 赛道冲击国奖',
      competitionName: '中国大学生计算机设计大赛 2026',
      baseMemberCount: 1,
      targetMemberCount: 3,
      roles: ['模型训练', '答辩'],
      leaderName: '刘同学',
      leaderNote: '大二',
      createdAt: '2026-08-19T14:00:00+08:00',
      detailPath: '/teams/team-csdc-02'
    }
  ]
}

/** 全国大学生数学建模竞赛（团队赛，含组队信息）。 */
const mcm: CompetitionDetail = {
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
  detailPath: '/competitions/mcm-2026',
  brief:
    '要求每队 3 名学生在规定时间内完成给定问题的建模、求解与论文写作，考察数学应用能力与团队协作。',
  intro:
      '全国大学生数学建模竞赛要求每队 3 名学生在规定时间内完成给定问题的建模、求解与论文写作，考察数学应用能力与团队协作。',
    whoShouldJoin:
      '面向具备一定数学基础、热爱建模的在校学生，适合希望锻炼建模、求解与论文写作能力的同学。',
  highlights: [
    { icon: 'i-lucide-graduation-cap', title: '面向高校学生', note: '本科 / 专科在校生' },
    { icon: 'i-lucide-users', title: '参赛形式', note: '团队赛（3 人 / 队）' },
    { icon: 'i-lucide-badge-check', title: '权威认证', note: '国家级赛事认证' },
    { icon: 'i-lucide-award', title: '荣誉与奖励', note: '证书 / 奖项 / 保研加分' }
  ],
  requirement: {
    audience: '本科、专科在校生（每队 3 人）',
    teamRequirement: '团队赛（3 人 / 队）',
    domains: '数学建模、数值计算、论文写作',
    organizer: '中国工业与应用数学学会',
    contactEmail: null
  },
  timeline: [
    { date: '2026-08-15T00:00:00+08:00', title: '报名开始', description: '开放组队报名。' },
    {
      date: '2026-09-10T23:59:59+08:00',
      title: '报名截止',
      description: '截止组队与报名。',
      highlighted: true
    },
    { date: '2026-09-17T18:00:00+08:00', title: '竞赛开始', description: '题目发布，开始作答。' },
    { date: '2026-09-20T20:00:00+08:00', title: '提交论文', description: '提交完整论文。' }
  ],
  registrationTips: [
    '以团队形式报名参赛（3 人 / 队）',
    '报名成功后请留意赛前宣讲安排',
    '竞赛期间须独立完成作答'
  ],
  officialLinks: [],
  guidePath: '/qa/guides/math-modeling',
  relatedAnnouncements: [
    {
      id: 'announcement-mcm-2026',
      title: '关于组织参加 2026 年全国大学生数学建模竞赛的通知',
      publishedAt: '2026-08-18T09:00:00+08:00',
      detailPath: '/activities/announcements/announcement-mcm-2026'
    }
  ],
  relatedGuides: [
    {
      id: 'guide-math-modeling',
      title: '新手如何准备数学建模竞赛',
      publishedAt: '2026-08-15T08:00:00+08:00',
      detailPath: '/qa/guides/math-modeling'
    }
  ],
  recruitingTeams: [
    {
      id: 'team-mcm-2026-01',
      title: '数学建模 2026 组队，缺编程手',
      competitionName: '全国大学生数学建模竞赛 2026',
      baseMemberCount: 2,
      targetMemberCount: 3,
      roles: ['编程手', '论文写作'],
      leaderName: '陈同学',
      leaderNote: '大三',
      createdAt: '2026-08-20T10:30:00+08:00',
      detailPath: '/teams/team-mcm-2026-01'
    }
  ]
}

/** 「挑战杯」全国大学生课外学术科技作品竞赛。 */
const challengeCup: CompetitionDetail = {
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
  detailPath: '/competitions/challenge-cup-2026',
  brief:
    '全国性的大学生课外学术科技作品与创业计划竞赛，鼓励学生围绕真实问题开展研究并形成成果。',
  intro:
      '「挑战杯」是全国性的大学生课外学术科技作品与创业计划竞赛，鼓励学生围绕真实问题开展研究并形成成果。',
    whoShouldJoin:
      '面向有项目成果或研究想法的在校本专科生与研究生，适合组建团队参与学术科技作品与创业计划。',
  highlights: [
    { icon: 'i-lucide-graduation-cap', title: '面向高校学生', note: '本专科生 / 研究生' },
    { icon: 'i-lucide-lightbulb', title: '创新实践', note: '学术科技 / 创业计划' },
    { icon: 'i-lucide-badge-check', title: '权威认证', note: '国家级赛事认证' },
    { icon: 'i-lucide-award', title: '荣誉与奖励', note: '证书 / 奖项 / 项目孵化' }
  ],
  requirement: {
    audience: '在校本专科生、研究生',
    teamRequirement: '团队赛（以项目团队为单位）',
    domains: '课外学术科技作品、创业计划',
    organizer: '共青团中央、中国科协等',
    contactEmail: null
  },
  timeline: [
    { date: '2026-09-01T00:00:00+08:00', title: '报名开始', description: '开放作品申报。' },
    {
      date: '2026-09-30T23:59:59+08:00',
      title: '报名截止',
      description: '截止作品申报。',
      highlighted: true
    },
    { date: '2026-11-15T00:00:00+08:00', title: '终审决赛', description: '现场答辩与评审。' }
  ],
  registrationTips: [
    '以项目团队为单位报名',
    '需提交完整作品申报书',
    '关注公告获取赛前辅导安排'
  ],
  officialLinks: [],
  guidePath: '/qa/guides/innovation-training',
  relatedAnnouncements: [
    {
      id: 'announcement-platform-launch',
      title: '人工智能学院科创与就业服务平台正式上线',
      publishedAt: '2026-08-20T10:00:00+08:00',
      detailPath: '/activities/announcements/announcement-platform-launch'
    }
  ],
  relatedGuides: [
    {
      id: 'guide-innovation-training',
      title: '大学生创新创业训练计划申报指南',
      publishedAt: '2026-08-12T08:00:00+08:00',
      detailPath: '/qa/guides/innovation-training'
    }
  ],
  recruitingTeams: [
    {
      id: 'team-challenge-ai',
      title: '挑战杯智慧农业项目找论文手',
      competitionName: '「挑战杯」全国大学生课外学术科技作品竞赛 2026',
      baseMemberCount: 3,
      targetMemberCount: 4,
      roles: ['论文撰写', '答辩'],
      leaderName: '赵同学',
      leaderNote: '大三',
      createdAt: '2026-08-18T14:00:00+08:00',
      detailPath: '/teams/team-challenge-ai'
    }
  ]
}

/** 按 id 索引的完整详情样例（用于演示全部区块）。 */
export const competitionDetails: Record<string, CompetitionDetail> = {
  'lanqiao-2026': lanqiao,
  'csdc-2026': csdc,
  'mcm-2026': mcm,
  'challenge-cup-2026': challengeCup
}
