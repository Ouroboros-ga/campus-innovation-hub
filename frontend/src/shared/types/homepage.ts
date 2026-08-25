/**
 * 首页领域类型（Homepage Domain View Models）
 *
 * 字段与枚举来源：
 * - docs/product/PageMap.md（首页各区块所需字段）
 * - docs/backend/database-design.md（字段类型、枚举值、派生规则）
 *
 * 规则（database-design.md §1.3 / §36）：
 * - 日期一律使用 ISO 8601 字符串保存；
 * - 可推导的 UI 显示文本（如「还有 3 天截止」「报名中」）**不存储**，
 *   由 shared/lib/date.ts 在运行时派生，并对非平凡逻辑做单元测试；
 * - 枚举值与数据库保持同一 semantics，不重复存储派生状态字符串。
 *
 * 此处只保存「领域事实 + 稳定枚举」，时间派生状态（如报名状态、赛事阶段、
 * 紧迫度）由共享工具计算，避免 fixture 携带过期/冗余的派生字段。
 */

// ---------------------------------------------------------------------------
// 稳定枚举值（source: database-design.md）
// ---------------------------------------------------------------------------

/** 竞赛级别（§12.1 competition.level） */
export type CompetitionLevel =
  | 'SCHOOL'
  | 'PROVINCIAL'
  | 'NATIONAL'
  | 'INTERNATIONAL'
  | 'OTHER'

/** 参赛形式（§12.1 competition.participation_mode） */
export type ParticipationMode = 'INDIVIDUAL' | 'TEAM'

/** 竞赛分类（§12.1 competition.category） */
export type CompetitionCategory =
  | 'AI'
  | 'PROGRAMMING'
  | 'INNOVATION'
  | 'MATHEMATICAL_MODELING'
  | 'ELECTRONICS'
  | 'ROBOTICS'
  | 'OTHER'

/** 正式内容的发布生命周期（§12.1 publication_state，多个领域共用） */
export type PublicationState = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED'

/** 招新帖类型（§13.1 team_post.post_type） */
export type TeamPostType = 'TEAM_RECRUITING' | 'PERSON_LOOKING'

/** 组队帖子状态（§13.1 team_post.status） */
export type TeamPostStatus = 'RECRUITING' | 'FULL' | 'CLOSED'

/** 组织类型（§10.1 organization_type） */
export type OrganizationType =
  | 'COLLEGE_DEPARTMENT'
  | 'STUDENT_CLUB'
  | 'LABORATORY'
  | 'INNOVATION_TEAM'
  | 'OTHER'

/** 活动类型（§14.1 activity_type） */
export type ActivityType =
  | 'COMPETITION_BRIEFING'
  | 'TECH_SHARING'
  | 'RESEARCH_LECTURE'
  | 'FURTHER_STUDY'
  | 'ENTERPRISE'
  | 'TRAINING'
  | 'OTHER'

/** 指南分类（§15.3 guide_article.category） */
export type GuideCategory =
  | 'COMPETITION'
  | 'RESEARCH'
  | 'FURTHER_STUDY'
  | 'CERTIFICATE'
  | 'PROCESS'
  | 'EXPERIENCE'
  | 'OTHER'

/** FAQ 分类（§15.5 faq_item.category） */
export type FaqCategory =
  | 'COMPETITION'
  | 'TEAM'
  | 'ORGANIZATION'
  | 'ACTIVITY'
  | 'FURTHER_STUDY'
  | 'CERTIFICATE'
  | 'OTHER'

/** 「即将截止」列表的条目类型（PageMap 首页-即将截止） */
export type DeadlineKind = 'COMPETITION' | 'ACTIVITY' | 'RECRUITMENT'

/** 截止时间紧迫度（运行时派生，非存储字段） */
export type DeadlineUrgency = 'NORMAL' | 'URGENT' | 'EXPIRED'

/** 报名生命周期（派生，§12.1 / §14.1） */
export type RegistrationState =
  | 'NOT_REQUIRED'
  | 'NOT_AVAILABLE'
  | 'UPCOMING'
  | 'OPEN'
  | 'CLOSED'
  | 'FULL'

/** 赛事 / 活动时间阶段（派生，§12.1 / §14.1） */
export type EventPhase = 'UPCOMING' | 'IN_PROGRESS' | 'ENDED'

// ---------------------------------------------------------------------------
// 首页领域视图模型（Domain View Models）
// ---------------------------------------------------------------------------

/** 图片引用。src 在占位 / 未上传时可空，正式实现来自 MediaAsset。 */
export interface HomepageImage {
  alt: string
  src: string | null
}

/** 校园轮播（PageMap 首页-校园轮播；§15.1 content_homepage_banner） */
export interface CarouselSlide {
  id: string
  title: string
  subtitle: string | null
  /** 轮播类别标签，如「重要竞赛」「学院科创季」 */
  categoryLabel: string | null
  image: HomepageImage
  link: {
    type: 'NONE' | 'INTERNAL' | 'EXTERNAL'
    internalPath: string | null
    externalUrl: string | null
  }
  /** ISO 8601 展示窗口 */
  startAt: string | null
  endAt: string | null
  sortOrder: number
}

/** 即将截止条目（PageMap 首页-即将截止）。剩余时间与紧迫度由工具派生。 */
export interface DeadlineItem {
  id: string
  kind: DeadlineKind
  title: string
  /** ISO 8601 截止时间（报名 / 申请 / 活动截止） */
  deadlineAt: string
  detailPath: string
}

/** 首页热门竞赛（PageMap 首页-热门竞赛；§12.1 competitions_competition） */
export interface CompetitionSummary {
  id: string
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participationMode: ParticipationMode
  registrationStartAt: string | null
  registrationEndAt: string | null
  eventStartAt: string | null
  eventEndAt: string | null
  officialUrl: string | null
  cover: HomepageImage
  detailPath: string
}

/** 正在组队（PageMap 首页-正在组队；§13.1 teams_team_post） */
export interface TeamRecruitmentSummary {
  id: string
  title: string
  postType: TeamPostType
  competitionName: string
  baseMemberCount: number
  targetMemberCount: number
  /** 需要补足的岗位名称 */
  roles: string[]
  createdAt: string
  detailPath: string
}

/** 正在招新的组织（PageMap 首页-正在招新的组织；§10.1 + §11.1） */
export interface OrganizationRecruitmentSummary {
  id: string
  organizationId: string
  organizationName: string
  organizationType: OrganizationType
  recruitmentId: string
  recruitmentTitle: string
  positions: Array<{ name: string; headcount: number }>
  applyStartAt: string | null
  applyEndAt: string | null
  organizationPath: string
  recruitmentPath: string
}

/** 近期活动（PageMap 首页-近期活动；§14.1 activities_activity） */
export interface ActivitySummary {
  id: string
  title: string
  activityType: ActivityType
  summary: string | null
  startAt: string
  endAt: string | null
  location: string
  organizerName: string | null
  registrationRequired: boolean
  registrationEndAt: string | null
  cover: HomepageImage
  detailPath: string
}

/** 通知公告（PageMap 首页-通知公告；§15.2 content_announcement） */
export interface AnnouncementSummary {
  id: string
  title: string
  publishedAt: string
  detailPath: string
}

/** 热门指南（PageMap 首页-热门指南；§15.3 content_guide_article） */
export interface GuideSummary {
  id: string
  title: string
  category: GuideCategory
  summary: string | null
  publishedAt: string
  detailPath: string
}

/** 常见问题（PageMap 首页-常见问题；§15.5 content_faq_item） */
export interface FaqSummary {
  id: string
  category: FaqCategory
  question: string
  detailPath: string
}
