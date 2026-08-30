/** FAQ 运营 API 适配器：唯一负责管理 DTO 与编辑领域模型的边界。 */

import type {
  FaqAllowedAction,
  FaqEditorDraft,
  FaqPublicationState,
  OpsFaq
} from '@/features/ops/faq/types'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import type { GuideCategory } from '@/shared/types/homepage'

interface FaqWriteDto {
  category: GuideCategory
  question: string
  answer_md: string
  sort_order: number
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
const publicationStates = new Set<FaqPublicationState>(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
const allowedActions = new Set<FaqAllowedAction>(['EDIT', 'PUBLISH', 'FEATURE', 'ARCHIVE'])

function invalidResponse(): never {
  throw new AppError('FAQ 管理接口返回了无法识别的数据。', {
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

function parseFaq(value: unknown): OpsFaq {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.category !== 'string' ||
    !categories.has(dto.category as GuideCategory) ||
    typeof dto.question !== 'string' ||
    typeof dto.answer_md !== 'string' ||
    typeof dto.sort_order !== 'number' ||
    !Number.isInteger(dto.sort_order) ||
    dto.sort_order < 0 ||
    typeof dto.is_featured !== 'boolean' ||
    typeof dto.featured_order !== 'number' ||
    !Number.isInteger(dto.featured_order) ||
    dto.featured_order < 0 ||
    typeof dto.publication_state !== 'string' ||
    !publicationStates.has(dto.publication_state as FaqPublicationState)
  ) {
    invalidResponse()
  }

  const actions = stringArray(dto.allowed_actions)
  if (actions.some(action => !allowedActions.has(action as FaqAllowedAction))) invalidResponse()
  const publishedAt = dto.published_at
  const updatedAt = dto.updated_at
  if (publishedAt !== null && typeof publishedAt !== 'string') invalidResponse()
  if (updatedAt !== null && typeof updatedAt !== 'string') invalidResponse()

  return {
    id: dto.id,
    category: dto.category as GuideCategory,
    question: dto.question,
    answerMd: dto.answer_md,
    sortOrder: dto.sort_order,
    isFeatured: dto.is_featured,
    featuredOrder: dto.featured_order,
    publicationState: dto.publication_state as FaqPublicationState,
    publishedAt,
    updatedAt,
    allowedActions: actions as FaqAllowedAction[],
    detailPath: `/qa/faqs#faq-${dto.id}`
  }
}

export function validateFaq(draft: FaqEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const question = draft.question.trim()
  if (!question) errors.question = '请填写问题'
  else if (question.length < 2) errors.question = '问题至少需要 2 个字符'
  if (!draft.answerMd.trim()) errors.answerMd = '请填写答案'
  if (!Number.isInteger(draft.sortOrder) || draft.sortOrder < 0) {
    errors.sortOrder = '列表排序必须是非负整数'
  }
  if (!Number.isInteger(draft.featuredOrder) || draft.featuredOrder < 0) {
    errors.featuredOrder = '推荐排序必须是非负整数'
  }
  return errors
}

export function toFaqWriteDto(draft: FaqEditorDraft): FaqWriteDto {
  return {
    category: draft.category,
    question: draft.question.trim(),
    answer_md: draft.answerMd,
    sort_order: draft.sortOrder,
    is_featured: draft.isFeatured,
    featured_order: draft.featuredOrder
  }
}

export function toFaqEditorDraft(faq: OpsFaq): FaqEditorDraft {
  return {
    category: faq.category,
    question: faq.question,
    answerMd: faq.answerMd,
    sortOrder: faq.sortOrder,
    isFeatured: faq.isFeatured,
    featuredOrder: faq.featuredOrder
  }
}

export async function getFaq(id: string, signal?: AbortSignal): Promise<OpsFaq> {
  return parseFaq(await http.get<unknown>(`/ops/faq/${id}`, { signal }))
}

export async function createFaq(draft: FaqEditorDraft, publish = false): Promise<OpsFaq> {
  return parseFaq(await http.post<unknown>('/ops/faq', {
    ...toFaqWriteDto(draft),
    publish
  }))
}

export async function updateFaq(id: string, draft: FaqEditorDraft): Promise<OpsFaq> {
  return parseFaq(await http.patch<unknown>(`/ops/faq/${id}`, toFaqWriteDto(draft)))
}

export async function publishFaq(id: string): Promise<void> {
  await http.post(`/ops/faq/${id}/publish`)
}

export async function archiveFaq(id: string): Promise<void> {
  await http.post(`/ops/faq/${id}/archive`)
}

export async function listFaqs(params: {
  q?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsFaq[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/faq', {
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
    items: response.results.map(parseFaq),
    total: response.count,
    page: params.page ?? 1
  }
}

export type { FaqEditorDraft, OpsFaq } from '@/features/ops/faq/types'
