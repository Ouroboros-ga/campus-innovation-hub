/**
 * 组队申请 Mock Store（FE-031）
 *
 * 在 API 集成前，用内存记录当前用户的组队申请（Mock-First）。
 * 真实阶段：迁移到 Pinia store + feature API 模块 + shared HTTP 层。
 *
 * 规则（database-design.md）：同一用户同一队伍仅允许一个有效申请（PENDING / ACCEPTED）。
 */

import type {
  MyTeamApplication,
  TeamApplicationDraft,
  TeamApplicationStatus
} from '../types'

/** 内存中的当前用户组队申请记录。 */
const myApplications: MyTeamApplication[] = []

/** 申请状态展示标签。 */
export const teamApplicationStateLabel: Record<TeamApplicationStatus, string> = {
  PENDING: '待处理',
  ACCEPTED: '已通过',
  REJECTED: '未通过'
}

/** 提交组队申请，返回新记录（mock 即时 PENDING）。 */
export function submitTeamApplication(
  draft: TeamApplicationDraft
): MyTeamApplication {
  const record: MyTeamApplication = {
    teamId: draft.teamId,
    selfIntro: draft.selfIntro.trim(),
    skills: draft.skills.trim() || null,
    experience: draft.experience.trim() || null,
    motivation: draft.motivation.trim(),
    weeklyCommitment: draft.weeklyCommitment.trim() || null,
    contact: draft.contact.trim(),
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  }
  myApplications.push(record)
  return record
}

/** 查询当前用户在某队伍下的有效申请（PENDING / ACCEPTED）。 */
export function getMyTeamApplication(
  teamId: string
): MyTeamApplication | undefined {
  return myApplications.find(
    item =>
      item.teamId === teamId &&
      (item.status === 'PENDING' || item.status === 'ACCEPTED')
  )
}

/** 测试用：清空内存中的申请记录。 */
export function resetTeamApplications(): void {
  myApplications.length = 0
}

/** 组队申请表单校验：返回字段级错误（含必填），无错误返回 `{}`。 */
export function validateTeamApplicationDraft(
  draft: Pick<
    TeamApplicationDraft,
    'selfIntro' | 'motivation' | 'weeklyCommitment' | 'contact'
  >
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.selfIntro.trim()) errors.selfIntro = '请填写简单介绍'
  if (!draft.motivation.trim()) errors.motivation = '请填写申请理由'
  if (!draft.weeklyCommitment.trim()) errors.weeklyCommitment = '请填写每周投入'
  if (!draft.contact.trim()) errors.contact = '请填写联系方式'
  return errors
}
