import { http } from '@/shared/http/client'
import type { FaqCategory } from '@/shared/types/homepage'

interface FaqMgmtDto {
  id: string
  category: FaqCategory
  question: string
  answer_md: string
  sort_order: number
  is_featured: boolean
  publication_state?: string
  created_at?: string
  updated_at?: string
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

export interface OpsFaq {
  id: string
  category: FaqCategory
  question: string
  answerMd: string
  sortOrder: number
  isFeatured: boolean
  publicationState: string
}

export interface FaqEditorDraft {
  category: FaqCategory
  question: string
  answerMd: string
  sortOrder: number
  isFeatured: boolean
}

function toOpsFaq(dto: FaqMgmtDto): OpsFaq {
  return {
    id: dto.id,
    category: dto.category,
    question: dto.question,
    answerMd: dto.answer_md,
    sortOrder: dto.sort_order,
    isFeatured: dto.is_featured,
    publicationState: dto.publication_state ?? 'DRAFT'
  }
}

function toWriteDto(draft: FaqEditorDraft) {
  return {
    category: draft.category,
    question: draft.question.trim(),
    answer_md: draft.answerMd.trim(),
    sort_order: Number(draft.sortOrder),
    is_featured: draft.isFeatured
  }
}

export function validateFaq(draft: FaqEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.question.trim()) errors.question = '请填写问题'
  if (!draft.answerMd.trim()) errors.answerMd = '请填写答案'
  if (draft.sortOrder < 0) errors.sortOrder = '排序不能为负'
  return errors
}

export async function createFaq(draft: FaqEditorDraft): Promise<string> {
  const res = await http.post<FaqMgmtDto>('/ops/faq', toWriteDto(draft))
  return res.id
}
export async function updateFaq(id: string, draft: FaqEditorDraft): Promise<void> {
  await http.patch(`/ops/faq/${id}`, toWriteDto(draft))
}
export async function publishFaq(id: string): Promise<void> {
  await http.post(`/ops/faq/${id}/publish`)
}
export async function archiveFaq(id: string): Promise<void> {
  await http.post(`/ops/faq/${id}/archive`)
}
export async function listFaqs(params: { q?: string; status?: string; category?: string; page?: number; pageSize?: number }): Promise<{ items: OpsFaq[]; total: number }> {
  const res = await http.get<PaginatedDto<FaqMgmtDto>>('/ops/faq', {
    query: {
      q: params.q,
      status: params.status,
      category: params.category,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return { items: res.results.map(toOpsFaq), total: res.count }
}
