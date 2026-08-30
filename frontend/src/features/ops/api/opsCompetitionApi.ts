/** 竞赛运营 DTO 边界：严格解析管理详情，编辑页只消费领域模型。 */

import type {
  CompetitionAllowedAction,
  CompetitionEditorDraft,
  CompetitionTimelineEvent,
  OpsCompetition
} from '@/features/ops/competitions/types'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import type { CompetitionCategory, CompetitionLevel, ParticipationMode, PublicationState } from '@/shared/types/homepage'

interface CompetitionWriteDto {
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participation_mode: ParticipationMode
  description_md: string
  college_organized: boolean
  registration_start_at: string | null
  registration_end_at: string | null
  event_start_at: string | null
  event_end_at: string | null
  official_url: string | null
  registration_url: string | null
  official_notice_url: string | null
  cover_asset_id: string | null
  suitable_grade_min: number | null
  suitable_grade_max: number | null
  direction: string | null
  summary: string | null
  suitable_for_md: string | null
  preparation_advice_md: string | null
  college_contact_name: string | null
  college_contact_text: string | null
}

interface PaginatedDto {
  count: number
  results: unknown[]
}

const categories = new Set<CompetitionCategory>([
  'AI', 'PROGRAMMING', 'INNOVATION', 'MATHEMATICAL_MODELING', 'ELECTRONICS',
  'ROBOTICS', 'CYBERSECURITY', 'ELECTRONIC_DESIGN', 'MECHANICAL_DESIGN', 'OTHER'
])
const levels = new Set<CompetitionLevel>(['SCHOOL', 'PROVINCIAL', 'NATIONAL', 'INTERNATIONAL', 'OTHER'])
const participationModes = new Set<ParticipationMode>(['INDIVIDUAL', 'TEAM'])
const publicationStates = new Set<PublicationState>(['DRAFT', 'PUBLISHED', 'CANCELLED', 'ARCHIVED'])
const allowedActions = new Set<CompetitionAllowedAction>([
  'EDIT', 'PUBLISH', 'ARCHIVE', 'DELETE_DRAFT', 'CANCEL', 'FEATURE'
])

function invalidResponse(): never {
  throw new AppError('竞赛管理接口返回了无法识别的数据。', {
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

function nullableInteger(value: unknown): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isInteger(value))) invalidResponse()
  return value as number | null
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) invalidResponse()
  return [...value]
}

function parseTimeline(value: unknown): CompetitionTimelineEvent[] {
  if (!Array.isArray(value)) invalidResponse()
  return value.map(item => {
    const dto = recordOf(item)
    if (
      typeof dto.id !== 'string' ||
      typeof dto.title !== 'string' ||
      typeof dto.event_at !== 'string' ||
      (dto.end_at !== null && typeof dto.end_at !== 'string') ||
      (dto.description !== null && typeof dto.description !== 'string') ||
      typeof dto.sort_order !== 'number' ||
      !Number.isInteger(dto.sort_order) ||
      dto.sort_order < 0
    ) invalidResponse()
    return {
      id: dto.id,
      title: dto.title,
      eventAt: dto.event_at,
      endAt: dto.end_at,
      description: dto.description,
      sortOrder: dto.sort_order
    }
  })
}

function parseCover(value: unknown, fallbackAlt: string) {
  if (value === null) return null
  const dto = recordOf(value)
  if (typeof dto.id !== 'string' || (dto.url !== null && typeof dto.url !== 'string')) invalidResponse()
  return { id: dto.id, src: dto.url, alt: typeof dto.alt === 'string' ? dto.alt : fallbackAlt }
}

