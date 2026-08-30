import type { AnnouncementPublisherScope, DynamicsActivity } from '@/features/dynamics/types'
import type { ActivityType, MediaImage, PublicationState } from '@/shared/types/homepage'

export type ActivityAllowedAction = 'EDIT' | 'PUBLISH' | 'ARCHIVE' | 'CANCEL' | 'FEATURE'

export interface ActivityEditorDraft {
  title: string
  activityType: ActivityType
  summary: string
  descriptionMd: string
  organizerOrganizationId: string | null
  organizerName: string
  speaker: string
  location: string
  startAt: string
  endAt: string
  registrationRequired: boolean
  registrationStartAt: string
  registrationEndAt: string
  capacity: number | null
  notesMd: string
  cover: MediaImage | null
}

export interface OpsActivity extends Omit<DynamicsActivity, 'publicationState' | 'cover'> {
  publicationState: PublicationState
  cover: MediaImage | null
  organizerOrganizationId: string | null
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  allowedActions: ActivityAllowedAction[]
}

export interface ActivityAnnouncementIntent {
  enabled: boolean
  title: string
  publisherScope: AnnouncementPublisherScope
  bodyMd: string
  externalUrl: string
}

export const emptyActivityDraft = (): ActivityEditorDraft => ({
  title: '',
  activityType: 'TECH_SHARING',
  summary: '',
  descriptionMd: '',
  organizerOrganizationId: null,
  organizerName: '',
  speaker: '',
  location: '',
  startAt: '',
  endAt: '',
  registrationRequired: false,
  registrationStartAt: '',
  registrationEndAt: '',
  capacity: null,
  notesMd: '',
  cover: null
})
