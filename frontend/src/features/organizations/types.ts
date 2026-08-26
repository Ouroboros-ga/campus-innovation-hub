/**
 * 组织领域类型（Organization Domain View Models）
 *
 * 语义来源：
 * - docs/product/PageMap.md §组织列表 / §组织主页 / §招新详情
 * - docs/backend/database-design.md §10（organization）/ §11（recruitment）
 * - docs/frontend/FrontendDesign.md §23（Organization UI）
 *
 * 规则（database-design.md §1.3 / §36）：
 * - 日期一律 ISO 8601；可推导展示文本（招新中/即将招新）运行时派生；
 * - 招新状态派生自 `publication_state` + 报名窗口，不重复存储展示文本。
 */
import type {
  HomepageImage,
  OrganizationType
} from '@/shared/types/homepage'

/** 组织招新状态（派生，供列表筛选与卡片展示；对齐参考图的四态）。 */
export type OrgRecruitmentState =
  | 'RECRUITING'
  | 'UPCOMING'
  | 'PAUSED'
  | 'NOT_RECRUITING'

/** 招新的发布生命周期（§11.1 publication_state）。 */
export type RecruitmentPublicationState =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'ARCHIVED'

/** 组织当前招新（事实）。 */
export interface OrganizationRecruitment {
  id: string
  title: string
  applyStartAt: string | null
  applyEndAt: string | null
  publicationState: RecruitmentPublicationState
}

/** 组织列表 / 卡片视图模型（§23 / PageMap §组织卡）。 */
export interface OrganizationSummary {
  id: string
  name: string
  type: OrganizationType
  /** 一句简介。 */
  description: string | null
  logo: HomepageImage
  /** 当前招新（无则为 null）。 */
  recruitment: OrganizationRecruitment | null
  detailPath: string
  recruitmentPath: string | null
}

/** 登录态「我的组织」成员关系（PageMap §组织列表）。 */
export interface MyOrganization {
  organization: OrganizationSummary
  /** 成员身份：MEMBER / LEADER。 */
  membership: 'MEMBER' | 'LEADER'
  /** 职位名称，如「会长」「部长」。 */
  roleLabel: string
}

/** 组织类型筛选值（`ALL` 表示不筛）。 */
export type OrganizationTypeFilter = 'ALL' | OrganizationType

/** 招新状态筛选值（`ALL` 表示不筛）。 */
export type OrganizationRecruitmentFilter = 'ALL' | OrgRecruitmentState

/** 排序维度。 */
export type OrganizationSort = 'DEFAULT' | 'NAME'
