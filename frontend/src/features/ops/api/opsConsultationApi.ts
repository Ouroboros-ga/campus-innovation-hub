/**
 * 咨询运营 API 集成（BE-040 /ops/consultations）。
 *
 * 映射 `docs/api/EndpointReference.md` 运营路由与 `apps/ops_api/serializers.py` 严格 DTO：
 * - GET /ops/consultations（管理列表，含 replies）
 * - POST /ops/consultations/{id}/replies（正式回复，body_md）
 *
 * 客户端 `ConsultQaPost` 面向公开问答展示；运营列表在此归一：`question` 取咨询标题、
 * `tags` 取分类标签、`status` 将 OPEN/CLOSED 归为 PENDING。
 */

import { http } from '@/shared/http/client'
import { faqCategoryLabel } from '@/shared/lib/domain-labels'
import type { FaqCategory } from '@/shared/types/homepage'
import type { ConsultQaPost, ConsultQaStatus } from '@/features/consultation/types'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface ActorDto {
  id: string
  nickname?: string | null
  display_name?: string | null
}

interface ReplyDto {
  id: string
  body_md?: string | null
  created_at: string
}

interface ConsultationMgmtDto {
  id: string
  author: ActorDto
  category: string
  title: string
  body_md?: string | null
  status: string
  answered_at?: string | null
  replies?: ReplyDto[]
  created_at: string
  updated_at?: string
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

// ---------------------------------------------------------------------------
// 契约映射
// ---------------------------------------------------------------------------

function toConsultQaPost(dto: ConsultationMgmtDto): ConsultQaPost {
  const status: ConsultQaStatus = dto.status === 'ANSWERED' ? 'ANSWERED' : 'PENDING'
  const lastReply = dto.replies?.at(-1)
  return {
    id: dto.id,
    question: dto.title,
    answer: lastReply?.body_md ?? '',
    tags: dto.category ? [faqCategoryLabel[dto.category as FaqCategory] ?? dto.category] : [],
    status,
    authorName: dto.author.display_name ?? dto.author.nickname ?? '',
    answeredAt: dto.answered_at ?? lastReply?.created_at ?? dto.created_at,
    likes: 0,
    detailPath: `/qa/questions/${dto.id}`
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 运营咨询列表（GET /ops/consultations）。 */
export async function listConsultations(params: {
  status?: 'PENDING' | 'ANSWERED'
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ items: ConsultQaPost[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto<ConsultationMgmtDto>>('/ops/consultations', {
    query: {
      q: params.q,
      status: params.status === 'PENDING' ? 'OPEN' : params.status,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toConsultQaPost),
    total: response.count,
    page: params.page ?? 1
  }
}

/** 给咨询提交正式回复（POST /ops/consultations/{id}/replies）。 */
export async function replyConsultation(id: string, bodyMd: string): Promise<void> {
  await http.post(`/ops/consultations/${id}/replies`, { body_md: bodyMd })
}
