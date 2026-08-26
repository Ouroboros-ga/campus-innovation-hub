/**
 * 组织 API 集成（FE-103）。
 *
 * 映射 `docs/api/APIContract.md §3.5` 组织与招新端点 → 前端视图模型：
 * - GET /api/organizations（列表，PUBLIC）
 * - GET /api/organizations/{id}（组织主页，PUBLIC）
 * - GET /api/recruitments/{id}（招新详情，PUBLIC）
 * - POST /api/recruitments/{id}/applications（提交招新申请，LOGIN）
 * - POST /api/recruitment-applications/{id}/withdraw（撤回申请，LOGIN）
 *
 * 仅按契约字段映射；认证（LOGIN）未接线时 is_leader / contact 相关不返回。
 *
 * 契约落差（记录，供最小契约变更）：
 * - 列表项仅含 `is_recruiting`，缺招新 id/title/报名窗口 → 映射为最小招新对象，
 *   `recruitmentPath` 无法推导，置 null；
 * - 招新详情 DTO 无组织 type/logo → `getRecruitment` 内部补拉组织主页以完整映射。
 */

import { http } from '@/shared/http/client'
import type { OrganizationType } from '@/shared/types/homepage'
import type {
  MyRecruitmentApplication,
  OrganizationDetail,
  OrganizationPosition,
  OrganizationRecruitment,
  OrganizationSummary,
  RecruitmentDetail
} from '@/features/organizations/types'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface ImageDto {
  id?: string
  url?: string | null
}

interface OrganizationListItemDto {
  id: string
  name: string
  organization_type: OrganizationType
  short_intro?: string | null
  logo?: ImageDto | null
  is_recruiting?: boolean
}

interface CurrentRecruitmentDto {
  id: string
  title: string
  apply_start_at?: string | null
  apply_end_at?: string | null
  publication_state?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED'
  application_state?: string | null
}

interface OrganizationDetailDto extends OrganizationListItemDto {
  description_md?: string | null
  direction?: string | null
  founded_at?: string | null
  member_count?: number | null
  college?: string | null
  advisor_name?: string | null
  advisor_title?: string | null
  advisor_college?: string | null
  advisor_research?: string | null
  leader_name?: string | null
  leader_title?: string | null
  leader_grade?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_address?: string | null
  wechat_name?: string | null
  public_contact?: string | null
  current_recruitments?: CurrentRecruitmentDto[]
  recent_activities?: Array<{
    id: string
    title: string
    start_at?: string | null
    detail_path?: string | null
  }>
  is_leader?: boolean
}

interface RecruitmentPositionDto {
  id: string
  name: string
  headcount: number
  description_md?: string | null
  requirements_md?: string | null
}

interface RecruitmentDetailDto {
  id: string
  organization_id: string
  organization_name: string
  title: string
  intro_md?: string | null
  apply_start_at?: string | null
  apply_end_at?: string | null
  target_grade_min?: number | null
  target_grade_max?: number | null
  notes_md?: string | null
  publication_state?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED'
  application_state?: string | null
  positions?: RecruitmentPositionDto[]
}

// ---------------------------------------------------------------------------
// 映射
// ---------------------------------------------------------------------------

/** 列表项仅含 `is_recruiting`；构造最小招新对象以派生「招新中 / 不招新」。 */
function toRecruitmentFromBoolean(isRecruiting: boolean): OrganizationRecruitment | null {
  if (!isRecruiting) return null
  return {
    id: '',
    title: '',
    applyStartAt: null,
    applyEndAt: null,
    publicationState: 'PUBLISHED'
  }
}

function toSummary(item: OrganizationListItemDto): OrganizationSummary {
  const isRecruiting = item.is_recruiting ?? false
  return {
    id: item.id,
    name: item.name,
    type: item.organization_type,
    description: item.short_intro ?? null,
    logo: { alt: item.name, src: item.logo?.url ?? null },
    recruitment: toRecruitmentFromBoolean(isRecruiting),
    detailPath: `/organizations/${item.id}`,
    recruitmentPath: null
  }
}

function toRecruitment(dto: CurrentRecruitmentDto): OrganizationRecruitment {
  const state = dto.publication_state ??
    (dto.application_state === 'ARCHIVED'
      ? 'ARCHIVED'
      : dto.application_state === 'CANCELLED'
        ? 'CANCELLED'
        : 'PUBLISHED')
  return {
    id: dto.id,
    title: dto.title,
    applyStartAt: dto.apply_start_at ?? null,
    applyEndAt: dto.apply_end_at ?? null,
    publicationState: state
  }
}

