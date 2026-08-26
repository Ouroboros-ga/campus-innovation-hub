/**
 * 咨询与指南视图模型（FE-050）
 *
 * 来源：docs/product/PageMap.md 咨询指南 / 参考设计稿。
 * 规则（database-design.md §1.3 / §36）：日期一律 ISO 8601；可推导展示文本运行时派生。
 */

import type { FaqCategory, GuideSummary } from '@/shared/types/homepage'

/** 常见问题（FAQ）。 */
export interface ConsultFaq {
  id: string
  category: FaqCategory
  question: string
  answer: string
  /** ISO 8601 更新日期。 */
  updatedAt: string
  detailPath: string
}

/** 指南详情（= 指南摘要 + 正文）。 */
export interface ConsultGuideDetail extends GuideSummary {
  /** 指南正文。 */
  body: string
}

/** 公开问答状态。 */
export type ConsultQaStatus = 'ANSWERED' | 'PENDING'

/** 公开问答（Public Q&A）。 */
export interface ConsultQaPost {
  id: string
  question: string
  answer: string
  /** 关联标签（如竞赛名 / 分类）。 */
  tags: string[]
  status: ConsultQaStatus
  /** 回答者 / 提问者公开名。 */
  authorName: string
  /** ISO 8601 回答日期。 */
  answeredAt: string
  /** 赞同数（仅展示真实数据，此处为 mock）。 */
  likes: number
  detailPath: string
}

/** 咨询提交表单草稿。 */
export interface ConsultationDraft {
  type: string
  title: string
  description: string
  relatedCompetition: string
  contact: string
}
