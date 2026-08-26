/**
 * 队伍 API 集成（FE-102）。
 *
 * 映射 `docs/api/APIContract.md §3.4` 组队端点 → 前端视图模型：
 * - GET /api/teams（列表，服务端筛选/分页）
 * - GET /api/teams/{id}（详情，含本人申请状态）
 * - POST /api/teams（发布组队，LOGIN）
 * - POST /api/teams/{id}/applications（申请加入，LOGIN）
 *
 * 仅按契约字段映射；认证（LOGIN）未接线时 isOwned/contact 不返回。
 */

import { http } from '@/shared/http/client'
import type { Paginated } from '@/shared/http/types'
import type {
  MyTeamApplication,
  TeamPost,
  TeamPostDetail,
  TeamPostDraft
} from '@/features/teams/types'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface TeamRoleDto {
  id?: string
  name: string
  headcount: number
  requirements?: string | null
  skills?: string | null
}

interface TeamListItemDto {
  id: string
  post_type: TeamPost['postType']
  title: string
  competition_id: string
  competition_name: string
  team_name?: string | null
  direction?: string | null
  base_member_count: number
  target_member_count: number
  current_member_count?: number
  members_summary?: string | null
  goal?: string | null
  weekly_commitment?: string | null
  roles: TeamRoleDto[]
  status: TeamPost['status']
  author: { id: string; nickname?: string | null; avatar?: { id?: string; url?: string | null } | null }
  created_at: string
}

interface TeamDetailDto extends TeamListItemDto {
  notes_md?: string | null
  my_application_state?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | null
  creator_bio?: string | null
}

/** 队伍列表筛选参数。 */
export interface TeamListParams {
  q?: string
  competitionId?: string
  postType?: string
  status?: string
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------------------
// 映射
// ---------------------------------------------------------------------------

function uniqueSkills(roles: TeamRoleDto[]): string[] {
  const merged = roles
    .map(role => role.skills ?? '')
    .join(', ')
    .split(/[,，、]/)
    .map(item => item.trim())
    .filter(Boolean)
  return [...new Set(merged)]
}

function toTeamPost(item: TeamListItemDto): TeamPost {
  return {
    id: item.id,
    title: item.title,
    postType: item.post_type,
    status: item.status,
    competitionId: item.competition_id,
    competitionName: item.competition_name,
    baseMemberCount: item.base_member_count,
    targetMemberCount: item.target_member_count,
    roles: item.roles.map(role => role.name),
    skills: uniqueSkills(item.roles),
    goal: item.goal ?? '',
    creatorName: item.author.nickname ?? '',
    creatorGrade: '',
    creatorMajor: '',
    isOwned: false,
    publishedAt: item.created_at,
    detailPath: `/teams/${item.id}`
  }
}

export type TeamApplicationState = NonNullable<TeamDetailDto['my_application_state']>

/** 队伍详情 + 本人申请状态。 */
export interface TeamDetailResult extends TeamPostDetail {
  myApplicationState: TeamApplicationState | null
}

function toTeamDetail(item: TeamDetailDto): TeamDetailResult {
  const post = toTeamPost(item)
  return {
    ...post,
    direction: item.direction ?? '',
    currentMembers: item.members_summary ?? '',
    expectedEffort: item.weekly_commitment ?? '',
    intro: item.notes_md ?? item.goal ?? '',
    creatorBio: item.creator_bio ?? null,
    myApplicationState: item.my_application_state ?? null
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 组队广场列表（服务端筛选/分页）。 */
export async function listTeams(params: TeamListParams): Promise<{
  items: TeamPost[]
  total: number
  page: number
}> {
  const response = await http.get<Paginated<TeamListItemDto>>('/teams', {
    query: {
      q: params.q,
      competition_id: params.competitionId,
      post_type: params.postType,
      status: params.status,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return {
    items: response.results.map(toTeamPost),
    total: response.count,
    page: params.page ?? 1
  }
}

/** 组队详情。 */
export async function getTeam(id: string): Promise<TeamDetailResult> {
  const response = await http.get<TeamDetailDto>(`/teams/${id}`)
  return toTeamDetail(response)
}

/** 发布组队（LOGIN）。 */
export async function createTeam(draft: TeamPostDraft): Promise<TeamDetailResult> {
  const response = await http.post<TeamDetailDto>('/teams', {
    competition_id: draft.competitionId,
    post_type: draft.postType,
    title: draft.title,
    team_name: draft.teamName || null,
    direction: draft.direction,
    members_summary: draft.currentMembers,
    base_member_count: draft.baseMemberCount,
    target_member_count: draft.targetMemberCount,
    goal: draft.goal,
    weekly_commitment: draft.expectedEffort,
    contact_method: 'OTHER',
    contact_value: draft.contact,
    notes_md: draft.notes,
    roles: draft.roles.map(name => ({
      name,
      headcount: 1,
      requirements: '',
      skills: draft.skills.join(', ')
    }))
  })
  return toTeamDetail(response)
}

/** 申请加入队伍（LOGIN）。 */
export async function applyToTeam(
  teamId: string,
  application: Omit<MyTeamApplication, 'teamId' | 'status' | 'submittedAt'>
): Promise<void> {
  await http.post(`/teams/${teamId}/applications`, {
    self_intro: application.selfIntro,
    skills: application.skills ?? '',
    experience: application.experience ?? '',
    motivation: application.motivation,
    weekly_commitment: application.weeklyCommitment ?? '',
    contact_method: 'OTHER',
    contact_value: application.contact
  })
}
