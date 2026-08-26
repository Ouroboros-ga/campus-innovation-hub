/**
 * 校园动态开发 Fixtures（Mock-First 开发脚手架）
 *
 * 位置：src/mocks/fixtures/（FrontendImplementationPlan.md FE-005 / FE-050）
 *
 * 规则（database-design.md §1.3 / §36 / §28）：
 * - 日期一律 ISO 8601（+08:00）；可推导展示文本（报名中/即将开始/剩余天数）
 *   由 shared/lib/date.ts 运行时派生，不写入此处；
 * - 报名状态 / 阶段在测试中根据 `now` 断言，保证枚举值一致；
 * - 不虚构浏览量 / 热度等官方统计；
 * - 这是开发脚手架，不是生产事实。
 */

import type {
  DynamicsActivity,
  DynamicsAnnouncement
} from '@/features/dynamics/types'

const cover = (alt: string) => ({ alt, src: null })

/** 活动（覆盖 NOT_REQUIRED / OPEN / UPCOMING / CLOSED 与多种类型）。 */
export const dynamicsActivities: DynamicsActivity[] = [
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
    registrationStartAt: '2026-08-20T00:00:00+08:00',
    registrationEndAt: '2026-08-28T18:00:00+08:00',
    capacity: 120,
    speaker: '王教授',
    descriptionMd:
      '本期分享聚焦大模型与智能体工程实践，含现场答疑。\n\n**适合人群**：对人工智能应用感兴趣的同学。',
    cover: cover('AI 前沿技术分享会封面'),
    detailPath: '/activities/ai-sharing-4',
    isFeatured: true
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
    registrationStartAt: null,
    registrationEndAt: null,
    capacity: null,
    speaker: '李老师',
    descriptionMd: '为报名数学建模校赛的同学做赛前指引。',
    cover: cover('数学建模宣讲会封面'),
    detailPath: '/activities/mcm-briefing-2026',
    isFeatured: false
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
    registrationStartAt: '2026-08-28T00:00:00+08:00',
    registrationEndAt: '2026-09-08T23:59:59+08:00',
    capacity: 80,
    speaker: '多位学长学姐',
    descriptionMd: '保研政策、考研复习规划与面试经验。',
    cover: cover('升学经验分享会封面'),
    detailPath: '/activities/further-study-sharing',
    isFeatured: false
  },
  {
    id: 'research-training-camp',
    title: '科研潜才训练营开营讲座',
    activityType: 'RESEARCH_LECTURE',
    summary: '走进科研：从选题到入门',
    startAt: '2026-09-05T15:00:00+08:00',
    endAt: '2026-09-05T17:00:00+08:00',
    location: '人工智能学院学术报告厅',
    organizerName: '人工智能学院',
    registrationRequired: true,
    registrationStartAt: '2026-08-27T00:00:00+08:00',
    registrationEndAt: '2026-09-03T23:59:59+08:00',
    capacity: 60,
    speaker: '张教授',
    descriptionMd: '面向新生的科研入门路径讲解。',
    cover: cover('科研讲座封面'),
    detailPath: '/activities/research-training-camp',
    isFeatured: false
  },
  {
    id: 'enterprise-visit-fall-2026',
    title: '人工智能企业参访（2026 秋季）',
    activityType: 'ENTERPRISE',
    summary: '走进本地 AI 头部企业',
    startAt: '2026-09-15T13:00:00+08:00',
    endAt: '2026-09-15T18:00:00+08:00',
    location: '校外（统一乘车）',
    organizerName: '人工智能学院',
    registrationRequired: true,
    registrationStartAt: '2026-09-01T00:00:00+08:00',
    registrationEndAt: '2026-09-12T23:59:59+08:00',
    capacity: 40,
    speaker: null,
    descriptionMd: '实地参访 + 企业导师交流。',
    cover: cover('企业参访封面'),
    detailPath: '/activities/enterprise-visit-fall-2026',
    isFeatured: false
  },
  {
    id: 'python-training',
    title: 'Python 数据分析实战培训',
    activityType: 'TRAINING',
    summary: '从数据处理到可视化',
    startAt: '2026-09-08T19:00:00+08:00',
    endAt: '2026-09-08T21:00:00+08:00',
    location: '人工智能学院实验室',
    organizerName: '人工智能学院学生会',
    registrationRequired: true,
    registrationStartAt: '2026-08-25T00:00:00+08:00',
    registrationEndAt: '2026-09-06T23:59:59+08:00',
    capacity: 30,
    speaker: '陈老师',
    descriptionMd: '面向零基础的 Python 数据分析实训。',
    cover: cover('Python 培训封面'),
    detailPath: '/activities/python-training',
    isFeatured: false
  },
  {
    id: 'summer-camp-closing',
    title: '暑期科研训练营结营分享',
    activityType: 'TECH_SHARING',
    summary: '营员成果分享与结业',
    startAt: '2026-07-20T14:00:00+08:00',
    endAt: '2026-07-20T16:00:00+08:00',
    location: '人工智能学院报告厅',
    organizerName: '人工智能学院',
    registrationRequired: true,
    registrationStartAt: '2026-07-10T00:00:00+08:00',
    registrationEndAt: '2026-07-15T23:59:59+08:00',
    capacity: 50,
    speaker: '营员代表',
    descriptionMd: '训练营已结束。',
    cover: cover('科研训练营封面'),
    detailPath: '/activities/summer-camp-closing',
    isFeatured: false
  },
  {
    id: 'spring-innovation-salon',
    title: '春季创新沙龙',
    activityType: 'OTHER',
    summary: '创新点子交流与组队',
    startAt: '2026-05-18T19:00:00+08:00',
    endAt: '2026-05-18T21:00:00+08:00',
    location: '大学生活动中心',
    organizerName: '创新协会',
    registrationRequired: true,
    registrationStartAt: '2026-05-10T00:00:00+08:00',
    registrationEndAt: '2026-05-15T23:59:59+08:00',
    capacity: 100,
    speaker: null,
    descriptionMd: '创新沙龙已结束。',
    cover: cover('创新沙龙封面'),
    detailPath: '/activities/spring-innovation-salon',
    isFeatured: false
  }
]