function toDetail(dto: OrganizationDetailDto): OrganizationDetail {
  const summary = toSummary(dto)
  return {
    ...summary,
    descriptionMd: dto.description_md ?? '',
    direction: dto.direction ?? '',
    foundedAt: dto.founded_at ?? null,
    memberCount: dto.member_count ?? null,
    college: dto.college ?? null,
    advisorName: dto.advisor_name ?? null,
    advisorTitle: dto.advisor_title ?? null,
    advisorCollege: dto.advisor_college ?? null,
    advisorResearch: dto.advisor_research ?? null,
    leaderName: dto.leader_name ?? '',
    leaderTitle: dto.leader_title ?? '',
    leaderGrade: dto.leader_grade ?? null,
    contactEmail: dto.contact_email ?? null,
    contactPhone: dto.contact_phone ?? null,
    contactAddress: dto.contact_address ?? null,
    wechatName: dto.wechat_name ?? null,
    publicContact: dto.public_contact ?? null,
    recentActivities: (dto.recent_activities ?? []).map(activity => ({
      id: activity.id,
      title: activity.title,
      startAt: activity.start_at ?? '',
      detailPath: activity.detail_path ?? `/activities/${activity.id}`
    })),
    currentRecruitments: (dto.current_recruitments ?? []).map(toRecruitment)
  }
}

function toPosition(dto: RecruitmentPositionDto): OrganizationPosition {
  return {
    id: dto.id,
    name: dto.name,
    headcount: dto.headcount,
    description: dto.description_md ?? null,
    requirements: dto.requirements_md ?? null
  }
}

/** 招新详情段补组织 type/logo（其余取招新 DTO）。 */
function toRecruitmentDetail(
  dto: RecruitmentDetailDto,
  org: OrganizationDetail
): RecruitmentDetail {
  return {
    id: dto.id,
    organization: {
      id: org.id,
      name: org.name,
      type: org.type,
      detailPath: `/organizations/${org.id}`,
      logo: org.logo
    },
    title: dto.title,
    introMd: dto.intro_md ?? '',
    applyStartAt: dto.apply_start_at ?? null,
    applyEndAt: dto.apply_end_at ?? null,
    publicationState:
      dto.publication_state ?? 'PUBLISHED',
    completedAt: null,
    targetGradeMin: dto.target_grade_min ?? null,
    targetGradeMax: dto.target_grade_max ?? null,
    notesMd: dto.notes_md ?? null,
    positions: (dto.positions ?? []).map(toPosition)
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 组织列表（PUBLIC）。契约仅支持 q / organization_type / recruiting / page / page_size。 */
export async function listOrganizations(params: {
  q?: string
  organizationType?: string
  recruiting?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: OrganizationSummary[]; total: number; page: number }> {
  const response = await http.get<{
    count: number
    next?: string | null
    previous?: string | null
    results: OrganizationListItemDto[]
  }>('/organizations', {
    query: {
      q: params.q,
      organization_type: params.organizationType,
      recruiting:
        params.recruiting === undefined ? undefined : String(params.recruiting),
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toSummary),
    total: response.count,
    page: params.page ?? 1
  }
}

/** 组织主页（PUBLIC）。 */
export async function getOrganization(
  id: string
): Promise<OrganizationDetail> {
  const response = await http.get<OrganizationDetailDto>(`/organizations/${id}`)
  return toDetail(response)
}

/** 招新详情（PUBLIC）；补拉组织主页以完整映射 type/logo。 */
export async function getRecruitment(id: string): Promise<RecruitmentDetail> {
  const dto = await http.get<RecruitmentDetailDto>(`/recruitments/${id}`)
  const org = await getOrganization(dto.organization_id)
  return toRecruitmentDetail(dto, org)
}

/** 提交招新申请（LOGIN）。 */
export async function applyToRecruitment(
  recruitmentId: string,
  application: Omit<MyRecruitmentApplication, 'recruitmentId' | 'positionName' | 'status' | 'submittedAt'>
): Promise<void> {
  await http.post(`/recruitments/${recruitmentId}/applications`, {
    position_id: application.positionId,
    self_intro: application.selfIntro,
    skills: application.skills ?? '',
    experience: application.experience ?? '',
    motivation: application.motivation
  })
}

/** 撤回招新申请（LOGIN，申请人）。 */
export async function withdrawRecruitmentApplication(
  applicationId: string
): Promise<void> {
  await http.post(`/recruitment-applications/${applicationId}/withdraw`)
}