function parseCompetition(value: unknown): OpsCompetition {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.name !== 'string' ||
    typeof dto.edition !== 'string' ||
    typeof dto.category !== 'string' || !categories.has(dto.category as CompetitionCategory) ||
    typeof dto.level !== 'string' || !levels.has(dto.level as CompetitionLevel) ||
    typeof dto.participation_mode !== 'string' || !participationModes.has(dto.participation_mode as ParticipationMode) ||
    typeof dto.description_md !== 'string' ||
    typeof dto.college_organized !== 'boolean' ||
    typeof dto.publication_state !== 'string' || !publicationStates.has(dto.publication_state as PublicationState) ||
    typeof dto.is_featured !== 'boolean' ||
    typeof dto.featured_order !== 'number' || !Number.isInteger(dto.featured_order) || dto.featured_order < 0
  ) invalidResponse()

  const actions = stringArray(dto.allowed_actions)
  if (actions.some(action => !allowedActions.has(action as CompetitionAllowedAction))) invalidResponse()
  for (const dateField of ['registration_start_at', 'registration_end_at', 'event_start_at', 'event_end_at', 'published_at', 'created_at', 'updated_at']) {
    if (dto[dateField] !== null && typeof dto[dateField] !== 'string') invalidResponse()
  }

  return {
    id: dto.id,
    name: dto.name,
    edition: dto.edition,
    category: dto.category as CompetitionCategory,
    level: dto.level as CompetitionLevel,
    participationMode: dto.participation_mode as ParticipationMode,
    descriptionMd: dto.description_md,
    collegeOrganized: dto.college_organized,
    registrationStartAt: dto.registration_start_at as string | null,
    registrationEndAt: dto.registration_end_at as string | null,
    eventStartAt: dto.event_start_at as string | null,
    eventEndAt: dto.event_end_at as string | null,
    officialUrl: nullableString(dto.official_url),
    registrationUrl: nullableString(dto.registration_url),
    officialNoticeUrl: nullableString(dto.official_notice_url),
    cover: parseCover(dto.cover, dto.name),
    suitableGradeMin: nullableInteger(dto.suitable_grade_min),
    suitableGradeMax: nullableInteger(dto.suitable_grade_max),
    direction: nullableString(dto.direction),
    summary: nullableString(dto.summary),
    suitableForMd: nullableString(dto.suitable_for_md),
    preparationAdviceMd: nullableString(dto.preparation_advice_md),
    collegeContactName: nullableString(dto.college_contact_name),
    collegeContactText: nullableString(dto.college_contact_text),
    timeline: parseTimeline(dto.timeline),
    publicationState: dto.publication_state as PublicationState,
    publishedAt: dto.published_at as string | null,
    isFeatured: dto.is_featured,
    featuredOrder: dto.featured_order,
    createdAt: dto.created_at as string | null,
    updatedAt: dto.updated_at as string | null,
    allowedActions: actions as CompetitionAllowedAction[],
    detailPath: `/competitions/${dto.id}`
  }
}

export function validateCompetition(draft: CompetitionEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.name.trim().length < 2) errors.name = '竞赛名称至少需要 2 个字符'
  if (!draft.edition.trim()) errors.edition = '请填写竞赛届次'
  if (!draft.descriptionMd.trim()) errors.descriptionMd = '请填写竞赛介绍'
  if ((draft.suitableGradeMin === null) !== (draft.suitableGradeMax === null)) {
    errors.suitableGradeMin = '适合年级上下限必须同时填写或同时为空'
  } else if (draft.suitableGradeMin !== null && draft.suitableGradeMax !== null && draft.suitableGradeMin > draft.suitableGradeMax) {
    errors.suitableGradeMin = '适合年级下限不能大于上限'
  }
  if (draft.registrationStartAt && draft.registrationEndAt && draft.registrationStartAt > draft.registrationEndAt) {
    errors.registrationStartAt = '报名开始时间不能晚于结束时间'
  }
  if (draft.eventStartAt && draft.eventEndAt && draft.eventStartAt > draft.eventEndAt) {
    errors.eventStartAt = '赛事开始时间不能晚于结束时间'
  }
  return errors
}

export function toCompetitionWriteDto(draft: CompetitionEditorDraft): CompetitionWriteDto {
  return {
    name: draft.name.trim(),
    edition: draft.edition.trim(),
    category: draft.category,
    level: draft.level,
    participation_mode: draft.participationMode,
    description_md: draft.descriptionMd,
    college_organized: draft.collegeOrganized,
    registration_start_at: draft.registrationStartAt || null,
    registration_end_at: draft.registrationEndAt || null,
    event_start_at: draft.eventStartAt || null,
    event_end_at: draft.eventEndAt || null,
    official_url: draft.officialUrl.trim() || null,
    registration_url: draft.registrationUrl.trim() || null,
    official_notice_url: draft.officialNoticeUrl.trim() || null,
    cover_asset_id: draft.cover?.id ?? null,
    suitable_grade_min: draft.suitableGradeMin,
    suitable_grade_max: draft.suitableGradeMax,
    direction: draft.direction.trim() || null,
    summary: draft.summary.trim() || null,
    suitable_for_md: draft.suitableForMd.trim() || null,
    preparation_advice_md: draft.preparationAdviceMd.trim() || null,
    college_contact_name: draft.collegeContactName.trim() || null,
    college_contact_text: draft.collegeContactText.trim() || null
  }
}

