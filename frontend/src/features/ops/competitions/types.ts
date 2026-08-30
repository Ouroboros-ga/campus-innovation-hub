import type {
  CompetitionCategory,
  CompetitionLevel,
  MediaImage,
  ParticipationMode,
  PublicationState
} from '@/shared/types/homepage'

export type CompetitionAllowedAction =
  | 'EDIT'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'DELETE_DRAFT'
  | 'CANCEL'
  | 'FEATURE'

export interface CompetitionTimelineEvent {
  id: string
  title: string
  eventAt: string
  endAt: string | null
  description: string | null
  sortOrder: number
}

export interface CompetitionEditorDraft {
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participationMode: ParticipationMode
  descriptionMd: string
  collegeOrganized: boolean
  registrationStartAt: string
  registrationEndAt: string
  eventStartAt: string
  eventEndAt: string
  officialUrl: string
  registrationUrl: string
  officialNoticeUrl: string
  cover: MediaImage | null
  suitableGradeMin: number | null
  suitableGradeMax: number | null
  direction: string
  summary: string
  suitableForMd: string
  preparationAdviceMd: string
  collegeContactName: string
  collegeContactText: string
}

export interface OpsCompetition {
  id: string
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participationMode: ParticipationMode
  descriptionMd: string
  collegeOrganized: boolean
  registrationStartAt: string | null
  registrationEndAt: string | null
  eventStartAt: string | null
  eventEndAt: string | null
  officialUrl: string | null
  registrationUrl: string | null
  officialNoticeUrl: string | null
  cover: MediaImage | null
  suitableGradeMin: number | null
  suitableGradeMax: number | null
  direction: string | null
  summary: string | null
  suitableForMd: string | null
  preparationAdviceMd: string | null
  collegeContactName: string | null
  collegeContactText: string | null
  timeline: CompetitionTimelineEvent[]
  publicationState: PublicationState
  publishedAt: string | null
  isFeatured: boolean
  featuredOrder: number
  createdAt: string | null
  updatedAt: string | null
  allowedActions: CompetitionAllowedAction[]
  detailPath: string
}

export const emptyCompetitionDraft = (): CompetitionEditorDraft => ({
  name: '',
  edition: '',
  category: 'OTHER',
  level: 'SCHOOL',
  participationMode: 'INDIVIDUAL',
  descriptionMd: '',
  collegeOrganized: true,
  registrationStartAt: '',
  registrationEndAt: '',
  eventStartAt: '',
  eventEndAt: '',
  officialUrl: '',
  registrationUrl: '',
  officialNoticeUrl: '',
  cover: null,
  suitableGradeMin: null,
  suitableGradeMax: null,
  direction: '',
  summary: '',
  suitableForMd: '',
  preparationAdviceMd: '',
  collegeContactName: '',
  collegeContactText: ''
})
