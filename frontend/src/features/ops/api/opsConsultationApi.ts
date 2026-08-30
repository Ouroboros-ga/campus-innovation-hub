/** 运营咨询工作台 API；与公开问答 DTO 严格分离。 */

import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import type {
  ConsultationAction,
  ConsultationCategory,
  ConsultationDetail,
  ConsultationQuery,
  ConsultationReply,
  ConsultationStatus,
  ConsultationSummary,
  ConsultationVisibility
} from '../consultations/types'

type UnknownRecord = Record<string, unknown>

const categories = ['COMPETITION', 'TEAM', 'ORGANIZATION', 'ACTIVITY', 'FURTHER_STUDY', 'CERTIFICATE', 'OTHER'] as const
const statuses = ['OPEN', 'ANSWERED', 'CLOSED'] as const
const visibilities = ['PUBLIC', 'PRIVATE'] as const
const actions = ['REPLY', 'CLOSE'] as const

function invalidResponse(): never {
  throw new AppError('服务端返回的咨询数据格式无效，请刷新后重试。', { status: 0, code: 'INVALID_RESPONSE' })
}

function record(value: unknown): UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalidResponse()
  return value as UnknownRecord
}

function requiredString(dto: UnknownRecord, key: string): string {
  const value = dto[key]
  if (typeof value !== 'string' || !value) invalidResponse()
  return value
}

function nullableString(dto: UnknownRecord, key: string): string | null {
  const value = dto[key]
  if (value === null) return null
  if (typeof value !== 'string') invalidResponse()
  return value
}

function optionalNullableString(dto: UnknownRecord, key: string): string | null {
  if (!(key in dto)) return null
  return nullableString(dto, key)
}

function enumValue<T extends readonly string[]>(dto: UnknownRecord, key: string, allowed: T): T[number] {
  const value = requiredString(dto, key)
  if (!allowed.includes(value)) invalidResponse()
  return value as T[number]
}

function actorName(value: unknown): string {
  const actor = record(value)
  requiredString(actor, 'id')
  return optionalNullableString(actor, 'display_name') ?? optionalNullableString(actor, 'nickname') ?? '匿名用户'
}

function competition(value: unknown): { id: string; name: string } | null {
  if (value === null) return null
  const dto = record(value)
  return { id: requiredString(dto, 'id'), name: requiredString(dto, 'name') }
}

function reply(value: unknown): ConsultationReply {
  const dto = record(value)
  return {
    id: requiredString(dto, 'id'),
    authorName: actorName(dto.author),
    bodyMd: requiredString(dto, 'body_md'),
    createdAt: requiredString(dto, 'created_at'),
    updatedAt: requiredString(dto, 'updated_at')
  }
}

function allowedActions(value: unknown): ConsultationAction[] {
  if (!Array.isArray(value)) invalidResponse()
  return value.map(action => {
    if (typeof action !== 'string' || !(actions as readonly string[]).includes(action)) invalidResponse()
    return action as ConsultationAction
  })
}

function toDetail(value: unknown): ConsultationDetail {
  const dto = record(value)
  if (!Array.isArray(dto.replies)) invalidResponse()
  return {
    id: requiredString(dto, 'id'),
    authorName: actorName(dto.author),
    category: enumValue(dto, 'category', categories) as ConsultationCategory,
    competition: competition(dto.competition),
    title: requiredString(dto, 'title'),
    bodyMd: requiredString(dto, 'body_md'),
    visibility: enumValue(dto, 'visibility', visibilities) as ConsultationVisibility,
    status: enumValue(dto, 'status', statuses) as ConsultationStatus,
    replyCount: dto.replies.length,
    allowedActions: allowedActions(dto.allowed_actions),
    answeredAt: nullableString(dto, 'answered_at'),
    replies: dto.replies.map(reply),
    createdAt: requiredString(dto, 'created_at'),
    updatedAt: requiredString(dto, 'updated_at')
  }
}

function toSummary(value: unknown): ConsultationSummary {
  const detail = toDetail(value)
  return {
    id: detail.id,
    title: detail.title,
    authorName: detail.authorName,
    category: detail.category,
    visibility: detail.visibility,
    status: detail.status,
    replyCount: detail.replyCount,
    createdAt: detail.createdAt,
    answeredAt: detail.answeredAt,
    allowedActions: detail.allowedActions
  }
}

export async function listConsultations(query: ConsultationQuery): Promise<{ items: ConsultationSummary[]; total: number }> {
  const response = record(await http.get<unknown>('/ops/consultations', {
    query: { q: query.q, status: query.status, visibility: query.visibility, category: query.category, page: query.page, page_size: query.pageSize }
  }))
  const count = response.count
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || !Array.isArray(response.results)) invalidResponse()
  return { items: response.results.map(toSummary), total: count }
}

export async function getConsultation(id: string): Promise<ConsultationDetail> {
  return toDetail(await http.get<unknown>(`/ops/consultations/${id}`))
}

export async function replyConsultation(id: string, bodyMd: string): Promise<ConsultationDetail> {
  return toDetail(await http.post<unknown>(`/ops/consultations/${id}/replies`, { body_md: bodyMd }))
}

export async function closeConsultation(id: string): Promise<ConsultationDetail> {
  return toDetail(await http.post<unknown>(`/ops/consultations/${id}/close`))
}
