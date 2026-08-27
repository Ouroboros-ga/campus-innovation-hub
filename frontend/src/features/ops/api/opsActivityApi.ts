/**
 * 活动运营 API 集成（BE-040 /ops/activities）。
 *
 * 映射 `docs/api/EndpointReference.md` 运营路由与 `apps/ops_api/serializers.py` 严格 DTO：
 * - POST /ops/activities（创建 DRAFT）
 * - PATCH /ops/activities/{id}（更新，保持状态）
 * - POST /ops/activities/{id}/publish（DRAFT → PUBLISHED）
 * - GET /ops/activities（管理列表）
 * - POST /ops/dynamics/activity-with-announcement（活动 + 公告组合发布）
 *
 * 写请求为蛇形 DTO；`cover_asset_id` 取自封面上传返回的 MediaAsset id。
 * 契约落差（记录，供最小契约变更）：活动创建 / 更新的 `description_md` 为后端必填
 * （min_length=1），前端草稿允许为空，空值会由后端返回字段错误。
 */

import { http } from '@/shared/http/client'
import type { ActivityType } from '@/shared/types/homepage'
import type { DynamicsActivity } from '@/features/dynamics/types'
import type { ActivityEditorDraft } from '@/features/ops/lib/opsStore'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface ActivityWriteDto {
  title: string
  activity_type: ActivityType
  summary?: string | null
  description_md: string
  organizer_name: string | null
  speaker?: string | null
  location: string
  start_at: string
  end_at: string | null
  registration_required: boolean
  registration_start_at?: string | null
  registration_end_at: string | null
  capacity: number | null
  notes_md?: string | null
  cover_asset_id?: string | null
}

interface MediaRefDto {
  id?: string
  url?: string | null
  alt?: string | null
}

interface ActivityMgmtDto {
  id: string
  title: string
  activity_type: ActivityType
  summary?: string | null
  organizer_name?: string | null
  speaker?: string | null
  location?: string | null
  start_at: string
  end_at?: string | null
  cover?: MediaRefDto | null
  registration_required: boolean
  registration_start_at?: string | null
  registration_end_at?: string | null
  capacity?: number | null
  description_md?: string | null
  publication_state?: string
  is_featured?: boolean
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/** 编辑草稿 → 写请求 DTO（含注册语义：未报名则清空报名时间 / 容量）。 */
export function toActivityWriteDto(
  draft: ActivityEditorDraft,
  coverAssetId: string | null
): ActivityWriteDto {
  const required = draft.registrationRequired
  return {
    title: draft.title.trim(),
    activity_type: draft.activityType,
    description_md: draft.descriptionMd.trim(),
    organizer_name: draft.organizerName.trim() || null,
    location: draft.location.trim() || '待定',
    start_at: draft.startAt,
    end_at: draft.endAt || null,
    registration_required: required,
    registration_start_at: null,
    registration_end_at: required ? draft.registrationEndAt || null : null,
    capacity: required ? draft.capacity : null,
    cover_asset_id: coverAssetId || null
  }
}

function toDynamicsActivity(dto: ActivityMgmtDto): DynamicsActivity {
  return {
    id: dto.id,
    title: dto.title,
    activityType: dto.activity_type,
    summary: dto.summary ?? null,
    startAt: dto.start_at,
    endAt: dto.end_at ?? null,
    location: dto.location ?? '',
    organizerName: dto.organizer_name ?? null,
    registrationRequired: dto.registration_required,
    registrationStartAt: dto.registration_start_at ?? null,
    registrationEndAt: dto.registration_end_at ?? null,
    capacity: dto.capacity ?? null,
    speaker: dto.speaker ?? null,
    descriptionMd: dto.description_md ?? null,
    isFeatured: dto.is_featured ?? false,
    cover: { alt: dto.cover?.alt ?? dto.title, src: dto.cover?.url ?? null },
    detailPath: `/activities/${dto.id}`
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 创建活动（落库为 DRAFT，需再 publish 才公开可见）。 */
export async function createActivity(
  draft: ActivityEditorDraft,
  coverAssetId: string | null
): Promise<string> {
  const response = await http.post<ActivityMgmtDto>(
    '/ops/activities',
    toActivityWriteDto(draft, coverAssetId)
  )
  return response.id
}

/** 更新活动（PATCH，保持当前发布状态）。 */
export async function updateActivity(
  id: string,
  draft: ActivityEditorDraft,
  coverAssetId: string | null
): Promise<void> {
  await http.patch(`/ops/activities/${id}`, toActivityWriteDto(draft, coverAssetId))
}

/** 发布活动（DRAFT → PUBLISHED）。 */
export async function publishActivity(id: string): Promise<void> {
  await http.post(`/ops/activities/${id}/publish`)
}

/** 活动 + 公告组合发布（在一个事务内创建并可选发布）。 */
export async function createActivityWithAnnouncement(
  draft: ActivityEditorDraft,
  coverAssetId: string | null,
  announcement: { title: string; publisherScope: string; bodyMd: string; externalUrl: string },
  publish: boolean
): Promise<void> {
  await http.post('/ops/dynamics/activity-with-announcement', {
    activity: toActivityWriteDto(draft, coverAssetId),
    announcement: {
      title: announcement.title,
      body_md: announcement.bodyMd,
      publisher_scope: announcement.publisherScope,
      external_url: announcement.externalUrl || null
    },
    publish
  })
}

/** 运营活动列表（GET /ops/activities）。 */
export async function listActivities(params: {
  q?: string
  status?: string
  activityType?: string
  page?: number
  pageSize?: number
}): Promise<{ items: DynamicsActivity[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto<ActivityMgmtDto>>('/ops/activities', {
    query: {
      q: params.q,
      status: params.status,
      activity_type: params.activityType,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toDynamicsActivity),
    total: response.count,
    page: params.page ?? 1
  }
}