export function toCompetitionEditorDraft(item: OpsCompetition): CompetitionEditorDraft {
  return {
    name: item.name, edition: item.edition, category: item.category, level: item.level,
    participationMode: item.participationMode, descriptionMd: item.descriptionMd,
    collegeOrganized: item.collegeOrganized, registrationStartAt: item.registrationStartAt ?? '',
    registrationEndAt: item.registrationEndAt ?? '', eventStartAt: item.eventStartAt ?? '',
    eventEndAt: item.eventEndAt ?? '', officialUrl: item.officialUrl ?? '',
    registrationUrl: item.registrationUrl ?? '', officialNoticeUrl: item.officialNoticeUrl ?? '',
    cover: item.cover ? { ...item.cover } : null, suitableGradeMin: item.suitableGradeMin,
    suitableGradeMax: item.suitableGradeMax, direction: item.direction ?? '', summary: item.summary ?? '',
    suitableForMd: item.suitableForMd ?? '', preparationAdviceMd: item.preparationAdviceMd ?? '',
    collegeContactName: item.collegeContactName ?? '', collegeContactText: item.collegeContactText ?? ''
  }
}

export async function getCompetition(id: string, signal?: AbortSignal): Promise<OpsCompetition> {
  return parseCompetition(await http.get<unknown>(`/ops/competitions/${id}`, { signal }))
}

export async function createCompetition(draft: CompetitionEditorDraft, publish = false): Promise<OpsCompetition> {
  return parseCompetition(await http.post<unknown>('/ops/competitions', {
    ...toCompetitionWriteDto(draft), publish
  }))
}

export async function updateCompetition(id: string, draft: CompetitionEditorDraft): Promise<OpsCompetition> {
  return parseCompetition(await http.patch<unknown>(`/ops/competitions/${id}`, toCompetitionWriteDto(draft)))
}

export async function publishCompetition(id: string): Promise<void> {
  await http.post(`/ops/competitions/${id}/publish`)
}

export async function archiveCompetition(id: string): Promise<void> {
  await http.post(`/ops/competitions/${id}/archive`)
}

export async function cancelCompetition(id: string): Promise<void> {
  await http.post(`/ops/competitions/${id}/cancel`)
}

export async function deleteCompetition(id: string): Promise<void> {
  await http.delete(`/ops/competitions/${id}`)
}

export async function createTimelineEvent(id: string, event: Omit<CompetitionTimelineEvent, 'id'>): Promise<CompetitionTimelineEvent> {
  const response = await http.post<unknown>(`/ops/competitions/${id}/timeline-events`, {
    title: event.title, event_at: event.eventAt, end_at: event.endAt,
    description: event.description, sort_order: event.sortOrder
  })
  return parseTimeline([response])[0]!
}

export async function updateTimelineEvent(id: string, event: CompetitionTimelineEvent): Promise<CompetitionTimelineEvent> {
  const response = await http.patch<unknown>(`/ops/competitions/${id}/timeline-events/${event.id}`, {
    title: event.title, event_at: event.eventAt, end_at: event.endAt,
    description: event.description, sort_order: event.sortOrder
  })
  return parseTimeline([response])[0]!
}

export async function deleteTimelineEvent(id: string, eventId: string): Promise<void> {
  await http.delete(`/ops/competitions/${id}/timeline-events/${eventId}`)
}

export async function importCompetitions(file: File): Promise<{ success: number; failed: number; errors: Array<{ row: number; message: string }> }> {
  const form = new FormData()
  form.append('file', file)
  return http.post('/ops/competitions/import', form)
}

export async function listCompetitions(params: {
  q?: string
  status?: string
  category?: string
  level?: string
  isFeatured?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: OpsCompetition[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/competitions', {
    query: {
      q: params.q, status: params.status, category: params.category, level: params.level,
      is_featured: params.isFeatured === undefined ? undefined : String(params.isFeatured),
      page: params.page, page_size: params.pageSize
    }
  })
  if (!response || typeof response.count !== 'number' || !Array.isArray(response.results)) invalidResponse()
  return { items: response.results.map(parseCompetition), total: response.count, page: params.page ?? 1 }
}

export type { CompetitionEditorDraft, OpsCompetition } from '@/features/ops/competitions/types'
