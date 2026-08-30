import type { GuideCategory } from '@/shared/types/homepage'

export type GuidePublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type GuideAllowedAction =
  | 'EDIT'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'DELETE_DRAFT'
  | 'FEATURE'

export interface GuideEditorDraft {
  title: string
  category: GuideCategory
  summary: string
  bodyMd: string
  competitionIds: string[]
  isFeatured: boolean
  featuredOrder: number
}

export interface GuideRelatedCompetition {
  id: string
  title: string
}

export interface OpsGuide {
  id: string
  title: string
  category: GuideCategory
  summary: string | null
  bodyMd: string
  competitionIds: string[]
  relatedCompetitions: GuideRelatedCompetition[]
  isFeatured: boolean
  featuredOrder: number
  publicationState: GuidePublicationState
  publishedAt: string | null
  updatedAt: string | null
  allowedActions: GuideAllowedAction[]
  detailPath: string
}

export interface GuideCompetitionOption {
  label: string
  value: string
}

export const emptyGuideDraft = (): GuideEditorDraft => ({
  title: '',
  category: 'COMPETITION',
  summary: '',
  bodyMd: '',
  competitionIds: [],
  isFeatured: false,
  featuredOrder: 0
})
