/**
 * 组队广场视图模型（FE-030）
 *
 * 来源：docs/product/PageMap.md 组队广场 / FrontendDesign.md §22。
 * 规则（database-design.md §1.3 / §36）：日期一律 ISO 8601；可推导展示文本运行时派生。
 */

import type {
  TeamPostStatus,
  TeamPostType
} from '@/shared/types/homepage'

/** 组队广场中的一条队伍招募 / 组队帖子。 */
export interface TeamPost {
  id: string
  title: string
  postType: TeamPostType
  status: TeamPostStatus
  /** 关联竞赛 id（用于「关联竞赛」筛选）。 */
  competitionId: string
  competitionName: string
  baseMemberCount: number
  targetMemberCount: number
  /** 招募岗位。 */
  roles: string[]
  /** 技能标签。 */
  skills: string[]
  /** 目标说明。 */
  goal: string
  creatorName: string
  creatorGrade: string
  creatorMajor: string
  /** 是否本人发布（显示「我发布的」与编辑 / 关闭操作）。 */
  isOwned: boolean
  /** ISO 8601 发布时间。 */
  publishedAt: string
  detailPath: string
}

/** 组队广场筛选查询（URL 承载）。 */
export interface TeamQuery {
  competition?: string
  postType?: string
  status?: string
  page?: number
}

/** 组队详情（FE-031）= 列表帖 + 详情区块。 */
export interface TeamPostDetail extends TeamPost {
  /** 项目 / 方向。 */
  direction: string
  /** 已有成员情况。 */
  currentMembers: string
  /** 预计投入。 */
  expectedEffort: string
  /** 详细目标说明（正文）。 */
  intro: string
  /** 发布者公开资料（可选一句话简介）。 */
  creatorBio: string | null
}

/** 我的组队申请状态。 */
export type TeamApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

/** 我的组队申请记录。 */
export interface MyTeamApplication {
  teamId: string
  selfIntro: string
  skills: string | null
  experience: string | null
  motivation: string
  weeklyCommitment: string | null
  contact: string
  status: TeamApplicationStatus
  submittedAt: string
}

/** 组队申请表单草稿。 */
export interface TeamApplicationDraft {
  teamId: string
  selfIntro: string
  skills: string
  experience: string
  motivation: string
  weeklyCommitment: string
  contact: string
}

/** 创建组队帖子表单数据（FE-032）。 */
export interface TeamPostDraft {
  /** 关联竞赛 id。 */
  competitionId: string
  postType: TeamPostType
  title: string
  /** 队伍名称（可选）。 */
  teamName: string
  /** 项目 / 方向简介。 */
  direction: string
  /** 当前人数。 */
  baseMemberCount: number
  /** 计划人数。 */
  targetMemberCount: number
  /** 已有成员情况。 */
  currentMembers: string
  /** 招募岗位。 */
  roles: string[]
  /** 技能要求。 */
  skills: string[]
  /** 目标。 */
  goal: string
  /** 预计投入时间。 */
  expectedEffort: string
  /** 联系方式（默认不公开）。 */
  contact: string
  /** 其他说明。 */
  notes: string
}

