/**
 * 咨询与指南查询 / 提交逻辑（FE-051）
 *
 * - findGuideDetail：按 id 合并指南摘要与正文（找不到则返回 null）；
 * - findQaPost：按 id 查找公开问答；
 * - 咨询提交为 mock-first：内存记录 + 字段校验。
 */

import { guideList } from '@/mocks/fixtures/homepage'
import {
  consultGuideBodies,
  consultGuides,
  consultQaPosts
} from '@/mocks/fixtures/consultation'
import type { GuideSummary } from '@/shared/types/homepage'

import type {
  ConsultGuideDetail,
  ConsultQaPost,
  ConsultationDraft
} from '../types'

const FALLBACK_BODY =
  '本指南正在完善中，具体内容以官方通知为准。'

/** 汇总全部指南（咨询页 + 首页热门指南），按 id 去重。 */
const allGuides: GuideSummary[] = [...consultGuides, ...guideList]

/** 按 id 获取指南详情；找不到返回 null。同时接受 URL slug（与 id 解耦）。 */
export function findGuideDetail(id: string): ConsultGuideDetail | null {
  const guide = allGuides.find(
    item => item.id === id || item.detailPath === `/qa/guides/${id}`
  )
  if (!guide) return null
  return {
    ...guide,
    body: consultGuideBodies[guide.id] ?? FALLBACK_BODY
  }
}

/** 按 id 获取公开问答；找不到返回 null。同时接受 URL slug。 */
export function findQaPost(id: string): ConsultQaPost | null {
  return (
    consultQaPosts.find(
      item => item.id === id || item.detailPath === `/qa/questions/${id}`
    ) ?? null
  )
}

/** 咨询类型筛选选项。 */
export const consultationTypeOptions: Array<{ label: string; value: string }> = [
  { label: '竞赛报名', value: 'COMPETITION' },
  { label: '组队相关', value: 'TEAM' },
  { label: '报名操作', value: 'PROCESS' },
  { label: '证书与奖励', value: 'CERTIFICATE' },
  { label: '其他', value: 'OTHER' }
]

/** 校验咨询表单：返回字段级错误，无错误返回 `{}`。 */
export function validateConsultationDraft(
  draft: Pick<ConsultationDraft, 'type' | 'title' | 'description' | 'contact'>
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.type) errors.type = '请选择咨询类型'
  if (!draft.title.trim()) errors.title = '请填写标题'
  if (!draft.description.trim()) errors.description = '请填写详细描述'
  if (!draft.contact.trim()) errors.contact = '请填写联系方式'
  return errors
}

/** 内存中的咨询提交记录。 */
const submittedConsultations: ConsultationDraft[] = []

/** 提交咨询（mock 即时成功，存入内存）。 */
export function submitConsultation(draft: ConsultationDraft): ConsultationDraft {
  const record: ConsultationDraft = {
    type: draft.type,
    title: draft.title.trim(),
    description: draft.description.trim(),
    relatedCompetition: draft.relatedCompetition.trim(),
    contact: draft.contact.trim()
  }
  submittedConsultations.push(record)
  return record
}

/** 测试用：清空内存中的咨询提交记录。 */
export function resetConsultationSubmissions(): void {
  submittedConsultations.length = 0
}
