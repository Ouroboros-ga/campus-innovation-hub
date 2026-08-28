/**
 * 竞赛运营 API 集成（BE-040 /ops/competitions）。
 *
 * 映射 `docs/api/EndpointReference.md` 运营路由与 `apps/ops_api/serializers.py` 严格 DTO：
 * - POST /ops/competitions（创建 DRAFT）
 * - PATCH /ops/competitions/{id}（更新，保持状态）
 * - POST /ops/competitions/{id}/publish（DRAFT → PUBLISHED）
 * - GET /ops/competitions（管理列表）
 *
 * 写请求为蛇形 DTO；`cover_asset_id` 取自封面上传返回的 MediaAsset id。
 * 契约要点：`description_md` 与 `college_organized` 为创建必填，此处由编辑器草稿提供。
 */

import { http } from '@/shared/http/client'
import type {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionSummary,
  ParticipationMode,
  PublicationState
} from '@/shared/types/homepage'
import type { CompetitionEditorDraft } from '@/features/ops/lib/opsStore'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface CompetitionWriteDto {
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participation_mode: ParticipationMode
  description_md: string
  college_organized: boolean
  registration_start_at: string | null
  registration_end_at: string | null
  official_url: string | null
  cover_asset_id: string | null
  suitable_grade_min: number | null
  suitable_grade_max: number | null
  direction: string | null
  summary: string | null
  suitable_for_md: string | null
  preparation_advice_md: string | null
  event_start_at: string | null
  event_end_at: string | null
  college_contact_name: string | null
  college_contact_text: string | null
  registration_url: string | null
  official_notice_url: string | null
}

interface MediaRefDto {
  id?: string
  url?: string | null
}

interface CompetitionMgmtDto {
  id: string
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participation_mode: ParticipationMode
  cover?: MediaRefDto | null
  registration_start_at?: string | null
  registration_end_at?: string | null
  event_start_at?: string | null
  event_end_at?: string | null
  official_url?: string | null
  description_md?: string | null
  college_organized?: boolean
  publication_state?: string
  is_featured?: boolean
  featured_order?: number
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

/** 竞赛管理视图模型（= 列表摘要 + 编辑所需正文 / 主办 / 状态字段）。 */
export interface OpsCompetition extends CompetitionSummary {
  /** Markdown 正文（编辑回填用）。 */
  descriptionMd: string
  /** 是否学院主办。 */
  collegeOrganized: boolean
  /** 发布生命周期状态。 */
  publicationState: PublicationState
  isFeatured: boolean
  featuredOrder: number
}

// ---------------------------------------------------------------------------
// 契约映射
// ---------------------------------------------------------------------------

/** 编辑草稿 → 写请求 DTO。 */
export function toCompetitionWriteDto(
  draft: CompetitionEditorDraft,
  coverAssetId: string | null
): CompetitionWriteDto {
  return {
    name: draft.name.trim(),
    edition: draft.edition.trim(),
    category: draft.category,
    level: draft.level,
    participation_mode: draft.participationMode,
    description_md: draft.descriptionMd.trim(),
    college_organized: draft.collegeOrganized,
    registration_start_at: draft.registrationStartAt || null,
    registration_end_at: draft.registrationEndAt || null,
    official_url: draft.officialUrl.trim() || null,
    cover_asset_id: coverAssetId || null,
    suitable_grade_min: draft.suitableGradeMin ?? null,
    suitable_grade_max: draft.suitableGradeMax ?? null,
    direction: draft.direction?.trim() || null,
    summary: draft.summary?.trim() || null,
    suitable_for_md: draft.suitableForMd?.trim() || null,
    preparation_advice_md: draft.preparationAdviceMd?.trim() || null,
    event_start_at: draft.eventStartAt || null,
    event_end_at: draft.eventEndAt || null,
    college_contact_name: draft.collegeContactName?.trim() || null,
    college_contact_text: draft.collegeContactText?.trim() || null,
    registration_url: draft.registrationUrl?.trim() || null,
    official_notice_url: draft.officialNoticeUrl?.trim() || null
  }
}

function toOpsCompetition(dto: CompetitionMgmtDto): OpsCompetition {
  return {
    id: dto.id,
    name: dto.name,
    edition: dto.edition,
    category: dto.category,
    level: dto.level,
    participationMode: dto.participation_mode,
    registrationStartAt: dto.registration_start_at ?? null,
    registrationEndAt: dto.registration_end_at ?? null,
    eventStartAt: dto.event_start_at ?? null,
    eventEndAt: dto.event_end_at ?? null,
    officialUrl: dto.official_url ?? null,
    cover: { alt: dto.name, src: dto.cover?.url ?? null },
    detailPath: `/competitions/${dto.id}`,
    descriptionMd: dto.description_md ?? '',
    collegeOrganized: dto.college_organized ?? false,
    publicationState: (dto.publication_state ?? 'DRAFT') as PublicationState,
    isFeatured: dto.is_featured ?? false,
    featuredOrder: dto.featured_order ?? 0
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 创建竞赛（落库为 DRAFT，需再 publish 才公开可见）。 */
export async function createCompetition(
  draft: CompetitionEditorDraft,
  coverAssetId: string | null
): Promise<string> {
  const response = await http.post<CompetitionMgmtDto>(
    '/ops/competitions',
    toCompetitionWriteDto(draft, coverAssetId)
  )
  return response.id
}

/** 更新竞赛（PATCH，保持当前发布状态）。 */
export async function updateCompetition(
  id: string,
  draft: CompetitionEditorDraft,
  coverAssetId: string | null
): Promise<void> {
  await http.patch(`/ops/competitions/${id}`, toCompetitionWriteDto(draft, coverAssetId))
}

/** 发布竞赛（DRAFT → PUBLISHED）。 */
export async function publishCompetition(id: string): Promise<void> {
  await http.post(`/ops/competitions/${id}/publish`)
}

/** 运营竞赛列表（GET /ops/competitions）。 */
export async function listCompetitions(params: {
  q?: string
  status?: string
  category?: string
  level?: string
  isFeatured?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: OpsCompetition[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto<CompetitionMgmtDto>>('/ops/competitions', {
    query: {
      q: params.q,
      status: params.status,
      category: params.category,
      level: params.level,
      is_featured: params.isFeatured === undefined ? undefined : String(params.isFeatured),
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toOpsCompetition),
    total: response.count,
    page: params.page ?? 1
  }
}
