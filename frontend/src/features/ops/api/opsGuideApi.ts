/** 指南运营 API 适配器：唯一负责管理 DTO 与编辑领域模型的边界。 */

import type {
  GuideAllowedAction,
  GuideEditorDraft,
  GuidePublicationState,
  GuideRelatedCompetition,
  OpsGuide
} from '@/features/ops/guides/types'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import type { GuideCategory } from '@/shared/types/homepage'

interface GuideWriteDto {
  title: string
  category: GuideCategory
  summary: string | null
  body_md: string
  competition_ids: string[]
  is_featured: boolean
  featured_order: number
}

interface PaginatedDto {
  count: number
  results: unknown[]
}

const categories = new Set<GuideCategory>([
  'COMPETITION',
  'RESEARCH',
  'FURTHER_STUDY',
  'CERTIFICATE',
  'PROCESS',
  'EXPERIENCE',
  'OTHER'
])
const publicationStates = new Set<GuidePublicationState>([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
])
const allowedActions = new Set<GuideAllowedAction>([
  'EDIT',
  'PUBLISH',
  'ARCHIVE',
  'DELETE_DRAFT',
  'FEATURE'
])

function invalidResponse(): never {
  throw new AppError('指南管理接口返回了无法识别的数据。', {
    status: 0,
    code: 'INVALID_RESPONSE'
  })
}

function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse()
  return value as Record<string, unknown>
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) invalidResponse()
  return [...value]
}

function relatedCompetitions(value: unknown): GuideRelatedCompetition[] {
  if (!Array.isArray(value)) invalidResponse()
  return value.map(item => {
    const record = recordOf(item)
    if (typeof record.id !== 'string' || typeof record.title !== 'string') invalidResponse()
    return { id: record.id, title: record.title }
  })
}

function parseGuide(value: unknown): OpsGuide {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.title !== 'string' ||
    typeof dto.category !== 'string' ||
    !categories.has(dto.category as GuideCategory) ||
    typeof dto.body_md !== 'string' ||
    typeof dto.is_featured !== 'boolean' ||
    typeof dto.featured_order !== 'number' ||
    !Number.isFinite(dto.featured_order) ||
    !Number.isInteger(dto.featured_order) ||
    dto.featured_order < 0 ||
    typeof dto.publication_state !== 'string' ||
    !publicationStates.has(dto.publication_state as GuidePublicationState)
  ) {
    invalidResponse()
  }

  if (dto.summary !== null && typeof dto.summary !== 'string') invalidResponse()

  const actions = stringArray(dto.allowed_actions)
  if (actions.some(action => !allowedActions.has(action as GuideAllowedAction))) invalidResponse()
  const publishedAt = dto.published_at
  const updatedAt = dto.updated_at
  if (publishedAt !== null && typeof publishedAt !== 'string') invalidResponse()
  if (updatedAt !== null && typeof updatedAt !== 'string') invalidResponse()

  return {
    id: dto.id,
    title: dto.title,
    category: dto.category as GuideCategory,
    summary: dto.summary,
    bodyMd: dto.body_md,
    competitionIds: stringArray(dto.competition_ids),
    relatedCompetitions: relatedCompetitions(dto.related_competitions),
    isFeatured: dto.is_featured,
    featuredOrder: dto.featured_order,
    publicationState: dto.publication_state as GuidePublicationState,
    publishedAt,
    updatedAt,
    allowedActions: actions as GuideAllowedAction[],
    detailPath: `/qa/guides/${dto.id}`
  }
}

export function validateGuide(draft: GuideEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const title = draft.title.trim()
  if (!title) errors.title = '请填写指南标题'
  else if (title.length < 2) errors.title = '指南标题至少需要 2 个字符'
  if (!draft.bodyMd.trim()) errors.bodyMd = '请填写指南正文'
  if (!Number.isInteger(draft.featuredOrder) || draft.featuredOrder < 0) {
    errors.featuredOrder = '精选排序必须是非负整数'
  }
  if (draft.competitionIds.length > 20) errors.competitionIds = '最多关联 20 个竞赛'
  if (new Set(draft.competitionIds).size !== draft.competitionIds.length) {
    errors.competitionIds = '关联竞赛不能重复'
  }
  return errors
}

export function toGuideWriteDto(draft: GuideEditorDraft): GuideWriteDto {
  return {
    title: draft.title.trim(),
    category: draft.category,
    summary: draft.summary.trim() || null,
    body_md: draft.bodyMd,
    competition_ids: [...draft.competitionIds],
    is_featured: draft.isFeatured,
    featured_order: draft.featuredOrder
  }
}

export function toGuideEditorDraft(guide: OpsGuide): GuideEditorDraft {
  return {
    title: guide.title,
    category: guide.category,
    summary: guide.summary ?? '',
    bodyMd: guide.bodyMd,
    competitionIds: [...guide.competitionIds],
    isFeatured: guide.isFeatured,
    featuredOrder: guide.featuredOrder
  }
}

export async function getGuide(id: string, signal?: AbortSignal): Promise<OpsGuide> {
  return parseGuide(await http.get<unknown>(`/ops/guides/${id}`, { signal }))
}

export async function createGuide(
  draft: GuideEditorDraft,
  publish = false
): Promise<OpsGuide> {
  return parseGuide(await http.post<unknown>('/ops/guides', {
    ...toGuideWriteDto(draft),
    publish
  }))
}

export async function updateGuide(id: string, draft: GuideEditorDraft): Promise<OpsGuide> {
  return parseGuide(await http.patch<unknown>(`/ops/guides/${id}`, toGuideWriteDto(draft)))
}

export async function publishGuide(id: string): Promise<void> {
  await http.post(`/ops/guides/${id}/publish`)
}

export async function listGuides(params: {
  q?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsGuide[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/guides', {
    query: {
      q: params.q,
      status: params.status,
      category: params.category,
      page: params.page,
      page_size: params.pageSize
    }
  })
  if (!response || typeof response.count !== 'number' || !Array.isArray(response.results)) {
    invalidResponse()
  }
  return {
    items: response.results.map(parseGuide),
    total: response.count,
    page: params.page ?? 1
  }
}

export type { GuideEditorDraft, OpsGuide } from '@/features/ops/guides/types'
