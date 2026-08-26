/**
 * 招新申请 Mock Store（FE-042）
 *
 * 在 API 集成前，用内存记录当前用户的招新申请（Mock-First）。
 * 真实阶段：迁移到 Pinia store + feature API 模块 + shared HTTP 层。
 *
 * 规则（database-design.md §11.3）：
 * - 同一用户同一轮招新仅允许一个 PENDING / ACCEPTED 申请；
 * - 被拒绝或撤回后可重新提交（新行）。
 */

import type {
  MyRecruitmentApplication,
  RecruitmentApplicationDraft
} from '../types'

/** 内存中的当前用户招新申请记录。 */
const myApplications: MyRecruitmentApplication[] = []

/** 提交招新申请，返回新记录（mock 即时 PENDING）。 */
export function submitRecruitmentApplication(
  draft: RecruitmentApplicationDraft,
  positionName: string
): MyRecruitmentApplication {
  const record: MyRecruitmentApplication = {
    recruitmentId: draft.recruitmentId,
    positionId: draft.positionId,
    positionName,
    selfIntro: draft.selfIntro,
    skills: draft.skills || null,
    experience: draft.experience || null,
    motivation: draft.motivation,
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  }
  myApplications.push(record)
  return record
}

/** 查询当前用户在某轮招新下的有效申请（PENDING / ACCEPTED）。 */
export function getMyActiveApplication(
  recruitmentId: string
): MyRecruitmentApplication | undefined {
  return myApplications.find(
    item => item.recruitmentId === recruitmentId &&
      (item.status === 'PENDING' || item.status === 'ACCEPTED')
  )
}

/** 查询该轮招新最近一次申请（含被撤回 / 拒绝，用于提示可重提）。 */
export function getMyLastApplication(
  recruitmentId: string
): MyRecruitmentApplication | undefined {
  return [...myApplications]
    .filter(item => item.recruitmentId === recruitmentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
}

/** 测试用：清空内存中的申请记录。 */
export function resetRecruitmentApplications(): void {
  myApplications.length = 0
}

/** 申请表单校验：返回字段级错误（含必填），无错误返回 `{}`。 */
export function validateRecruitmentDraft(
  draft: Pick<RecruitmentApplicationDraft, 'positionId' | 'selfIntro' | 'motivation'>
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.positionId) errors.positionId = '请选择申请岗位'
  if (!draft.selfIntro.trim()) errors.selfIntro = '请填写自我介绍'
  if (!draft.motivation.trim()) errors.motivation = '请填写申请理由'
  return errors
}
