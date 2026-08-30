/**
 * 组织管理 API（真实后端，非 mock）。
 *
 * - GET    /manage/organizations/:id/profile
 * - PATCH  /manage/organizations/:id/profile
 */

import { http } from '@/shared/http/client'

interface MediaRefDto {
  id: string
  url?: string | null
}

interface OrgProfileDto {
  id: string
  name: string
  organization_type: string
  short_intro?: string | null
  description_md?: string | null
  logo?: MediaRefDto | null
  banner?: MediaRefDto | null
  public_contact?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface OrgProfile {
  id: string
  name: string
  organizationType: string
  shortIntro: string | null
  descriptionMd: string | null
  logo: { id: string | null; src: string | null; alt: string } | null
  banner: { id: string | null; src: string | null; alt: string } | null
  publicContact: string | null
}

function toProfile(dto: OrgProfileDto): OrgProfile {
  return {
    id: dto.id,
    name: dto.name,
    organizationType: dto.organization_type,
    shortIntro: dto.short_intro ?? null,
    descriptionMd: dto.description_md ?? null,
    logo: dto.logo ? { id: dto.logo.id, alt: dto.name, src: dto.logo.url ?? null } : null,
    banner: dto.banner ? { id: dto.banner.id, alt: dto.name, src: dto.banner.url ?? null } : null,
    publicContact: dto.public_contact ?? null
  }
}

export async function getManageOrgProfile(organizationId: string): Promise<OrgProfile> {
  const dto = await http.get<OrgProfileDto>(`/manage/organizations/${organizationId}/profile`)
  return toProfile(dto)
}

export async function updateManageOrgProfile(
  organizationId: string,
  payload: {
    short_intro?: string | null
    description_md?: string | null
    public_contact?: string | null
    logo_asset_id?: string | null
    banner_asset_id?: string | null
  }
): Promise<OrgProfile> {
  const dto = await http.patch<OrgProfileDto>(`/manage/organizations/${organizationId}/profile`, payload)
  return toProfile(dto)
}

// ---------------------------------------------------------------------------
// 招新管理（真实事务）
// ---------------------------------------------------------------------------

interface RecruitmentPositionDto {
  id?: string
  name: string
  headcount: number
  description_md?: string | null
  requirements_md?: string | null
  sort_order?: number
}

interface RecruitmentDto {
  id: string
  title: string
  intro_md: string
  apply_start_at: string | null
  apply_end_at: string
  target_grade_min: number | null
  target_grade_max: number | null
  notes_md: string | null
  publication_state: string
  published_at: string | null
  allowed_actions: string[]
  completed_at: string | null
  positions: RecruitmentPositionDto[]
  application_counts?: { pending_count: number; accepted_count: number; rejected_count: number; withdrawn_count: number }
  created_at: string
  updated_at: string
}

export interface ManageRecruitment {
  id: string
  title: string
  introMd: string
  applyStartAt: string | null
  applyEndAt: string
  targetGradeMin: number | null
  targetGradeMax: number | null
  notesMd: string | null
  publicationState: string
  publishedAt: string | null
  allowedActions: Array<'EDIT' | 'PUBLISH' | 'DELETE_DRAFT' | 'CANCEL' | 'COMPLETE' | 'ARCHIVE'>
  completedAt: string | null
  positions: Array<{ id: string; name: string; headcount: number; description: string | null; requirements: string | null }>
  applicationCounts: { pending: number; accepted: number; rejected: number; withdrawn: number }
}

function toManageRecruitment(dto: RecruitmentDto): ManageRecruitment {
  return {
    id: dto.id,
    title: dto.title,
    introMd: dto.intro_md,
    applyStartAt: dto.apply_start_at,
    applyEndAt: dto.apply_end_at,
    targetGradeMin: dto.target_grade_min,
    targetGradeMax: dto.target_grade_max,
    notesMd: dto.notes_md,
    publicationState: dto.publication_state,
    publishedAt: dto.published_at,
    allowedActions: dto.allowed_actions as ManageRecruitment['allowedActions'],
    completedAt: dto.completed_at,
    positions: (dto.positions ?? []).map(p => ({
      id: p.id ?? '',
      name: p.name,
      headcount: p.headcount,
      description: p.description_md ?? null,
      requirements: p.requirements_md ?? null
    })),
    applicationCounts: {
      pending: dto.application_counts?.pending_count ?? 0,
      accepted: dto.application_counts?.accepted_count ?? 0,
      rejected: dto.application_counts?.rejected_count ?? 0,
      withdrawn: dto.application_counts?.withdrawn_count ?? 0
    }
  }
}

export async function listManageRecruitments(
  organizationId: string,
  params: { status?: string; page?: number; pageSize?: number } = {}
): Promise<{ items: ManageRecruitment[]; total: number }> {
  const dto = await http.get<{ count: number; results: RecruitmentDto[] }>(
    `/manage/organizations/${organizationId}/recruitments`,
    { query: { status: params.status, page: params.page, page_size: params.pageSize } }
  )
  return { items: dto.results.map(toManageRecruitment), total: dto.count }
}

export async function createManageRecruitment(
  organizationId: string,
  payload: {
    title: string
    intro_md: string
    apply_start_at: string | null
    apply_end_at: string
    target_grade_min: number | null
    target_grade_max: number | null
    notes_md: string | null
    publish?: boolean
    positions: Array<{ name: string; headcount: number; description_md?: string | null; requirements_md?: string | null; sort_order?: number }>
  }
): Promise<ManageRecruitment> {
  const dto = await http.post<RecruitmentDto>(`/manage/organizations/${organizationId}/recruitments`, payload)
  return toManageRecruitment(dto)
}

export async function updateManageRecruitment(
  organizationId: string,
  recruitmentId: string,
  payload: Partial<{
    title: string
    intro_md: string
    apply_start_at: string | null
    apply_end_at: string
    target_grade_min: number | null
    target_grade_max: number | null
    notes_md: string | null
    positions: Array<{ id?: string; name: string; headcount: number; description_md?: string | null; requirements_md?: string | null; sort_order?: number }>
  }>
): Promise<ManageRecruitment> {
  const dto = await http.patch<RecruitmentDto>(
    `/manage/organizations/${organizationId}/recruitments/${recruitmentId}`,
    payload
  )
  return toManageRecruitment(dto)
}

export async function getManageRecruitment(organizationId: string, recruitmentId: string, signal?: AbortSignal): Promise<ManageRecruitment> {
  const dto = await http.get<RecruitmentDto>(`/manage/organizations/${organizationId}/recruitments/${recruitmentId}`, { signal })
  return toManageRecruitment(dto)
}

export async function publishManageRecruitment(organizationId: string, recruitmentId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/recruitments/${recruitmentId}/publish`)
}
export async function cancelManageRecruitment(organizationId: string, recruitmentId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/recruitments/${recruitmentId}/cancel`)
}
export async function completeManageRecruitment(organizationId: string, recruitmentId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/recruitments/${recruitmentId}/complete`)
}
export async function archiveManageRecruitment(organizationId: string, recruitmentId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/recruitments/${recruitmentId}/archive`)
}

