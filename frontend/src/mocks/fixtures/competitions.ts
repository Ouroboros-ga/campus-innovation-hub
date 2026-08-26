/**
 * 竞赛列表页开发 Fixtures（Mock-First 开发脚手架）
 *
 * 位置：src/mocks/fixtures/（FrontendImplementationPlan.md FE-005 规则）
 *
 * 规则（database-design.md / FE-005）：
 * - 日期一律使用 ISO 8601 字符串（+08:00）；
 * - 不存放可推导的展示文本（报名状态 / 倒计时由 shared/lib/date.ts 运行时派生）；
 * - 不虚构浏览量 / 热度等官方统计；
 * - 这是开发脚手架，不是生产事实。
 *
 * 覆盖维度（便于演示筛选 / 分页）：
 * - 状态：OPEN（报名中）/ UPCOMING（即将开始）/ CLOSED（报名已结束）
 * - 分类：AI / PROGRAMMING / INNOVATION / MATHEMATICAL_MODELING / ELECTRONICS / ROBOTICS
 * - 形式：TEAM / INDIVIDUAL
 * - 级别：SCHOOL / PROVINCIAL / NATIONAL / INTERNATIONAL
 */

import type { CompetitionSummary } from '@/shared/types/homepage'

export const competitions: CompetitionSummary[] = [
  {
    id: 'csdc-2026',
    name: '中国大学生计算机设计大赛',
    edition: '2026',
    slogan: '以赛促学，以赛促创',
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
    slogan: '创新 · 协作 · 求解',
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
    slogan: '成就你的梦想',
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
    slogan: '挑战自我，追求卓越',
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
    slogan: '用代码改变世界',
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
  },
  {
    id: 'ai-innovation-2026',
    name: '全国大学生人工智能创新挑战赛',
    edition: '2026',
    slogan: '探索 AI 的无限可能',
    category: 'AI',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-10T00:00:00+08:00',
    registrationEndAt: '2026-09-05T23:59:59+08:00',
    eventStartAt: '2026-10-12T00:00:00+08:00',
    eventEndAt: '2026-10-15T23:59:59+08:00',
    officialUrl: 'https://ai-innovation.example.com',
    cover: { alt: '人工智能创新挑战赛封面', src: null },
    detailPath: '/competitions/ai-innovation-2026'
  },
  {
    id: 'robot-cup-2026',
    name: '中国机器人大赛',
    edition: '2026',
    slogan: '智慧驱动，创意无限',
    category: 'ROBOTICS',
    level: 'PROVINCIAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-07-01T00:00:00+08:00',
    registrationEndAt: '2026-08-01T23:59:59+08:00',
    eventStartAt: '2026-08-20T00:00:00+08:00',
    eventEndAt: '2026-08-22T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '中国机器人大赛封面', src: null },
    detailPath: '/competitions/robot-cup-2026'
  },
  {
    id: 'electronics-design-2026',
    name: '全国大学生电子设计竞赛',
    edition: '2026',
    slogan: '电子点亮未来',
    category: 'ELECTRONICS',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-06-15T00:00:00+08:00',
    registrationEndAt: '2026-07-20T23:59:59+08:00',
    eventStartAt: '2026-08-10T00:00:00+08:00',
    eventEndAt: '2026-08-13T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '电子设计竞赛封面', src: null },
    detailPath: '/competitions/electronics-design-2026'
  },
  {
    id: 'math-competition-2026',
    name: '全国大学生数学竞赛',
    edition: '2026',
    slogan: '遇见数学之美',
    category: 'MATHEMATICAL_MODELING',
    level: 'NATIONAL',
    participationMode: 'INDIVIDUAL',
    registrationStartAt: '2026-09-05T00:00:00+08:00',
    registrationEndAt: '2026-10-05T23:59:59+08:00',
    eventStartAt: '2026-11-08T09:00:00+08:00',
    eventEndAt: '2026-11-08T13:00:00+08:00',
    officialUrl: null,
    cover: { alt: '数学竞赛封面', src: null },
    detailPath: '/competitions/math-competition-2026'
  },
  {
    id: 'innovation-training-2026',
    name: '大学生创新创业训练计划',
    edition: '2026',
    slogan: '让创新落地',
    category: 'INNOVATION',
    level: 'SCHOOL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-20T00:00:00+08:00',
    registrationEndAt: '2026-09-18T23:59:59+08:00',
    eventStartAt: '2026-10-01T00:00:00+08:00',
    eventEndAt: '2026-12-31T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '创新创业训练计划封面', src: null },
    detailPath: '/competitions/innovation-training-2026'
  },
  {
    id: 'school-programming-2026',
    name: '校内程序设计竞赛',
    edition: '2026',
    slogan: '代码即创造',
    category: 'PROGRAMMING',
    level: 'SCHOOL',
    participationMode: 'INDIVIDUAL',
    registrationStartAt: '2026-08-25T00:00:00+08:00',
    registrationEndAt: '2026-09-08T23:59:59+08:00',
    eventStartAt: '2026-09-12T09:00:00+08:00',
    eventEndAt: '2026-09-12T13:00:00+08:00',
    officialUrl: null,
    cover: { alt: '校内程序设计竞赛封面', src: null },
    detailPath: '/competitions/school-programming-2026'
  },
  {
    id: 'provincial-ai-2026',
    name: '省级人工智能应用赛',
    edition: '2026',
    slogan: '用 AI 连接未来',
    category: 'AI',
    level: 'PROVINCIAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-09-10T00:00:00+08:00',
    registrationEndAt: '2026-10-10T23:59:59+08:00',
    eventStartAt: '2026-10-25T00:00:00+08:00',
    eventEndAt: '2026-10-28T23:59:59+08:00',
    officialUrl: 'https://provincial-ai.example.com',
    cover: { alt: '省级人工智能应用赛封面', src: null },
    detailPath: '/competitions/provincial-ai-2026'
  }
]
