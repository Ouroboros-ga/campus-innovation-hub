import type { GuideCategory } from '@/shared/types/homepage'

export type FaqPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type FaqAllowedAction = 'EDIT' | 'PUBLISH' | 'FEATURE' | 'ARCHIVE'

export interface FaqEditorDraft {
  category: GuideCategory
  question: string
  answerMd: string
  sortOrder: number
  isFeatured: boolean
  featuredOrder: number
}

export interface OpsFaq {
  id: string
  category: GuideCategory
  question: string
  answerMd: string
  sortOrder: number
  isFeatured: boolean
  featuredOrder: number
  publicationState: FaqPublicationState
  publishedAt: string | null
  updatedAt: string | null
  allowedActions: FaqAllowedAction[]
  detailPath: string
}

export const emptyFaqDraft = (): FaqEditorDraft => ({
  category: 'COMPETITION',
  question: '',
  answerMd: '',
  sortOrder: 0,
  isFeatured: false,
  featuredOrder: 0
})