// ---------------------------------------------------------------------------
// 申请管理（真实事务）
// ---------------------------------------------------------------------------

interface RecruitmentApplicationDto {
  id: string
  applicant: { id: string; display_name?: string; nickname?: string; avatar?: { url: string | null } | null }
  recruitment_id: string
  position_id: string
  position_name: string
  self_intro: string
  skills: string | null
  experience: string | null
  motivation: string
  status: string
  created_at: string
}

export interface ManageApplication {
  id: string
  applicantName: string
  positionName: string
  recruitmentId: string
  positionId: string
  selfIntro: string
  skills: string | null
  experience: string | null
  motivation: string
  status: string
  createdAt: string
}

function toManageApplication(dto: RecruitmentApplicationDto): ManageApplication {
  const a = dto.applicant as unknown as Record<string, unknown>
  const name = (a.display_name as string) ?? (a.nickname as string) ?? ''
  return {
    id: dto.id,
    applicantName: name,
    positionName: dto.position_name,
    recruitmentId: dto.recruitment_id,
    positionId: dto.position_id,
    selfIntro: dto.self_intro,
    skills: dto.skills,
    experience: dto.experience,
    motivation: dto.motivation,
    status: dto.status,
    createdAt: dto.created_at
  }
}

export async function listManageApplications(
  organizationId: string,
  params: { status?: string; recruitment_id?: string; page?: number; pageSize?: number } = {}
): Promise<{ items: ManageApplication[]; total: number }> {
  const dto = await http.get<{ count: number; results: RecruitmentApplicationDto[] }>(
    `/manage/organizations/${organizationId}/applications`,
    { query: { status: params.status, recruitment_id: params.recruitment_id, page: params.page, page_size: params.pageSize } }
  )
  return { items: dto.results.map(toManageApplication), total: dto.count }
}

export async function acceptManageApplication(organizationId: string, applicationId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/applications/${applicationId}/accept`)
}
export async function rejectManageApplication(organizationId: string, applicationId: string): Promise<void> {
  await http.post(`/manage/organizations/${organizationId}/applications/${applicationId}/reject`)
}
