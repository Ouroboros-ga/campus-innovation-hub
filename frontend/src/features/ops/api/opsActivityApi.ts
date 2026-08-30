/** 活动运营 DTO 边界，组合发布只通过一个事务 endpoint 完成。 */

import type { AnnouncementPublisherScope } from '@/features/dynamics/types'
import type {
  ActivityAllowedAction,
  ActivityEditorDraft,
  OpsActivity
} from '@/features/ops/activities/types'
import { getCsrfToken, http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import type { ActivityType, PublicationState } from '@/shared/types/homepage'

interface ActivityWriteDto {
  title: string
  activity_type: ActivityType
  summary: string | null
  description_md: string
  organizer_organization_id: string | null
  organizer_name: string | null
  speaker: string | null
  location: string
  start_at: string
  end_at: string | null
  registration_required: boolean
  registration_start_at: string | null
  registration_end_at: string | null
  capacity: number | null
  notes_md: string | null
  cover_asset_id: string | null
}

interface PaginatedDto {
  count: number
  results: unknown[]
}

const activityTypes = new Set<ActivityType>([
  'COMPETITION_BRIEFING', 'TECH_SHARING', 'RESEARCH_LECTURE',
  'FURTHER_STUDY', 'ENTERPRISE', 'TRAINING', 'OTHER'
])
const publicationStates = new Set<PublicationState>(['DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED'])
const allowedActions = new Set<ActivityAllowedAction>(['EDIT', 'PUBLISH', 'ARCHIVE', 'CANCEL', 'FEATURE'])
const publisherScopes = new Set<AnnouncementPublisherScope>(['ACADEMY', 'UNIVERSITY', 'PLATFORM'])

function invalidResponse(): never {
  throw new AppError('活动管理接口返回了无法识别的数据。', {
    status: 0,
    code: 'INVALID_RESPONSE'
  })
}

function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse()
  return value as Record<string, unknown>
}

function nullableNumber(value: unknown): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) invalidResponse()
  return value as number | null
}

function parseCover(value: unknown, fallbackAlt: string) {
  if (value === null) return null
  const dto = recordOf(value)
  if (typeof dto.id !== 'string' || (dto.url !== null && typeof dto.url !== 'string')) invalidResponse()
  return { id: dto.id, src: dto.url, alt: typeof dto.alt === 'string' ? dto.alt : fallbackAlt }
}

function parseActivity(value: unknown): OpsActivity {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.title !== 'string' ||
    typeof dto.activity_type !== 'string' || !activityTypes.has(dto.activity_type as ActivityType) ||
    typeof dto.location !== 'string' ||
    typeof dto.start_at !== 'string' ||
    typeof dto.registration_required !== 'boolean' ||
    typeof dto.description_md !== 'string' ||
    typeof dto.is_featured !== 'boolean' ||
    typeof dto.publication_state !== 'string' || !publicationStates.has(dto.publication_state as PublicationState) ||
    typeof dto.featured_order !== 'number' || !Number.isInteger(dto.featured_order) || dto.featured_order < 0
  ) invalidResponse()
  for (const key of ['summary', 'organizer_organization_id', 'organizer_name', 'speaker', 'end_at', 'registration_start_at', 'registration_end_at', 'notes_md', 'published_at', 'created_at', 'updated_at']) {
    if (dto[key] !== null && typeof dto[key] !== 'string') invalidResponse()
  }
  const actions = dto.allowed_actions
  if (!Array.isArray(actions) || actions.some(action => typeof action !== 'string' || !allowedActions.has(action as ActivityAllowedAction))) invalidResponse()

  return {
    id: dto.id,
    title: dto.title,
    activityType: dto.activity_type as ActivityType,
    summary: dto.summary as string | null,
    organizerName: dto.organizer_name as string | null,
    organizerOrganizationId: dto.organizer_organization_id as string | null,
    speaker: dto.speaker as string | null,
    location: dto.location,
    startAt: dto.start_at,
    endAt: dto.end_at as string | null,
    registrationRequired: dto.registration_required,
    registrationStartAt: dto.registration_start_at as string | null,
    registrationEndAt: dto.registration_end_at as string | null,
    capacity: nullableNumber(dto.capacity),
    descriptionMd: dto.description_md,
    notesMd: dto.notes_md as string | null,
    isFeatured: dto.is_featured,
    publicationState: dto.publication_state as PublicationState,
    publishedAt: dto.published_at as string | null,
    createdAt: dto.created_at as string | null,
    updatedAt: dto.updated_at as string | null,
    allowedActions: [...actions] as ActivityAllowedAction[],
    cover: parseCover(dto.cover, dto.title),
    detailPath: `/activities/${dto.id}`
  }
}

export function validateActivity(draft: ActivityEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.title.trim().length < 2) errors.title = '活动名称至少需要 2 个字符'
  if (!draft.location.trim()) errors.location = '请填写活动地点'
  if (!draft.startAt) errors.startAt = '请选择开始时间'
  if (!draft.descriptionMd.trim()) errors.descriptionMd = '请填写活动正文'
  if (draft.endAt && draft.startAt && draft.startAt > draft.endAt) errors.startAt = '开始时间不能晚于结束时间'
  if (draft.registrationRequired && draft.registrationStartAt && draft.registrationEndAt && draft.registrationStartAt > draft.registrationEndAt) {
    errors.registrationStartAt = '报名开始时间不能晚于结束时间'
  }
  return errors
}

