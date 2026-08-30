/** 公告运营 API 适配器：唯一负责管理 DTO 与编辑领域模型的边界。 */

import type { AnnouncementLinkedKind, AnnouncementPublisherScope } from '@/features/dynamics/types'
import type {
  AnnouncementAllowedAction,
  AnnouncementEditorDraft,
  AnnouncementPublicationState,
  AnnouncementRelation,
  OpsAnnouncement
} from '@/features/ops/announcements/types'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'

interface AnnouncementWriteDto {
  title: string
  summary: string | null
  body_md: string
  publisher_scope: AnnouncementPublisherScope
  source_name: string | null
  external_url: string | null
  is_pinned: boolean
  is_home_featured: boolean
  competition_id: string | null
  activity_id: string | null
  organization_id: string | null
  recruitment_id: string | null
}

interface PaginatedDto {
  count: number
  results: unknown[]
}

const publisherScopes = new Set<AnnouncementPublisherScope>(['ACADEMY', 'UNIVERSITY', 'PLATFORM'])
const publicationStates = new Set<AnnouncementPublicationState>(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
const allowedActions = new Set<AnnouncementAllowedAction>(['EDIT', 'PUBLISH', 'ARCHIVE'])
const relationKinds = new Set<AnnouncementLinkedKind>(['COMPETITION', 'ACTIVITY', 'ORGANIZATION', 'RECRUITMENT'])

function invalidResponse(): never {
  throw new AppError('公告管理接口返回了无法识别的数据。', {
    status: 0,
    code: 'INVALID_RESPONSE'
  })
}

function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse()
  return value as Record<string, unknown>
}

function nullableString(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') invalidResponse()
  return value
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) invalidResponse()
  return [...value]
}

function parseRelation(value: unknown): AnnouncementRelation | null {
  if (value === null) return null
  const dto = recordOf(value)
  if (
    typeof dto.type !== 'string' ||
    !relationKinds.has(dto.type as AnnouncementLinkedKind) ||
    typeof dto.id !== 'string' ||
    typeof dto.title !== 'string' ||
    typeof dto.path !== 'string'
  ) invalidResponse()
  return {
    kind: dto.type as AnnouncementLinkedKind,
    id: dto.id,
    title: dto.title,
    path: dto.path
  }
}

function parseAnnouncement(value: unknown): OpsAnnouncement {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.title !== 'string' ||
    typeof dto.body_md !== 'string' ||
    typeof dto.publisher_scope !== 'string' ||
    !publisherScopes.has(dto.publisher_scope as AnnouncementPublisherScope) ||
    typeof dto.is_pinned !== 'boolean' ||
    typeof dto.is_home_featured !== 'boolean' ||
    typeof dto.home_featured_order !== 'number' ||
    !Number.isInteger(dto.home_featured_order) ||
    dto.home_featured_order < 0 ||
    typeof dto.publication_state !== 'string' ||
    !publicationStates.has(dto.publication_state as AnnouncementPublicationState)
  ) invalidResponse()

  const actions = stringArray(dto.allowed_actions)
  if (actions.some(action => !allowedActions.has(action as AnnouncementAllowedAction))) invalidResponse()

  return {
    id: dto.id,
    title: dto.title,
    summary: nullableString(dto.summary),
    bodyMd: dto.body_md,
    publisherScope: dto.publisher_scope as AnnouncementPublisherScope,
    sourceName: nullableString(dto.source_name),
    externalUrl: nullableString(dto.external_url),
    isPinned: dto.is_pinned,
    isHomeFeatured: dto.is_home_featured,
    homeFeaturedOrder: dto.home_featured_order,
    relation: parseRelation(dto.linked_object),
    publicationState: dto.publication_state as AnnouncementPublicationState,
    publishedAt: nullableString(dto.published_at),
    createdAt: nullableString(dto.created_at),
    updatedAt: nullableString(dto.updated_at),
    allowedActions: actions as AnnouncementAllowedAction[],
    detailPath: `/activities/announcements/${dto.id}`
  }
}

export function validateAnnouncement(draft: AnnouncementEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = draft.title.trim()
  if (!title) errors.title = '请填写公告标题'
  else if (title.length < 2) errors.title = '公告标题至少需要 2 个字符'
  if (!draft.bodyMd.trim()) errors.bodyMd = '请填写公告正文'
  if (draft.summary.length > 300) errors.summary = '摘要不能超过 300 个字符'
  if (draft.relation && !draft.relation.id) errors.relation = '关联内容缺少标识，无法保存'
  return errors
}

export function toAnnouncementWriteDto(draft: AnnouncementEditorDraft): AnnouncementWriteDto {
  const relation = draft.relation
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim() || null,
    body_md: draft.bodyMd,
    publisher_scope: draft.publisherScope,
    source_name: draft.sourceName.trim() || null,
    external_url: draft.externalUrl.trim() || null,
    is_pinned: draft.isPinned,
    is_home_featured: draft.isHomeFeatured,
    competition_id: relation?.kind === 'COMPETITION' ? relation.id : null,
    activity_id: relation?.kind === 'ACTIVITY' ? relation.id : null,
    organization_id: relation?.kind === 'ORGANIZATION' ? relation.id : null,
    recruitment_id: relation?.kind === 'RECRUITMENT' ? relation.id : null
  }
}

export function toAnnouncementEditorDraft(announcement: OpsAnnouncement): AnnouncementEditorDraft {
  return {
    title: announcement.title,
    summary: announcement.summary ?? '',
    bodyMd: announcement.bodyMd,
    publisherScope: announcement.publisherScope,
    sourceName: announcement.sourceName ?? '',
    externalUrl: announcement.externalUrl ?? '',
    isPinned: announcement.isPinned,
    isHomeFeatured: announcement.isHomeFeatured,
    relation: announcement.relation ? { ...announcement.relation } : null
  }
}

export async function getAnnouncement(id: string, signal?: AbortSignal): Promise<OpsAnnouncement> {
  return parseAnnouncement(await http.get<unknown>(`/ops/announcements/${id}`, { signal }))
}

export async function createAnnouncement(draft: AnnouncementEditorDraft, publish = false): Promise<OpsAnnouncement> {
  return parseAnnouncement(await http.post<unknown>('/ops/announcements', {
    ...toAnnouncementWriteDto(draft),
    publish
  }))
}

export async function updateAnnouncement(id: string, draft: AnnouncementEditorDraft): Promise<OpsAnnouncement> {
  return parseAnnouncement(await http.patch<unknown>(`/ops/announcements/${id}`, toAnnouncementWriteDto(draft)))
}

export async function publishAnnouncement(id: string): Promise<void> {
  await http.post(`/ops/announcements/${id}/publish`)
}

export async function archiveAnnouncement(id: string): Promise<void> {
  await http.post(`/ops/announcements/${id}/archive`)
}

export async function listAnnouncements(params: {
  q?: string
  status?: string
  publisherScope?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsAnnouncement[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/announcements', {
    query: {
      q: params.q,
      status: params.status,
      publisher_scope: params.publisherScope,
      page: params.page,
      page_size: params.pageSize
    }
  })
  if (!response || typeof response.count !== 'number' || !Array.isArray(response.results)) invalidResponse()
  return {
    items: response.results.map(parseAnnouncement),
    total: response.count,
    page: params.page ?? 1
  }
}

export type { AnnouncementEditorDraft, OpsAnnouncement } from '@/features/ops/announcements/types'
