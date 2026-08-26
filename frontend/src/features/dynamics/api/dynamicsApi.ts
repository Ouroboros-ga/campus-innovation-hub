/**
 * 校园动态 / 活动 / 公告 API 集成（FE-104）。
 *
 * 映射 `docs/api/APIContract.md §3.6`（活动）与 §3.7（公告、内容）→ 前端视图模型：
 * - GET /api/activities（活动列表，PUBLIC）
 * - GET /api/activities/{id}（活动详情，PUBLIC）
 * - GET /api/announcements（公告列表，PUBLIC）
 * - GET /api/announcements/{id}（公告详情，PUBLIC）
 * - POST /api/activities/{id}/register、/cancel-registration（报名/取消，LOGIN）
 *
 * 仅按契约字段映射；认证（LOGIN）未接线时 registered/registered_count 不返回。
 *
 * 契约落差（记录，供最小契约变更）：
 * - 活动列表项缺 `registration_start_at/end_at`、`description_md`、`is_featured`：
 *   映射为 null / '' / false；列表页报名状态在仅有 `registration_state` 时无法从日期派生，
 *   建议列表端点补充报名窗口（或前端改用 registration_state 派生）；
 * - 公告列表项缺 `body_md`（详情才有）与关联对象展示名：列表项 `body_md=null`；
 *   关联对象 `label` 由 path 末段派生（人类可读名应由对象自身提供）。
 */

import { http } from '@/shared/http/client'
import type {
  ActivityType,
  HomepageImage,
  RegistrationState
} from '@/shared/types/homepage'
import type {
  AnnouncementLinkedKind,
  AnnouncementLinkedObject,
  AnnouncementPublisherScope,
  DynamicsActivity,
  DynamicsAnnouncement
} from '@/features/dynamics/types'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface ImageDto {
  id?: string
  url?: string | null
}

interface ActivityListItemDto {
  id: string
  title: string
  activity_type: ActivityType
  summary?: string | null
  organizer_name?: string | null
  speaker?: string | null
  location?: string | null
  start_at: string
  end_at?: string | null
  cover?: ImageDto | null
  registration_required: boolean
  registration_state?: RegistrationState | null
  capacity?: number | null
  registered_count?: number | null
  publication_state?: string | null
}

interface ActivityDetailDto extends ActivityListItemDto {
  description_md?: string | null
  registration_start_at?: string | null
  registration_end_at?: string | null
  notes_md?: string | null
  registered?: boolean
}

interface LinkedObjectDto {
  type: string
  id?: string
  path?: string | null
}

interface AnnouncementListItemDto {
  id: string
  title: string
  summary?: string | null
  published_at: string
  is_pinned?: boolean
  publisher_scope: AnnouncementPublisherScope
  external_url?: string | null
  linked_object?: LinkedObjectDto | null
}

interface AnnouncementDetailDto extends AnnouncementListItemDto {
  body_md?: string | null
}

// ---------------------------------------------------------------------------
// 映射
// ---------------------------------------------------------------------------

function cover(dto: ImageDto | null | undefined, alt: string): HomepageImage {
  return { alt, src: dto?.url ?? null }
}

function toActivity(item: ActivityListItemDto & Partial<ActivityDetailDto>): DynamicsActivity {
  return {
    id: item.id,
    title: item.title,
    activityType: item.activity_type,
    summary: item.summary ?? null,
    startAt: item.start_at,
    endAt: item.end_at ?? null,
    location: item.location ?? '',
    organizerName: item.organizer_name ?? null,
    registrationRequired: item.registration_required,
    registrationStartAt: item.registration_start_at ?? null,
    registrationEndAt: item.registration_end_at ?? null,
    capacity: item.capacity ?? null,
    speaker: item.speaker ?? null,
    descriptionMd: item.description_md ?? null,
    isFeatured: false,
    cover: cover(item.cover, item.title),
    detailPath: `/activities/${item.id}`
  }
}

/** 关联对象展示名由 path 末段派生（契约未提供人类可读名）。 */
function toLinkedObject(dto: LinkedObjectDto | null | undefined): AnnouncementLinkedObject | null {
  if (!dto) return null
  const kind = dto.type as AnnouncementLinkedKind
  const path = dto.path ?? ''
  const label = path
    ? path.split('/').filter(Boolean).pop() ?? ''
    : ''
  return { kind, label, to: path }
}

function toAnnouncement(
  item: AnnouncementListItemDto,
  dto: AnnouncementDetailDto | null = null
): DynamicsAnnouncement {
  return {
    id: item.id,
    title: item.title,
    publishedAt: item.published_at,
    publisherScope: item.publisher_scope,
    bodyMd: dto?.body_md ?? null,
    linkedObject: toLinkedObject(item.linked_object),
    externalUrl: item.external_url ?? null,
    detailPath: `/activities/announcements/${item.id}`
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 活动列表（PUBLIC）。契约支持 q / status / activity_type / page / page_size。 */
export async function listActivities(params: {
  q?: string
  status?: string
  activityType?: string
  page?: number
  pageSize?: number
}): Promise<{ items: DynamicsActivity[]; total: number; page: number }> {
  const response = await http.get<{
    count: number
    next?: string | null
    previous?: string | null
    results: ActivityListItemDto[]
  }>('/activities', {
    query: {
      q: params.q,
      status: params.status,
      activity_type: params.activityType,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toActivity),
    total: response.count,
    page: params.page ?? 1
  }
}

/** 活动详情（PUBLIC）。 */
export async function getActivity(id: string): Promise<DynamicsActivity> {
  const response = await http.get<ActivityDetailDto>(`/activities/${id}`)
  return toActivity(response)
}

/** 公告列表（PUBLIC）。契约支持 q / publisher_scope / page / page_size。 */
export async function listAnnouncements(params: {
  q?: string
  publisherScope?: string
  page?: number
  pageSize?: number
}): Promise<{ items: DynamicsAnnouncement[]; total: number; page: number }> {
  const response = await http.get<{
    count: number
    next?: string | null
    previous?: string | null
    results: AnnouncementListItemDto[]
  }>('/announcements', {
    query: {
      q: params.q,
      publisher_scope: params.publisherScope,
      page: params.page,
      page_size: params.pageSize
    }
  })
  const limited = response.results.map(item => toAnnouncement(item))
  return {
    items: limited,
    total: response.count,
    page: params.page ?? 1
  }
}

/** 公告详情（PUBLIC）。 */
export async function getAnnouncement(id: string): Promise<DynamicsAnnouncement> {
  const response = await http.get<AnnouncementDetailDto>(`/announcements/${id}`)
  return toAnnouncement(response, response)
}

/** 报名活动（LOGIN）。 */
export async function registerActivity(id: string): Promise<void> {
  await http.post(`/activities/${id}/register`)
}

/** 取消报名（LOGIN）。 */
export async function cancelActivityRegistration(id: string): Promise<void> {
  await http.post(`/activities/${id}/cancel-registration`)
}
