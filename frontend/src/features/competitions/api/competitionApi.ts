/**
 * 竞赛 API 集成（FE-101）。
 *
 * 映射 `docs/api/APIContract.md §3.3` 竞赛端点 → 前端视图模型：
 * - GET /api/competitions（列表，服务端筛选/分页）
 * - GET /api/competitions/{id}（详情）
 * - POST / DELETE /api/competitions/{id}/follow（关注，需 LOGIN；认证冻结前未接线）
 *
 * 仅按契约字段映射；可推导展示文本（如参赛形式/级别/分类）由已知事实派生，不虚构统计。
 */

import { http } from '@/shared/http/client'
import type { Paginated } from '@/shared/http/types'
import {
  competitionCategoryLabel,
  competitionLevelLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'
import type {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionSummary,
  ParticipationMode
} from '@/shared/types/homepage'
import type { CompetitionDetail } from '@/features/competitions/types'

// ---------------------------------------------------------------------------
// 契约 DTO
// ---------------------------------------------------------------------------

interface CompetitionListItemDto {
  id: string
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participation_mode: ParticipationMode
  suitable_grade_min?: number | null
  suitable_grade_max?: number | null
  direction?: string | null
  summary?: string | null
  cover?: { id?: string; url?: string | null } | null
  registration_start_at: string | null
  registration_end_at: string | null
  event_start_at: string | null
  publication_state?: string
  registration_state?: string
  event_phase?: string
  official_url: string | null
  followed?: boolean
}

interface TimelineItemDto {
  id: string
  title: string
  event_at: string
  end_at?: string | null
  description?: string | null
  sort_order?: number
}

interface CompetitionDetailDto extends CompetitionListItemDto {
  description_md?: string | null
  suitable_for_md?: string | null
  preparation_advice_md?: string | null
  registration_url?: string | null
  official_notice_url?: string | null
  college_organized?: boolean
  college_contact_name?: string | null
  college_contact_text?: string | null
  suitable_grade_min?: number | null
  suitable_grade_max?: number | null
  direction?: string | null
  summary?: string | null
  timeline?: TimelineItemDto[]
  related_guides?: Array<{ id: string; title: string; published_at?: string | null; detail_path?: string | null }>
  related_announcements?: Array<{ id: string; title: string; published_at?: string | null; detail_path?: string | null }>
  team_posts?: Array<{
    id: string
    title: string
    base_member_count?: number
    target_member_count?: number
    roles?: string[]
    leader_name?: string
    leader_note?: string
    published_at?: string | null
  }>
}

/** 竞赛列表筛选参数。 */
export interface CompetitionListParams {
  q?: string
  status?: string
  category?: string
  format?: string
  page?: number
  pageSize?: number
}

/** 前端状态 → 契约状态枚举。 */
function toApiStatus(status?: string): string | undefined {
  if (!status) return undefined
  if (status === 'CLOSED') return 'ENDED'
  return status
}

function toSummary(item: CompetitionListItemDto): CompetitionSummary {
  return {
    id: item.id,
    name: item.name,
    edition: item.edition,
    slogan: null,
    crossSchool: undefined,
    category: item.category,
    level: item.level,
    participationMode: item.participation_mode,
    registrationStartAt: item.registration_start_at,
    registrationEndAt: item.registration_end_at,
    eventStartAt: item.event_start_at,
    eventEndAt: null,
    officialUrl: item.official_url,
    cover: { alt: item.name, src: item.cover?.url ?? null },
    detailPath: `/competitions/${item.id}`
  }
}

function toDetail(item: CompetitionDetailDto): CompetitionDetail {
  const summary = toSummary(item)
  const highlights: CompetitionDetail['highlights'] = [
    { icon: 'i-lucide-users', title: '参赛形式', note: participationModeLabel[item.participation_mode] },
    { icon: 'i-lucide-badge-check', title: '赛事级别', note: competitionLevelLabel[item.level] },
    { icon: 'i-lucide-layers', title: '竞赛分类', note: competitionCategoryLabel[item.category] },
    { icon: 'i-lucide-calendar', title: '届数', note: item.edition }
  ]

  const officialLinks: CompetitionDetail['officialLinks'] = []
  if (item.registration_url) officialLinks.push({ label: '报名入口', url: item.registration_url })
  if (item.official_notice_url) officialLinks.push({ label: '官方通知', url: item.official_notice_url })

  return {
    ...summary,
    brief: item.summary ?? '',
    intro: item.description_md ?? '',
    whoShouldJoin: item.suitable_for_md ?? '',
    highlights,
    requirement: {
      audience: item.suitable_for_md ?? '',
      teamRequirement: item.participation_mode === 'TEAM' ? '团队赛' : '个人参赛',
      domains: item.direction ?? '',
      organizer: item.college_contact_name ?? '',
      contactEmail: item.college_contact_text ?? null
    },
    suitableGradeMin: item.suitable_grade_min ?? null,
    suitableGradeMax: item.suitable_grade_max ?? null,
    direction: item.direction ?? null,
    summary: item.summary ?? null,
    suitableForMd: item.suitable_for_md ?? null,
    preparationAdviceMd: item.preparation_advice_md ?? null,
    collegeContactName: item.college_contact_name ?? null,
    collegeContactText: item.college_contact_text ?? null,
    registrationUrl: item.registration_url ?? null,
    officialNoticeUrl: item.official_notice_url ?? null,
    timeline: (item.timeline ?? []).map(node => ({
      date: node.event_at,
      title: node.title,
      description: node.description ?? null
    })),
    registrationTips: item.preparation_advice_md ? [item.preparation_advice_md] : [],
    officialLinks,
    guidePath: null,
    relatedAnnouncements: (item.related_announcements ?? []).map(a => ({
      id: a.id,
      title: a.title,
      publishedAt: a.published_at ?? '',
      detailPath: a.detail_path ?? ''
    })),
    relatedGuides: (item.related_guides ?? []).map(g => ({
      id: g.id,
      title: g.title,
      publishedAt: g.published_at ?? '',
      detailPath: g.detail_path ?? ''
    })),
    recruitingTeams: (item.team_posts ?? []).map(post => ({
      id: post.id,
      title: post.title,
      competitionName: item.name,
      baseMemberCount: post.base_member_count ?? 1,
      targetMemberCount: post.target_member_count ?? 1,
      roles: post.roles ?? [],
      leaderName: post.leader_name ?? '',
      leaderNote: post.leader_note ?? '',
      createdAt: post.published_at ?? '',
      detailPath: `/teams/${post.id}`
    }))
  }
}

// ---------------------------------------------------------------------------
// 公开 API
// ---------------------------------------------------------------------------

/** 竞赛列表（服务端筛选/分页）。 */
export async function listCompetitions(params: CompetitionListParams): Promise<{
  items: CompetitionSummary[]
  total: number
  page: number
}> {
  const response = await http.get<Paginated<CompetitionListItemDto>>('/competitions', {
    query: {
      q: params.q,
      status: toApiStatus(params.status),
      category: params.category,
      participation_mode: params.format,
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

/** 竞赛详情。 */
export async function getCompetition(id: string): Promise<CompetitionDetail> {
  const response = await http.get<CompetitionDetailDto>(`/competitions/${id}`)
  return toDetail(response)
}

/** 关注竞赛（LOGIN）。 */
export async function followCompetition(id: string): Promise<void> {
  await http.post(`/competitions/${id}/follow`)
}

/** 取消关注竞赛（LOGIN）。 */
export async function unfollowCompetition(id: string): Promise<void> {
  await http.delete(`/competitions/${id}/follow`)
}
