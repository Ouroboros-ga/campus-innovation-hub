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

interface AdvisorDto {
  membership_id?: string
  user_id?: string
  public_name?: string | null
  display_name?: string | null
  avatar?: ImageDto | null
  department?: string | null
  academic_title?: string | null
  public_email?: string | null
  office_location?: string | null
  research_interests?: string[] | null
  title?: string | null
}

interface OrganizationDetailDto extends OrganizationListItemDto {
  banner?: ImageDto | null
  description_md?: string | null
  direction?: string | null
  founded_at?: string | null
  member_count?: number | null
  college?: string | null
  advisors?: AdvisorDto[] | null
  leaders?: AdvisorDto[] | null
  current_user_organization_role?: string | null
  can_manage?: boolean | null
  is_leader?: boolean
  leader_name?: string | null
  leader_title?: string | null
  leader_grade?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_address?: string | null
  wechat_name?: string | null
  public_contact?: string | null
  qq_group_number?: string | null
  qq_group_qr?: ImageDto | null
  qq_group_join_url?: string | null
  allow_online_application?: boolean | null
  related_links?: Array<{ label?: string | null; url?: string | null; type?: string | null }> | null
  related_links_json?: Array<{ label?: string | null; url?: string | null; type?: string | null }> | null
  current_recruitments?: CurrentRecruitmentDto[]
  recent_activities?: Array<{
    id: string
    title: string
    start_at?: string | null
    detail_path?: string | null
  }>
  // 兼容旧后端（滚动发布期间）
  advisor_name?: string | null
  advisor_title?: string | null
  advisor_college?: string | null
  advisor_research?: string | null
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
  qq_group_number?: string | null
  qq_group_qr?: ImageDto | null
  qq_group_join_url?: string | null
  enable_online_application?: boolean | null
  organization_allow_online_application?: boolean | null
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

function toAdvisor(dto: AdvisorDto): import('@/features/organizations/types').OrganizationAdvisor {
  return {
    membershipId: dto.membership_id ?? dto.user_id ?? '',
    userId: dto.user_id ?? '',
    publicName: dto.public_name ?? dto.display_name ?? null,
    displayName: dto.display_name ?? dto.public_name ?? null,
    avatar: dto.avatar ? { alt: dto.display_name ?? dto.public_name ?? '', src: dto.avatar.url ?? null } : null,
    department: dto.department ?? null,
    academicTitle: dto.academic_title ?? null,
    publicEmail: dto.public_email ?? null,
    officeLocation: dto.office_location ?? null,
    researchInterests: dto.research_interests ?? [],
    title: dto.title ?? null
  }
}

function toDetail(dto: OrganizationDetailDto): OrganizationDetail {
  const summary = toSummary(dto)
  // 兼容旧后端：若新字段缺失但旧 advisor_name 存在，则构造单条 advisor
  const advisorsRaw = dto.advisors ?? (dto.advisor_name ? [{
    public_name: dto.advisor_name,
    display_name: dto.advisor_name,
    academic_title: dto.advisor_title ?? null,
    department: dto.advisor_college ?? null,
    research_interests: dto.advisor_research ? [dto.advisor_research] : [],
    title: null,
    user_id: '',
    membership_id: ''
  } as AdvisorDto] : [])
  const leadersRaw = dto.leaders ?? []
  const relatedRaw = dto.related_links ?? dto.related_links_json ?? []
  // 负责人优先取 leaders[0]，回退旧字段
  const primaryLeader = leadersRaw[0]
  return {
    ...summary,
    banner: dto.banner ? { alt: `${dto.name}横幅`, src: dto.banner.url ?? null } : null,
    descriptionMd: dto.description_md ?? '',
    direction: dto.direction ?? '',
    foundedAt: dto.founded_at ?? null,
    memberCount: dto.member_count ?? null,
    college: dto.college ?? null,
    advisors: advisorsRaw.map(toAdvisor),
    leaders: leadersRaw.map(toAdvisor),
    currentUserOrganizationRole: (dto.current_user_organization_role as OrganizationDetail['currentUserOrganizationRole']) ?? null,
    canManage: dto.can_manage ?? null,
    isLeader: dto.is_leader ?? null,
    leaderName: dto.leader_name ?? primaryLeader?.display_name ?? primaryLeader?.public_name ?? '',
    leaderTitle: dto.leader_title ?? primaryLeader?.title ?? '',
    leaderGrade: dto.leader_grade ?? null,
    contactEmail: dto.contact_email ?? null,
    contactPhone: dto.contact_phone ?? null,
    contactAddress: dto.contact_address ?? null,
    wechatName: dto.wechat_name ?? null,
    publicContact: dto.public_contact ?? null,
    qqGroupNumber: dto.qq_group_number ?? null,
    qqGroupQr: dto.qq_group_qr ? { alt: `${dto.name}招新 QQ 群二维码`, src: dto.qq_group_qr.url ?? null } : null,
    qqGroupJoinUrl: dto.qq_group_join_url ?? null,
    allowOnlineApplication: dto.allow_online_application ?? true,
    relatedLinks: relatedRaw
      .filter(item => item.label && item.url)
      .map(item => ({
        label: String(item.label),
        url: String(item.url),
        type: (item.type === 'competition' || item.type === 'activity' ? item.type : 'external') as 'competition' | 'activity' | 'external'
      })),
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

/** 招新详情段补组织 type/logo（其余取招新 DTO），并回退 QQ 群信息到组织级。 */
function toRecruitmentDetail(
  dto: RecruitmentDetailDto,
  org: OrganizationDetail
): RecruitmentDetail {
  const orgQr = org.qqGroupQr ?? null
  const dtoQr = dto.qq_group_qr ? { alt: `${dto.title}招新 QQ 群二维码`, src: dto.qq_group_qr.url ?? null } : null
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
    positions: (dto.positions ?? []).map(toPosition),
    qqGroupNumber: dto.qq_group_number ?? org.qqGroupNumber ?? null,
    qqGroupQr: dtoQr ?? orgQr,
    qqGroupJoinUrl: dto.qq_group_join_url ?? org.qqGroupJoinUrl ?? null,
    enableOnlineApplication: dto.enable_online_application ?? true,
    organizationAllowOnlineApplication: dto.organization_allow_online_application ?? org.allowOnlineApplication ?? true
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
