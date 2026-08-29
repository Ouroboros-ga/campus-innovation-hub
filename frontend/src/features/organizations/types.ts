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
  /** 成员身份：MEMBER / LEADER / ADVISOR（ADVISOR 仅 TEACHER）。 */
  membership: 'MEMBER' | 'LEADER' | 'ADVISOR'
  /** 职位名称，如「会长」「部长」。 */
  roleLabel: string
}

/** 指导老师卡片（database-design.md §10.1/§10.2，由 Membership ADVISOR 派生）。 */
export interface OrganizationAdvisor {
  membershipId: string
  userId: string
  publicName: string | null
  displayName: string | null
  avatar: HomepageImage | null
  department: string | null
  academicTitle: string | null
  publicEmail: string | null
  officeLocation: string | null
  researchInterests: string[]
  title: string | null
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

/** 组织友情链接（相关竞赛/活动/外链） */
export interface OrganizationRelatedLink {
  label: string
  url: string
  type: 'competition' | 'activity' | 'external'
}

/** 组织详情页视图模型（FE-041，PageMap §组织主页）。 */
export interface OrganizationDetail extends OrganizationSummary {
  /** 横幅（组织 Banner，16:9） */
  banner?: HomepageImage | null
  /** 完整介绍（Markdown 源，运行时降级为纯文本）。 */
  descriptionMd: string
  /** 主要方向（以「/」分隔，展示为方向标签）。 */
  direction: string
  /** 成立时间（ISO 8601，展示为「2018年9月」）。 */
  foundedAt: string | null
  /** 成员规模（人数）。 */
  memberCount: number | null
  /** 所属学院。 */
  college: string | null
  /** 指导老师（由 ADVISOR membership 派生，禁止 real_name 穿透）。 */
  advisors: OrganizationAdvisor[]
  /** 负责人（由 LEADER membership 派生，供兼容展示）。 */
  leaders: OrganizationAdvisor[]
  /** 当前登录用户在该组织的角色/是否可管理。 */
  currentUserOrganizationRole: 'MEMBER' | 'LEADER' | 'ADVISOR' | null
  canManage: boolean | null
  isLeader: boolean | null
  leaderName: string
  /** 负责人职位名，如「会长」。 */
  leaderTitle: string
  /** 负责人年级，如「2023级」。 */
  leaderGrade: string | null
  /** 公开邮箱。 */
  contactEmail: string | null
  /** 公开电话。 */
  contactPhone: string | null
  /** 公开地址。 */
  contactAddress: string | null
  /** 官方微信名称（官方微信二维码为装饰占位）。 */
  wechatName: string | null
  /** 单行公开联系方式（兼容字段，页面优先使用结构化联系方式）。 */
  publicContact: string | null
  /** 招新 QQ 群号（公开引流） */
  qqGroupNumber: string | null
  /** 招新 QQ 群二维码（media_asset） */
  qqGroupQr: HomepageImage | null
  /** QQ 群入群链接 */
  qqGroupJoinUrl: string | null
  /** 是否启用平台在线申请（组织级开关，双轨并行） */
  allowOnlineApplication: boolean
  /** 友情链接：相关竞赛/活动 */
  relatedLinks: OrganizationRelatedLink[]
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
  /** 招新独立 QQ 群号（为空回退到组织级） */
  qqGroupNumber: string | null
  qqGroupQr: HomepageImage | null
  qqGroupJoinUrl: string | null
  /** 本轮是否启用在线申请 */
  enableOnlineApplication: boolean
  /** 组织级是否启用（用于双轨并行最终判断） */
  organizationAllowOnlineApplication: boolean
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
