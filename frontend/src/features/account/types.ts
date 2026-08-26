/**
 * 账号领域类型（FE-070 账号外壳，mock-first；组织身份不在此处 —— 见 FE-040）。
 *
 * 均使用占位 fixture 数据；不实现真实认证。
 */

import type {
  HomepageImage,
  RegistrationState,
  TeamPostStatus,
  TeamPostType
} from '@/shared/types/homepage'

/** 个人资料。 */
export interface AccountProfile {
  nickname: string
  realName: string
  major: string
  grade: string
  bio: string
  skills: string[]
  avatar: HomepageImage
}

/** 关注的竞赛。 */
export interface AccountFollowedCompetition {
  id: string
  name: string
  edition: string
  deadlineAt: string | null
  detailPath: string
  followedAt: string
}

/** 我的组队帖子。 */
export interface AccountTeamPost {
  id: string
  title: string
  competitionName: string
  position: 'PUBLISHED' | 'JOINED'
  postType: TeamPostType
  status: TeamPostStatus
  memberCount: number
  targetMemberCount: number
  publishedAt: string
  detailPath: string
}

/** 我的申请（组队 / 组织）。 */
export interface AccountApplication {
  id: string
  targetType: 'TEAM' | 'ORG'
  /** 目标名称（队伍标题 / 招新标题）。 */
  targetName: string
  positionName: string | null
  state: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  submittedAt: string
  detailPath: string
}

/** 我报名的活动。 */
export interface AccountActivity {
  id: string
  title: string
  startAt: string
  location: string
  registrationState: RegistrationState
  detailPath: string
}

/** 我的咨询 / 提问。 */
export interface AccountQuestion {
  id: string
  title: string
  visibility: 'PUBLIC' | 'PRIVATE'
  state: 'PENDING' | 'ANSWERED'
  updatedAt: string
  detailPath: string
}
