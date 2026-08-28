/**
 * 校园动态领域类型（Campus Dynamics Domain View Models）
 *
 * 语义来源：
 * - docs/product/PageMap.md：`/activities?tab=all|activities|announcements`（校园动态）
 * - docs/backend/database-design.md §14.1 `activities_activity` / §15.2 `content_announcement`
 * - docs/superpowers/plans/2026-08-26-campus-dynamics-information-architecture.md
 *
 * 规则（database-design.md §1.3 / §36）：
 * - 日期一律 ISO 8601 字符串；可推导展示文本运行时派生（shared/lib/date.ts）；
 * - 活动与公告使用**不同的类型、fixture、列表行与详情目标**，不创建“通用动态 JSON”；
 * - `Announcement` 最多关联一个核心业务对象；`external_url` 可空，只作跳转，不抓取/镜像。
 */
import type { ActivitySummary } from '@/shared/types/homepage'

/**
 * 公告发布来源（§15.2 `content_announcement.publisher_scope`）。
 * 展示为「学院 / 学校 / 平台」。
 */
export type AnnouncementPublisherScope = 'ACADEMY' | 'UNIVERSITY' | 'PLATFORM'

/** 公告关联的核心业务对象类型（§15.2，最多一个）。 */
export type AnnouncementLinkedKind =
  | 'COMPETITION'
  | 'ACTIVITY'
  | 'ORGANIZATION'
  | 'RECRUITMENT'

/** 公告关联的核心业务对象。 */
export interface AnnouncementLinkedObject {
  kind: AnnouncementLinkedKind
  /** 关联对象展示名，如「全国大学生数学建模竞赛 2026」。 */
  label: string
  /** 关联对象的前端路由。 */
  to: string
}

/** 公告列表 / 详情视图模型（§15.2 + 校园动态语义）。 */
export interface DynamicsAnnouncement {
  id: string
  title: string
  /** ISO 8601 发布时间。 */
  publishedAt: string
  publisherScope: AnnouncementPublisherScope
  /** Markdown 正文（公告详情）。 */
  bodyMd: string | null
  /** 可选关联对象（最多一个）。 */
  linkedObject: AnnouncementLinkedObject | null
  /** 可选站外原文链接；只作跳转，不抓取/镜像。 */
  externalUrl: string | null
  publicationState?: string
  detailPath: string
}

/** 活动列表 / 详情视图模型（§14.1 + 校园动态语义）。
 *  复用 `ActivitySummary` 基础字段，补充详情与报名所需事实字段。 */
export interface DynamicsActivity extends ActivitySummary {
  /** 可选容量；仅在存在真实数据时展示。 */
  capacity: number | null
  /** 可选报名开始时间。 */
  registrationStartAt: string | null
  /** 可选主讲人 / 嘉宾。 */
  speaker: string | null
  /** Markdown 正文（活动详情）。 */
  descriptionMd: string | null
  /** 备注说明（运营编辑可选）。 */
  notesMd?: string | null
  /** 首页精选标记。 */
  isFeatured: boolean
  publicationState?: string
}

/** 校园动态的 tab 取值（URL `?tab=`）。 */
export type DynamicsTab = 'all' | 'activities' | 'announcements'
