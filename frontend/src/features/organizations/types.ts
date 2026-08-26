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

// ---------------------------------------------------------------------------
// 组织详情 / 招新详情 / 招新申请（FE-041 / FE-042）
// ---------------------------------------------------------------------------

/** 招新自身开放阶段（§11.1 派生 application_state）。 */
export type RecruitmentPhaseState =
  | 'DRAFT'
  | 'CANCELLED'
  | 'ARCHIVED'
  | 'COMPLETED'
  | 'UPCOMING'
  | 'OPEN'
  | 'CLOSED'

/** 招新申请状态（§11.3 status）。 */
export type RecruitmentApplicationState =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'

/** 组织近期活动预览（FE-041，指向真实活动详情）。 */
export interface OrganizationActivityPreview {
  id: string
  title: string
  startAt: string
  detailPath: string
}

/** 招新岗位（§11.2 organizations_recruitment_position）。 */
export interface OrganizationPosition {
  id: string
  name: string
  /** 计划招募人数 > 0。 */
  headcount: number
  description: string | null
  requirements: string | null
}

/** 组织详情页视图模型（FE-041，PageMap §组织主页）。 */
export interface OrganizationDetail extends OrganizationSummary {
  /** 完整介绍（Markdown 源，运行时降级为纯文本）。 */
  descriptionMd: string
  /** 主要方向。 */
  direction: string
  advisorName: string | null
  leaderName: string
  /** 负责人职位名，如「会长」。 */
  leaderTitle: string
  publicContact: string | null
  recentActivities: OrganizationActivityPreview[]
  currentRecruitments: OrganizationRecruitment[]
}

/** 招新详情页视图模型（FE-042，PageMap §招新详情）。 */
export interface RecruitmentDetail {
  id: string
  organization: {
    id: string
    name: string
    type: OrganizationType
    detailPath: string
    logo: HomepageImage
  }
  title: string
  introMd: string
  applyStartAt: string | null
  applyEndAt: string | null
  publicationState: RecruitmentPublicationState
  completedAt: string | null
  targetGradeMin: number | null
  targetGradeMax: number | null
  notesMd: string | null
  positions: OrganizationPosition[]
}

/** 当前用户的招新申请（Mock store 记录，FE-042）。 */
export interface MyRecruitmentApplication {
  recruitmentId: string
  positionId: string
  positionName: string
  selfIntro: string
  skills: string | null
  experience: string | null
  motivation: string
  status: RecruitmentApplicationState
  submittedAt: string
}

/** 招新申请表单草案（提交输入）。 */
export interface RecruitmentApplicationDraft {
  recruitmentId: string
  positionId: string
  selfIntro: string
  skills: string
  experience: string
  motivation: string
}
