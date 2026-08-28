import { http } from '@/shared/http/client'

interface RecruitmentAppDto {
  id: string
  status: string
  created_at: string
  updated_at: string
  organization: { id: string; name: string }
  recruitment: { id: string; title: string }
  position: { id: string; name: string } | null
  applicant: { id: string; username: string; display_name: string | null }
  manage_path: string
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

export interface OpsRecruitmentApplication {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  organizationId: string
  organizationName: string
  recruitmentId: string
  recruitmentTitle: string
  positionName: string | null
  applicantName: string
  applicantUsername: string
  managePath: string
}

function toOps(dto: RecruitmentAppDto): OpsRecruitmentApplication {
  return {
    id: dto.id,
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    organizationId: dto.organization.id,
    organizationName: dto.organization.name,
    recruitmentId: dto.recruitment.id,
    recruitmentTitle: dto.recruitment.title,
    positionName: dto.position?.name ?? null,
    applicantName: dto.applicant.display_name ?? dto.applicant.username,
    applicantUsername: dto.applicant.username,
    managePath: dto.manage_path
  }
}

export async function listOpsRecruitmentApplications(params: { q?: string; status?: string; organizationId?: string; recruitmentId?: string; page?: number; pageSize?: number }) {
  const res = await http.get<PaginatedDto<RecruitmentAppDto>>('/ops/recruitment-applications', {
    query: {
      q: params.q,
      status: params.status,
      organization_id: params.organizationId,
      recruitment_id: params.recruitmentId,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return { items: res.results.map(toOps), total: res.count }
}
