/**
 * 领域枚举 → 简体中文展示标签（Domain Enum Display Labels）
 *
 * 职责（database-design.md §1.3 / §36 / FrontendDesign.md §24）：
 * - 把稳定枚举值映射为简体中文展示文本；
 * - 标签只用于展示，不是存储字段，也不作为权限原语；
 * - 状态类标签必须文字可读（不只靠颜色），与 `date.ts` 的派生状态配套。
 *
 * 设计来源：
 * - FrontendDesign.md §24（Badge 仅用于语义状态与简短分类）；
 * - FrontendDesign.md §43（简体中文文案、状态陈述事实、无营销文案）；
 * - 枚举值来源：docs/backend/database-design.md §10–§15。
 */

import type {
  ActivityType,
  CompetitionCategory,
  CompetitionLevel,
  DeadlineKind,
  EventPhase,
  FaqCategory,
  GuideCategory,
  OrganizationType,
  ParticipationMode,
  RegistrationState,
  TeamPostType
} from '@/shared/types/homepage'

/** 截止条目类型（竞赛 / 活动 / 招新）展示标签。 */
export const deadlineKindLabel: Record<DeadlineKind, string> = {
  COMPETITION: '竞赛',
  ACTIVITY: '活动',
  RECRUITMENT: '招新'
}

/** 竞赛级别展示标签。 */
export const competitionLevelLabel: Record<CompetitionLevel, string> = {
  SCHOOL: '校级',
  PROVINCIAL: '省级',
  NATIONAL: '国家级',
  INTERNATIONAL: '国际级',
  OTHER: '其他'
}

/** 参赛形式展示标签（个人 / 团队赛）。 */
export const participationModeLabel: Record<ParticipationMode, string> = {
  INDIVIDUAL: '个人',
  TEAM: '团队赛'
}

/** 报名生命周期展示标签（运行时派生，非存储）。 */
export const registrationStateLabel: Record<RegistrationState, string> = {
  NOT_REQUIRED: '无需报名',
  NOT_AVAILABLE: '未开放',
  UPCOMING: '即将开始',
  OPEN: '报名中',
  CLOSED: '报名已结束',
  FULL: '已满员'
}

/** 赛事 / 活动时间阶段展示标签（运行时派生，非存储）。 */
export const eventPhaseLabel: Record<EventPhase, string> = {
  UPCOMING: '即将开始',
  IN_PROGRESS: '进行中',
  ENDED: '已结束'
}

/** 指南 / FAQ / 工作分类展示标签。 */
export const guideCategoryLabel: Record<GuideCategory, string> = {
  COMPETITION: '竞赛',
  RESEARCH: '科研',
  FURTHER_STUDY: '升学',
  CERTIFICATE: '证书',
  PROCESS: '流程',
  EXPERIENCE: '经验',
  OTHER: '其他'
}

/** 指南分类对应的 Lucide 图标名（用于列表行图标）。 */
export const guideCategoryIcon: Record<GuideCategory, string> = {
  COMPETITION: 'i-lucide-trophy',
  RESEARCH: 'i-lucide-flask-conical',
  FURTHER_STUDY: 'i-lucide-graduation-cap',
  CERTIFICATE: 'i-lucide-award',
  PROCESS: 'i-lucide-clipboard-list',
  EXPERIENCE: 'i-lucide-pen-tool',
  OTHER: 'i-lucide-book-open'
}

/** 竞赛分类展示标签（用于默认封面与分类徽标）。 */
export const competitionCategoryLabel: Record<CompetitionCategory, string> = {
  AI: '人工智能',
  PROGRAMMING: '程序设计',
  INNOVATION: '创新创业',
  MATHEMATICAL_MODELING: '数学建模',
  ELECTRONICS: '电子',
  ROBOTICS: '机器人',
  CYBERSECURITY: '网络安全',
  ELECTRONIC_DESIGN: '电子设计',
  MECHANICAL_DESIGN: '机械设计',
  OTHER: '其他'
}

