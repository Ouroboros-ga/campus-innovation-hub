import { http } from '@/shared/http/client'

interface TeamMgmtDto {
  id: string
  title: string
  competition_id: string
  competition_name: string
  post_type: string
  team_name?: string | null
  direction: string
  base_member_count: number
  target_member_count: number
  current_member_count?: number
  status: string
  author: { id: string; display_name?: string | null; nickname?: string | null }
  created_at: string
  roles?: Array<{ name: string; headcount: number }>
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

export interface OpsTeam {
  id: string
  title: string
  competitionId: string
  competitionName: string
  postType: string
  teamName: string | null
  direction: string
  baseMemberCount: number
  targetMemberCount: number
  currentMemberCount: number
  status: string
  authorName: string
  createdAt: string
  roles: string[]
  detailPath: string
}

function toOpsTeam(dto: TeamMgmtDto): OpsTeam {
  return {
    id: dto.id,
    title: dto.title,
    competitionId: dto.competition_id,
    competitionName: dto.competition_name,
    postType: dto.post_type,
    teamName: dto.team_name ?? null,
    direction: dto.direction,
    baseMemberCount: dto.base_member_count,
    targetMemberCount: dto.target_member_count,
    currentMemberCount: dto.current_member_count ?? dto.base_member_count,
    status: dto.status,
    authorName: dto.author.display_name ?? dto.author.nickname ?? '',
    createdAt: dto.created_at,
    roles: (dto.roles ?? []).map(r => r.name),
    detailPath: `/teams/${dto.id}`
  }
}

export async function listOpsTeams(params: {
  q?: string
  competitionId?: string
  postType?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ items: OpsTeam[]; total: number; page: number }> {
  const res = await http.get<PaginatedDto<TeamMgmtDto>>('/ops/teams', {
    query: {
      q: params.q,
      competition_id: params.competitionId,
      post_type: params.postType,
      status: params.status,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return { items: res.results.map(toOpsTeam), total: res.count, page: params.page ?? 1 }
}

export async function closeOpsTeam(id: string): Promise<void> {
  await http.post(`/ops/teams/${id}/close`)
}
