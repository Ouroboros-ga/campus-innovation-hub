/**
 * 组织列表页开发 Fixtures（Mock-First 开发脚手架）
 *
 * 位置：src/mocks/fixtures/（FrontendImplementationPlan.md FE-005 规则）
 *
 * 规则（database-design.md / FE-005）：
 * - 日期一律 ISO 8601（+08:00）；
 * - 招新状态（招新中/即将招新/暂停招新/不招新）由 publication_state 与报名窗口
 *   在运行时派生，不在此处存放展示文本；
 * - 不虚构浏览量 / 热度等官方统计；这是开发脚手架，不是生产事实。
 *
 * 覆盖维度：
 * - 类型：COLLEGE_DEPARTMENT / STUDENT_CLUB / LABORATORY / INNOVATION_TEAM / OTHER
 * - 招新状态：RECRUITING / UPCOMING / PAUSED / NOT_RECRUITING
 * - 我的组织：LEADER（会长）/ MEMBER（成员）
 */

import type {
  MyOrganization,
  OrganizationSummary
} from '@/features/organizations/types'

const logo = (alt: string) => ({ alt, src: null })

export const organizations: OrganizationSummary[] = [
  {
    id: 'ai-union',
    name: '人工智能协会',
    type: 'STUDENT_CLUB',
    description: '共建 AI 前沿技术，分享交流成长，探索智能的无限可能。',
    logo: logo('人工智能协会 logo'),
    recruitment: {
      id: 'ai-union-fall-2026',
      title: '人工智能协会 2026 秋季招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-05T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/ai-union',
    recruitmentPath: '/organizations/ai-union/recruitments/ai-union-fall-2026'
  },
  {
    id: 'data-science-club',
    name: '数据科学社',
    type: 'STUDENT_CLUB',
    description: '数据驱动未来，让数据创造价值。学习数据分析与挖掘，实践应用。',
    logo: logo('数据科学社 logo'),
    recruitment: {
      id: 'data-science-fall-2026',
      title: '数据科学社 2026 秋季招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-06T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/data-science-club',
    recruitmentPath: '/organizations/data-science-club/recruitments/data-science-fall-2026'
  },
  {
    id: 'robot-lab',
    name: '机器人创新实验室',
    type: 'LABORATORY',
    description: '专注机器人研发与实践，推动智能硬件创新，探索技术落地应用。',
    logo: logo('机器人创新实验室 logo'),
    recruitment: {
      id: 'robot-lab-fall-2026',
      title: '机器人创新实验室 2026 招新',
      applyStartAt: '2026-09-01T00:00:00+08:00',
      applyEndAt: '2026-09-20T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/robot-lab',
    recruitmentPath: '/organizations/robot-lab/recruitments/robot-lab-fall-2026'
  },
  {
    id: 'innovation-center',
    name: '创新创业中心',
    type: 'INNOVATION_TEAM',
    description: '激发创新思维，孵化创业项目，链接资源，助力梦想起航。',
    logo: logo('创新创业中心 logo'),
    recruitment: {
      id: 'innovation-center-fall-2026',
      title: '创新创业中心 2026 招新',
      applyStartAt: '2026-08-22T00:00:00+08:00',
      applyEndAt: '2026-09-08T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/innovation-center',
    recruitmentPath: '/organizations/innovation-center/recruitments/innovation-center-fall-2026'
  },
  {
    id: 'sci-employment',
    name: '科创与就业部',
    type: 'COLLEGE_DEPARTMENT',
    description: '服务同学科创与就业发展，组织活动与资源对接，助力成长成才。',
    logo: logo('科创与就业部 logo'),
    recruitment: {
      id: 'sci-employment-fall-2026',
      title: '科创与就业部 2026 招新',
      applyStartAt: '2026-08-22T00:00:00+08:00',
      applyEndAt: '2026-09-06T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/sci-employment',
    recruitmentPath: '/organizations/sci-employment/recruitments/sci-employment-fall-2026'
  },
  {
    id: 'green-public',
    name: '绿色公益社',
    type: 'STUDENT_CLUB',
    description: '践行绿色理念，参与公益实践，传递温暖，守护美好校园。',
    logo: logo('绿色公益社 logo'),
    recruitment: {
      id: 'green-public-fall-2026',
      title: '绿色公益社 2026 招新',
      applyStartAt: '2026-09-02T00:00:00+08:00',
      applyEndAt: '2026-09-18T23:59:59+08:00',
      publicationState: 'PUBLISHED'
    },
    detailPath: '/organizations/green-public',
    recruitmentPath: '/organizations/green-public/recruitments/green-public-fall-2026'
  },
  {
    id: 'light-workshop',
    name: '光影工作室',
    type: 'STUDENT_CLUB',
    description: '用镜头记录精彩，用影像表达创意，分享摄影与视频创作。',
    logo: logo('光影工作室 logo'),
    recruitment: {
      id: 'light-workshop-fall-2026',
      title: '光影工作室 2026 招新',
      applyStartAt: '2026-08-20T00:00:00+08:00',
      applyEndAt: '2026-09-05T23:59:59+08:00',
      publicationState: 'CANCELLED'
    },
    detailPath: '/organizations/light-workshop',
    recruitmentPath: null
  },
  {
    id: 'academic-forum',
    name: '学术研讨会',
    type: 'STUDENT_CLUB',
    description: '聚焦学术前沿，举办主题研讨，拓展视野，提升研究能力。',
    logo: logo('学术研讨会 logo'),
    recruitment: null,
    detailPath: '/organizations/academic-forum',
    recruitmentPath: null
  }
]

/** 登录态「我的组织」（mock 当前用户：会长 + 成员）。 */
export const myOrganizations: MyOrganization[] = [
  {
    organization: organizations[0]!,
    membership: 'LEADER',
    roleLabel: '会长'
  },
  {
    organization: organizations[1]!,
    membership: 'MEMBER',
    roleLabel: '成员'
  }
]