/** 公告（覆盖不同发布来源、关联对象与站外链接）。 */
export const dynamicsAnnouncements: DynamicsAnnouncement[] = [
  {
    id: 'announcement-platform-launch',
    title: '人工智能学院科创与就业服务平台正式上线',
    publishedAt: '2026-08-20T10:00:00+08:00',
    publisherScope: 'PLATFORM',
    bodyMd:
      '平台现已正式上线，欢迎同学们使用竞赛、组队、组织、活动与指南等功能。',
    linkedObject: null,
    externalUrl: null,
    detailPath: '/activities/announcements/announcement-platform-launch'
  },
  {
    id: 'announcement-mcm-2026',
    title: '关于组织参加 2026 年全国大学生数学建模竞赛的通知',
    publishedAt: '2026-08-18T09:00:00+08:00',
    publisherScope: 'ACADEMY',
    bodyMd:
      '2026 年全国大学生数学建模竞赛报名现已开始，请有意向的同学按通知要求完成组队与报名。',
    linkedObject: {
      kind: 'COMPETITION',
      label: '全国大学生数学建模竞赛 2026',
      to: '/competitions/mcm-2026'
    },
    externalUrl: null,
    detailPath: '/activities/announcements/announcement-mcm-2026'
  },
  {
    id: 'announcement-csdc-selection',
    title: '中国大学生计算机设计大赛校内选拔通知',
    publishedAt: '2026-08-16T14:30:00+08:00',
    publisherScope: 'ACADEMY',
    bodyMd: '校内选拔已开启，具体安排见正文。',
    linkedObject: {
      kind: 'COMPETITION',
      label: '中国大学生计算机设计大赛 2026',
      to: '/competitions/csdc-2026'
    },
    externalUrl: null,
    detailPath: '/activities/announcements/announcement-csdc-selection'
  },
  {
    id: 'announcement-ai-sharing',
    title: 'AI 前沿技术分享会（第 4 期）报名开启',
    publishedAt: '2026-08-19T11:00:00+08:00',
    publisherScope: 'ACADEMY',
    bodyMd: '本期分享会报名通道已开放，名额有限，先到先得。',
    linkedObject: {
      kind: 'ACTIVITY',
      label: 'AI 前沿技术分享会（第 4 期）',
      to: '/activities/ai-sharing-4'
    },
    externalUrl: null,
    detailPath: '/activities/announcements/announcement-ai-sharing'
  },
  {
    id: 'announcement-university-policy',
    title: '学校关于 2026 年大学生创新训练计划申报的通知',
    publishedAt: '2026-08-14T08:00:00+08:00',
    publisherScope: 'UNIVERSITY',
    bodyMd: '请各学院组织学生按学校时间节点完成申报。',
    linkedObject: {
      kind: 'RECRUITMENT',
      label: '大学生创新创业训练计划申报指南',
      to: '/qa/guides/innovation-training'
    },
    externalUrl: 'https://example-notice.edu.cn/campus/innovation-2026',
    detailPath: '/activities/announcements/announcement-university-policy'
  },
  {
    id: 'announcement-platform-guide',
    title: '平台使用指南已更新',
    publishedAt: '2026-08-12T09:30:00+08:00',
    publisherScope: 'PLATFORM',
    bodyMd: '新增竞赛报名与组队流程说明。',
    linkedObject: null,
    externalUrl: 'https://example-notice.edu.cn/help/guide',
    detailPath: '/activities/announcements/announcement-platform-guide'
  }
]