export function toActivityWriteDto(draft: ActivityEditorDraft): ActivityWriteDto {
  const registrationRequired = draft.registrationRequired
  return {
    title: draft.title.trim(),
    activity_type: draft.activityType,
    summary: draft.summary.trim() || null,
    description_md: draft.descriptionMd,
    organizer_organization_id: draft.organizerOrganizationId,
    organizer_name: draft.organizerName.trim() || null,
    speaker: draft.speaker.trim() || null,
    location: draft.location.trim(),
    start_at: draft.startAt,
    end_at: draft.endAt || null,
    registration_required: registrationRequired,
    registration_start_at: registrationRequired ? draft.registrationStartAt || null : null,
    registration_end_at: registrationRequired ? draft.registrationEndAt || null : null,
    capacity: registrationRequired ? draft.capacity : null,
    notes_md: draft.notesMd.trim() || null,
    cover_asset_id: draft.cover?.id ?? null
  }
}

export function toActivityEditorDraft(activity: OpsActivity): ActivityEditorDraft {
  return {
    title: activity.title,
    activityType: activity.activityType,
    summary: activity.summary ?? '',
    descriptionMd: activity.descriptionMd ?? '',
    organizerOrganizationId: activity.organizerOrganizationId,
    organizerName: activity.organizerName ?? '',
    speaker: activity.speaker ?? '',
    location: activity.location,
    startAt: activity.startAt,
    endAt: activity.endAt ?? '',
    registrationRequired: activity.registrationRequired,
    registrationStartAt: activity.registrationStartAt ?? '',
    registrationEndAt: activity.registrationEndAt ?? '',
    capacity: activity.capacity,
    notesMd: activity.notesMd ?? '',
    cover: activity.cover ? { ...activity.cover } : null
  }
}

export async function getActivity(id: string, signal?: AbortSignal): Promise<OpsActivity> {
  return parseActivity(await http.get<unknown>(`/ops/activities/${id}`, { signal }))
}

export async function createActivity(draft: ActivityEditorDraft, publish = false): Promise<OpsActivity> {
  return parseActivity(await http.post<unknown>('/ops/activities', {
    ...toActivityWriteDto(draft), publish
  }))
}

export async function updateActivity(id: string, draft: ActivityEditorDraft): Promise<OpsActivity> {
  return parseActivity(await http.patch<unknown>(`/ops/activities/${id}`, toActivityWriteDto(draft)))
}

export async function publishActivity(id: string): Promise<void> {
  await http.post(`/ops/activities/${id}/publish`)
}

export async function cancelActivity(id: string): Promise<void> {
  await http.post(`/ops/activities/${id}/cancel`)
}

export async function archiveActivity(id: string): Promise<void> {
  await http.post(`/ops/activities/${id}/archive`)
}

export async function createActivityWithAnnouncement(
  draft: ActivityEditorDraft,
  announcement: { title: string; publisherScope: AnnouncementPublisherScope; bodyMd: string; externalUrl: string },
  publish: boolean
): Promise<{ activity: OpsActivity }> {
  if (!publisherScopes.has(announcement.publisherScope)) {
    throw new AppError('公告发布范围无效。', { status: 0, code: 'INVALID_INPUT' })
  }
  const response = recordOf(await http.post<unknown>('/ops/dynamics/activity-with-announcement', {
    activity: toActivityWriteDto(draft),
    announcement: {
      title: announcement.title.trim(),
      body_md: announcement.bodyMd,
      publisher_scope: announcement.publisherScope,
      external_url: announcement.externalUrl.trim() || null
    },
    publish
  }))
  return { activity: parseActivity(response.activity) }
}

export async function exportActivityRegistrations(activityId: string): Promise<void> {
  const base = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/+$/, '')
  const headers: Record<string, string> = {}
  const csrfToken = getCsrfToken()
  if (csrfToken) headers['X-CSRFToken'] = csrfToken
  const response = await fetch(`${base}/ops/activities/${activityId}/export-registrations`, {
    method: 'POST', headers, credentials: 'include'
  })
  if (!response.ok) throw new AppError(`导出失败（${response.status}）`, { status: response.status, code: 'HTTP_ERROR' })
  const blob = await response.blob()
  const filename = /filename="?([^"]+)"?/.exec(response.headers.get('Content-Disposition') ?? '')?.[1]
    ?? `activity-${activityId}-registrations.csv`
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function listActivities(params: {
  q?: string
  status?: string
  activityType?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsActivity[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/activities', {
    query: {
      q: params.q, status: params.status, activity_type: params.activityType,
      page: params.page, page_size: params.pageSize
    }
  })
  if (!response || typeof response.count !== 'number' || !Array.isArray(response.results)) invalidResponse()
  return { items: response.results.map(parseActivity), total: response.count, page: params.page ?? 1 }
}

export type { ActivityEditorDraft, OpsActivity } from '@/features/ops/activities/types'
