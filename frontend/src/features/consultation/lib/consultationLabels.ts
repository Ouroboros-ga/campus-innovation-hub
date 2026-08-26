/**
 * 咨询与指南区块展示元数据（FE-050）。
 *
 * 只映射稳定枚举到展示文案与语义色；指南分类复用 domain-labels。
 */

import type { ConsultQaStatus } from '../types'

export interface SectionMeta {
  title: string
  icon: string
}

/** 常见问题区块元数据。 */
export const faqSectionMeta: SectionMeta = {
  title: '常见问题',
  icon: 'i-lucide-circle-help'
}

/** 指南区块元数据。 */
export const guideSectionMeta: SectionMeta = {
  title: '指南',
  icon: 'i-lucide-book-open'
}

/** 公开问答区块元数据。 */
export const qaSectionMeta: SectionMeta = {
  title: '公开问答',
  icon: 'i-lucide-message-square-text'
}

/** 公开问答状态徽标。 */
export const qaStatusMeta: Record<ConsultQaStatus, { label: string; color: 'success' | 'warning' }> = {
  ANSWERED: { label: '已回复', color: 'success' },
  PENDING: { label: '待回复', color: 'warning' }
}

/** 顶部导航段。 */
export const consultSections = [
  { id: 'faq', ...faqSectionMeta },
  { id: 'guide', ...guideSectionMeta },
  { id: 'qa', ...qaSectionMeta }
] as const
