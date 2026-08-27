/**
 * 指南运营 API 集成（BE-040 /ops/guides）。
 *
 * 映射 `docs/api/EndpointReference.md` 运营路由与 `apps/ops_api/serializers.py` 严格 DTO：
 * - POST /ops/guides（创建 DRAFT）
 * - PATCH /ops/guides/{id}（更新，保持状态）
 * - POST /ops/guides/{id}/publish（DRAFT → PUBLISHED）
 * - GET /ops/guides（管理列表）
 *
 * 契约要点：`is_featured` 与 `featured_order` 为创建必填；`competition_ids` 关联竞赛，
 * 当前编辑器不涉及关联，发送空数组。
 */

import { http } from '@/shared/http/client'
import type { GuideCategory, GuideSummary, PublicationState } from '@/shared/types/homepage'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface GuideWriteDto {
  title: string
  category: GuideCategory
  summary: string | null
  body_md: string
  competition_ids: string[]
  is_featured: boolean
  featured_order: number
}

interface RelatedGuideDto {
  id: string
  title: string
}

interface GuideMgmtDto {
  id: string
  title: string
  category: GuideCategory
  summary?: string | null
  published_at: string
  body_md?: string | null
  is_featured?: boolean
  featured_order?: number
  competition_ids?: string[] | null
  publication_state?: string
  related_competitions?: RelatedGuideDto[]
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/** 指南编辑器草稿。 */
export interface GuideEditorDraft {
  title: string
  category: GuideCategory
  summary: string
  bodyMd: string
  isFeatured: boolean
}

/** 指南管理视图模型（= 列表摘要 + 编辑所需正文 / 关联 / 状态字段）。 */
export interface OpsGuide extends GuideSummary {
  bodyMd: string
  isFeatured: boolean
  publicationState: PublicationState
}

/** 编辑草稿校验（前端）。 */
export function validateGuide(draft: GuideEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.title.trim()) errors.title = '请填写指南标题'
  if (!draft.bodyMd.trim()) errors.bodyMd = '请填写指南正文'
  return errors
}

// ---------------------------------------------------------------------------
// 契约映射
// ---------------------------------------------------------------------------

/** 编辑草稿 → 写请求 DTO。 */
export function toGuideWriteDto(draft: GuideEditorDraft): GuideWriteDto {
  return {
    title: draft.title.trim(),
    category: draft.category,
    summary: draft.summary.trim() || null,
    body_md: draft.bodyMd.trim(),
    competition_ids: [],
    is_featured: draft.isFeatured,
    featured_order: 0
  }
}

function toOpsGuide(dto: GuideMgmtDto): OpsGuide {
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category,
    summary: dto.summary ?? null,
    publishedAt: dto.published_at,
    detailPath: `/qa/guides/${dto.id}`,
    bodyMd: dto.body_md ?? '',
    isFeatured: dto.is_featured ?? false,
    publicationState: (dto.publication_state ?? 'DRAFT') as PublicationState
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 创建指南（落库为 DRAFT，需再 publish 才公开可见）。 */
export async function createGuide(draft: GuideEditorDraft): Promise<string> {
  const response = await http.post<GuideMgmtDto>('/ops/guides', toGuideWriteDto(draft))
  return response.id
}

/** 更新指南（PATCH，保持当前发布状态）。 */
export async function updateGuide(id: string, draft: GuideEditorDraft): Promise<void> {
  await http.patch(`/ops/guides/${id}`, toGuideWriteDto(draft))
}

/** 发布指南（DRAFT → PUBLISHED）。 */
export async function publishGuide(id: string): Promise<void> {
  await http.post(`/ops/guides/${id}/publish`)
}

/** 运营指南列表（GET /ops/guides）。 */
export async function listGuides(params: {
  q?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsGuide[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto<GuideMgmtDto>>('/ops/guides', {
    query: {
      q: params.q,
      status: params.status,
      category: params.category,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toOpsGuide),
    total: response.count,
    page: params.page ?? 1
  }
}
