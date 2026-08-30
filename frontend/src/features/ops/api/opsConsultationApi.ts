/** 运营咨询工作台 API；与公开问答 DTO 严格分离。 */

import { http } from '@/shared/http/client'
import type { ConsultationDetail, ConsultationQuery, ConsultationReply, ConsultationSummary } from '../consultations/types'

interface ActorDto { id: string; nickname?: string | null; display_name?: string | null }
interface CompetitionDto { id: string; name: string }
interface ReplyDto { id: string; author: ActorDto; body_md: string; created_at: string; updated_at: string }
interface ConsultationDto {
  id: string; author: ActorDto; category: ConsultationDetail['category']; competition: CompetitionDto | null; title: string; body_md: string
  visibility: ConsultationDetail['visibility']; status: ConsultationDetail['status']; allowed_actions: ConsultationDetail['allowedActions']
  answered_at: string | null; replies: ReplyDto[]; created_at: string; updated_at: string
}

function actorName(actor: ActorDto): string { return actor.display_name ?? actor.nickname ?? '匿名用户' }
function toReply(dto: ReplyDto): ConsultationReply { return { id: dto.id, authorName: actorName(dto.author), bodyMd: dto.body_md, createdAt: dto.created_at, updatedAt: dto.updated_at } }
function toDetail(dto: ConsultationDto): ConsultationDetail {
  return {
    id: dto.id, authorName: actorName(dto.author), category: dto.category, competition: dto.competition,
    title: dto.title, bodyMd: dto.body_md, visibility: dto.visibility, status: dto.status, replyCount: dto.replies.length, allowedActions: dto.allowed_actions,
    answeredAt: dto.answered_at, replies: dto.replies.map(toReply), createdAt: dto.created_at, updatedAt: dto.updated_at
  }
}
function toSummary(dto: ConsultationDto): ConsultationSummary {
  const detail = toDetail(dto)
  return { id: detail.id, title: detail.title, authorName: detail.authorName, category: detail.category, visibility: detail.visibility, status: detail.status, replyCount: detail.replies.length, createdAt: detail.createdAt, answeredAt: detail.answeredAt, allowedActions: detail.allowedActions }
}

export async function listConsultations(query: ConsultationQuery): Promise<{ items: ConsultationSummary[]; total: number }> {
  const response = await http.get<{ count: number; results: ConsultationDto[] }>('/ops/consultations', {
    query: { q: query.q, status: query.status, visibility: query.visibility, category: query.category, page: query.page, page_size: query.pageSize }
  })
  return { items: response.results.map(toSummary), total: response.count }
}
export async function getConsultation(id: string): Promise<ConsultationDetail> { return toDetail(await http.get<ConsultationDto>(`/ops/consultations/${id}`)) }
export async function replyConsultation(id: string, bodyMd: string): Promise<ConsultationReply> { return toReply(await http.post<ReplyDto>(`/ops/consultations/${id}/replies`, { body_md: bodyMd })) }
export async function closeConsultation(id: string): Promise<void> { await http.post(`/ops/consultations/${id}/close`) }
