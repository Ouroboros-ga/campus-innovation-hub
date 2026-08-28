/**
 * 竞赛详情视图模型（FE-021 重构 · 按参考设计稿）
 *
 * 来源：docs/product/PageMap.md 竞赛详情 / FrontendDesign.md §34.6 / 参考设计稿。
 * 规则（database-design.md §1.3 / §36）：日期一律 ISO 8601；可推导展示文本运行时派生。
 * 展示型区块（亮点、参赛要求、报名提示）由 fixture 提供文案，不虚构官方统计。
 */

import type { CompetitionSummary } from '@/shared/types/homepage'

/** 时间线节点（日期 + 标题 + 说明）。 */
export interface CompetitionTimelineNode {
  /** ISO 8601 */
  date: string
  title: string
  description: string | null
  /** 是否为当前关注节点（如「报名截止」），用于关键时间高亮。 */
  highlighted?: boolean
}

/** 赛事亮点（4 格：图标 + 标题 + 说明）。 */
export interface CompetitionHighlight {
  /** Lucide 图标名。 */
  icon: string
  title: string
  note: string
}

/** 参赛要求 / 基本信息。 */
export interface CompetitionRequirement {
  /** 参赛对象。 */
  audience: string
  /** 组队要求。 */
  teamRequirement: string
  /** 参赛领域。 */
  domains: string
  /** 主办单位。 */
  organizer: string
  /** 咨询邮箱（可选）。 */
  contactEmail: string | null
}

/** 官方链接。 */
export interface OfficialLink {
  label: string
  url: string
}

/** 正在组队的队伍（含队长信息，用于组队信息卡片）。 */
export interface RecruitingTeam {
  id: string
  title: string
  competitionName: string
  baseMemberCount: number
  targetMemberCount: number
  roles: string[]
  /** 队长姓名。 */
  leaderName: string
  /** 队长补充说明（如「大二」）。 */
  leaderNote: string
  createdAt: string
  detailPath: string
}

/** 竞赛详情 = 摘要 + 详情区块。 */
export interface CompetitionDetail extends CompetitionSummary {
  /** 头部一句话简介（标题下方）。 */
  brief: string
  /** 赛事介绍正文。 */
  intro: string
  /** 适合谁参加（面向人群说明）。 */
  whoShouldJoin: string
  /** 亮点（4 格）。 */
  highlights: CompetitionHighlight[]
  /** 参赛要求 / 基本信息。 */
  requirement: CompetitionRequirement
  /** 关键时间线。 */
  timeline: CompetitionTimelineNode[]
  /** 报名方式与提示（checklist）。 */
  registrationTips: string[]
  /** 官方链接。 */
  officialLinks: OfficialLink[]
  /** 查看完整报名指南路径（可为空）。 */
  guidePath: string | null
  /** 相关通知摘要。 */
  relatedAnnouncements: Array<{
    id: string
    title: string
    publishedAt: string
    detailPath: string
  }>
  /** 相关指南摘要。 */
  relatedGuides: Array<{
    id: string
    title: string
    publishedAt: string
    detailPath: string
  }>
  /** 组队信息。 */
  recruitingTeams: RecruitingTeam[]
  /** 新增详情区块：运营编辑字段透传 */
  suitableGradeMin?: number | null
  suitableGradeMax?: number | null
  direction?: string | null
  summary?: string | null
  suitableForMd?: string | null
  preparationAdviceMd?: string | null
  collegeContactName?: string | null
  collegeContactText?: string | null
  registrationUrl?: string | null
  officialNoticeUrl?: string | null
  collegeOrganized?: boolean
}
