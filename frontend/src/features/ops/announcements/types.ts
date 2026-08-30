import type { AnnouncementLinkedKind, AnnouncementPublisherScope } from '@/features/dynamics/types'

export type AnnouncementPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type AnnouncementAllowedAction = 'EDIT' | 'PUBLISH' | 'ARCHIVE'

export interface AnnouncementRelation {
  kind: AnnouncementLinkedKind
  id: string
  title: string
  path: string
}

export interface AnnouncementEditorDraft {
  title: string
  summary: string
  bodyMd: string
  publisherScope: AnnouncementPublisherScope
  sourceName: string
  externalUrl: string
  isPinned: boolean
  isHomeFeatured: boolean
  relation: AnnouncementRelation | null
}

export interface OpsAnnouncement {
  id: string
  title: string
  summary: string | null
  bodyMd: string
  publisherScope: AnnouncementPublisherScope
  sourceName: string | null
  externalUrl: string | null
  isPinned: boolean
  isHomeFeatured: boolean
  homeFeaturedOrder: number
  relation: AnnouncementRelation | null
  publicationState: AnnouncementPublicationState
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  allowedActions: AnnouncementAllowedAction[]
  detailPath: string
}

export const emptyAnnouncementDraft = (): AnnouncementEditorDraft => ({
  title: '',
  summary: '',
  bodyMd: '',
  publisherScope: 'PLATFORM',
  sourceName: '',
  externalUrl: '',
  isPinned: false,
  isHomeFeatured: false,
  relation: null
})
