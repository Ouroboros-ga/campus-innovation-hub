/**
 * 组织详情 / 招新详情辅助（FE-041 / FE-042）
 *
 * - `findOrganizationDetail`：按组织 id 查组织主页详情；
 * - `findRecruitmentDetail`：按组织 id + 招新 id 查招新详情；
 * - `deriveRecruitmentPhase`：招新自身开放阶段（§11.1 派生 application_state）；
 * - `recruitmentCanApply`：是否允许当前用户发起申请。
 *
 * 派生规则（database-design.md §11.1）：
 *   DRAFT/CANCELLED/ARCHIVED 直接对应；completed_at 非空 -> COMPLETED；
 *   未到报名开始 -> UPCOMING；报名窗口内 -> OPEN；否则 -> CLOSED。
 */

import {
  organizationDetails,
  recruitmentDetails
} from '@/mocks/fixtures/organizations'
import type {
  OrganizationDetail,
  RecruitmentDetail,
  RecruitmentPhaseState
} from '../types'

/** 按组织 id 查找组织详情。 */
export function findOrganizationDetail(
  id: string
): OrganizationDetail | undefined {
  return organizationDetails.find(item => item.id === id)
}

/** 按组织 id + 招新 id 查找招新详情。 */
export function findRecruitmentDetail(
  organizationId: string,
  recruitmentId: string
): RecruitmentDetail | undefined {
  return recruitmentDetails.find(
    item => item.id === recruitmentId && item.organization.id === organizationId
  )
}

/**
 * 派生招新开放阶段（供详情页状态与主操作判断）。
 */
export function deriveRecruitmentPhase(
  recruitment: RecruitmentDetail,
  now: Date
): RecruitmentPhaseState {
  if (recruitment.publicationState === 'DRAFT') return 'DRAFT'
  if (recruitment.publicationState === 'CANCELLED') return 'CANCELLED'
  if (recruitment.publicationState === 'ARCHIVED') return 'ARCHIVED'
  if (recruitment.completedAt != null) return 'COMPLETED'

  if (recruitment.publicationState !== 'PUBLISHED') return 'CLOSED'

  const nowMs = now.getTime()
  const startMs = recruitment.applyStartAt
    ? new Date(recruitment.applyStartAt).getTime()
    : null
  const endMs = recruitment.applyEndAt
    ? new Date(recruitment.applyEndAt).getTime()
    : null

  if (startMs != null && nowMs < startMs) return 'UPCOMING'
  if (endMs != null && nowMs > endMs) return 'CLOSED'
  return 'OPEN'
}

/** 当前用户是否可发起申请（仅 OPEN 阶段可申请）。 */
export function recruitmentCanApply(
  phase: RecruitmentPhaseState
): boolean {
  return phase === 'OPEN'
}
