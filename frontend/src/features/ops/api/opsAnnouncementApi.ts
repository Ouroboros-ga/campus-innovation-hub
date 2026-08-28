/**
 * 公告运营 API 集成（BE-040 /ops/announcements）。
 *
 * 映射 `docs/api/EndpointReference.md` 运营路由与 `apps/ops_api/serializers.py` 严格 DTO：
 * - POST /ops/announcements（创建 DRAFT）
 * - PATCH /ops/announcements/{id}（更新，保持状态）
 * - POST /ops/announcements/{id}/publish（DRAFT → PUBLISHED）
 * - GET /ops/announcements（管理列表）
 *
 * 契约要点：公告最多关联一个核心业务对象，写请求用 `competition_id` / `activity_id` /
 * `organization_id` / `recruitment_id` 之一；前端 `linkedObject.to` 为站内路由，
 * 由此从最后一段路径解析 UUID 作为关联 id（无法解析则视为无关联）。
 */

import { http } from '@/shared/http/client'
import type { AnnouncementLinkedKind } from '@/features/dynamics/types'
import type {
  AnnouncementLinkedObject,
  AnnouncementPublisherScope,
  DynamicsAnnouncement
} from '@/features/dynamics/types'
import type { AnnouncementEditorDraft } from '@/features/ops/lib/opsStore'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface AnnouncementWriteDto {
  title: string
  body_md: string
  publisher_scope: AnnouncementPublisherScope
  external_url: string | null
  competition_id: string | null
  activity_id: string | null
  organization_id: string | null
  recruitment_id: string | null
}

interface LinkedObjectDto {
  type: AnnouncementLinkedKind
  id: string
  title: string
  path: string
}

interface AnnouncementMgmtDto {
  id: string
  title: string
  summary?: string | null
  published_at: string
  publisher_scope: AnnouncementPublisherScope
  external_url?: string | null
  linked_object?: LinkedObjectDto | null
  body_md?: string | null
  publication_state?: string
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/** 关联 kind → 后端 `*_id` 字段名。 */
const LINKED_FIELD: Record<AnnouncementLinkedKind, keyof AnnouncementWriteDto> = {
  COMPETITION: 'competition_id',
  ACTIVITY: 'activity_id',
  ORGANIZATION: 'organization_id',
  RECRUITMENT: 'recruitment_id'
}

/** 从站内路由 `to` 的最后一段尝试解析 UUID（关联对象 id）。 */
function linkedUuid(to: string): string | null {
  const segment = to.split('/').filter(Boolean).pop() ?? ''
  return /^[0-9a-fA-F-]{36}$/.test(segment) ? segment : null
}

// ---------------------------------------------------------------------------
// 契约映射
// ---------------------------------------------------------------------------

/** 编辑草稿 → 写请求 DTO。 */
export function toAnnouncementWriteDto(draft: AnnouncementEditorDraft): AnnouncementWriteDto {
  const linked = draft.linkedObject
  const id = linked ? linkedUuid(linked.to) : null
  const field = linked ? LINKED_FIELD[linked.kind] : null
  return {
    title: draft.title.trim(),
    body_md: draft.bodyMd.trim(),
    publisher_scope: draft.publisherScope,
    external_url: draft.externalUrl.trim() || null,
    competition_id: field === 'competition_id' ? id : null,
    activity_id: field === 'activity_id' ? id : null,
    organization_id: field === 'organization_id' ? id : null,
    recruitment_id: field === 'recruitment_id' ? id : null
  }
}

function toDynamicsAnnouncement(dto: AnnouncementMgmtDto): DynamicsAnnouncement {
  const linked = dto.linked_object
  const linkedObject: AnnouncementLinkedObject | null = linked
    ? { kind: linked.type, label: linked.title, to: linked.path }
    : null
  return {
    id: dto.id,
    title: dto.title,
    publishedAt: dto.published_at,
    publisherScope: dto.publisher_scope,
    bodyMd: dto.body_md ?? null,
    linkedObject,
    externalUrl: dto.external_url ?? null,
    publicationState: dto.publication_state ?? 'DRAFT',
    detailPath: `/activities/announcements/${dto.id}`
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 创建公告（落库为 DRAFT，需再 publish 才公开可见）。 */
export async function createAnnouncement(draft: AnnouncementEditorDraft): Promise<string> {
  const response = await http.post<AnnouncementMgmtDto>(
    '/ops/announcements',
    toAnnouncementWriteDto(draft)
  )
  return response.id
}

/** 更新公告（PATCH，保持当前发布状态）。 */
export async function updateAnnouncement(
  id: string,
  draft: AnnouncementEditorDraft
): Promise<void> {
  await http.patch(`/ops/announcements/${id}`, toAnnouncementWriteDto(draft))
}

/** 发布公告（DRAFT → PUBLISHED）。 */
export async function publishAnnouncement(id: string): Promise<void> {
  await http.post(`/ops/announcements/${id}/publish`)
}

/** 运营公告列表（GET /ops/announcements）。 */
export async function listAnnouncements(params: {
  q?: string
  status?: string
  publisherScope?: string
  page?: number
  pageSize?: number
}): Promise<{ items: DynamicsAnnouncement[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto<AnnouncementMgmtDto>>('/ops/announcements', {
    query: {
      q: params.q,
      status: params.status,
      publisher_scope: params.publisherScope,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toDynamicsAnnouncement),
    total: response.count,
    page: params.page ?? 1
  }
}
