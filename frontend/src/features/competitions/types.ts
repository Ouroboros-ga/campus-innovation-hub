/**
 * 竞赛详情视图模型（FE-021）
 *
 * 来源：docs/product/PageMap.md 竞赛详情 / FrontendDesign.md §34.6。
 * 规则（database-design.md §1.3 / §36）：日期一律 ISO 8601；可推导展示文本运行时派生。
 */

import type { CompetitionSummary } from '@/shared/types/homepage'

/** 时间线节点（日期 + 标题 + 说明）。 */
export interface CompetitionTimelineNode {
  /** ISO 8601 */
  date: string
  title: string
  description: string | null
}

/** 谁适合参加（结构化提示）。 */
export interface WhoShouldJoin {
  grades: string
  prerequisites: string
  skills: string[]
  teamNeeded: boolean
}

/** 竞赛详情 = 摘要 + 详情区块。 */
export interface CompetitionDetail extends CompetitionSummary {
  /** 适合年级展示文本。 */
  suitableGrades: string | null
  /** 主要方向展示文本。 */
  direction: string | null
  /** 学院是否组织。 */
  schoolOrganized: boolean | null
  /** 校内联系人展示文本。 */
  campusContact: string | null
  /** 比赛简介正文。 */
  intro: string
  /** 谁适合参加。 */
  whoShouldJoin: WhoShouldJoin
  /** 时间线。 */
  timeline: CompetitionTimelineNode[]
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
  /** 正在组队预览。 */
  recruitingTeams: Array<{
    id: string
    title: string
    competitionName: string
    baseMemberCount: number
    targetMemberCount: number
    roles: string[]
    createdAt: string
    detailPath: string
  }>
}