/**
 * 竞赛分类对应的 Lucide 图标名（仅用于默认封面的低调几何水印，
 * 不作为通用 UI 图标手工绘制，符合 FrontendDesign.md §39）。
 */
export const competitionCategoryIcon: Record<CompetitionCategory, string> = {
  AI: 'i-lucide-bot',
  PROGRAMMING: 'i-lucide-code-2',
  INNOVATION: 'i-lucide-lightbulb',
  MATHEMATICAL_MODELING: 'i-lucide-sigma',
  ELECTRONICS: 'i-lucide-circuit-board',
  ROBOTICS: 'i-lucide-bot',
  CYBERSECURITY: 'i-lucide-shield',
  ELECTRONIC_DESIGN: 'i-lucide-cpu',
  MECHANICAL_DESIGN: 'i-lucide-cog',
  OTHER: 'i-lucide-award'
}

/** 组队帖类型展示标签。 */
export const teamPostTypeLabel: Record<TeamPostType, string> = {
  TEAM_RECRUITING: '队伍招人',
  PERSON_LOOKING: '寻找队伍'
}

/** 组队帖类型对应的 Lucide 图标名。 */
export const teamPostTypeIcon: Record<TeamPostType, string> = {
  TEAM_RECRUITING: 'i-lucide-users',
  PERSON_LOOKING: 'i-lucide-user-search'
}

/** 组织类型展示标签。 */
export const organizationTypeLabel: Record<OrganizationType, string> = {
  COLLEGE_DEPARTMENT: '学院部门',
  STUDENT_CLUB: '学生社团',
  LABORATORY: '实验室',
  INNOVATION_TEAM: '创新团队',
  OTHER: '其他'
}

/** 组织类型对应的 Lucide 图标名（用于列表行图标）。 */
export const organizationTypeIcon: Record<OrganizationType, string> = {
  COLLEGE_DEPARTMENT: 'i-lucide-building-2',
  STUDENT_CLUB: 'i-lucide-users',
  LABORATORY: 'i-lucide-flask-conical',
  INNOVATION_TEAM: 'i-lucide-lightbulb',
  OTHER: 'i-lucide-network'
}

/** 活动类型展示标签。 */
export const activityTypeLabel: Record<ActivityType, string> = {
  COMPETITION_BRIEFING: '赛前宣讲',
  TECH_SHARING: '技术分享',
  RESEARCH_LECTURE: '科研讲座',
  FURTHER_STUDY: '升学分享',
  ENTERPRISE: '企业参访',
  TRAINING: '培训',
  OTHER: '活动'
}

/** 活动类型对应的 Lucide 图标名（用于列表行图标）。 */
export const activityTypeIcon: Record<ActivityType, string> = {
  COMPETITION_BRIEFING: 'i-lucide-presentation',
  TECH_SHARING: 'i-lucide-monitor-play',
  RESEARCH_LECTURE: 'i-lucide-microscope',
  FURTHER_STUDY: 'i-lucide-graduation-cap',
  ENTERPRISE: 'i-lucide-building',
  TRAINING: 'i-lucide-book-open',
  OTHER: 'i-lucide-calendar-days'
}

/** FAQ 分类展示标签。 */
export const faqCategoryLabel: Record<FaqCategory, string> = {
  COMPETITION: '竞赛',
  TEAM: '组队',
  ORGANIZATION: '组织',
  ACTIVITY: '活动',
  FURTHER_STUDY: '升学',
  CERTIFICATE: '证书',
  OTHER: '其他'
}

/** FAQ 分类对应的 Lucide 图标名（用于列表行图标）。 */
export const faqCategoryIcon: Record<FaqCategory, string> = {
  COMPETITION: 'i-lucide-trophy',
  TEAM: 'i-lucide-users',
  ORGANIZATION: 'i-lucide-building-2',
  ACTIVITY: 'i-lucide-calendar-days',
  FURTHER_STUDY: 'i-lucide-graduation-cap',
  CERTIFICATE: 'i-lucide-award',
  OTHER: 'i-lucide-circle-help'
}
