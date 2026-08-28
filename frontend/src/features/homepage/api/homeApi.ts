import { http } from '@/shared/http/client'
import type {
  ActivitySummary,
  AnnouncementSummary,
  CarouselSlide,
  CompetitionSummary,
  DeadlineItem,
  FaqSummary,
  GuideSummary,
  OrganizationRecruitmentSummary,
  TeamRecruitmentSummary
} from '@/shared/types/homepage'

interface RawBannerDto {
  id: string
  title: string
  subtitle?: string | null
  category_label?: string | null
  image?: { url?: string | null; alt?: string | null } | null
  link_type?: string
  internal_path?: string | null
  external_url?: string | null
  start_at?: string | null
  end_at?: string | null
  sort_order?: number
}
interface HomeDto {
  banners: RawBannerDto[]
  deadlines: Array<Record<string, unknown>>
  featured_competitions: Array<Record<string, unknown>>
  announcements: Array<Record<string, unknown>>
  featured_guides: Array<Record<string, unknown>>
  team_posts: Array<Record<string, unknown>>
  recruiting_organizations: Array<Record<string, unknown>>
  activities: Array<Record<string, unknown>>
  faqs: Array<Record<string, unknown>>
}

function toCarouselSlide(dto: RawBannerDto): CarouselSlide {
  const rawType = dto.link_type
  const type: CarouselSlide['link']['type'] = rawType === 'INTERNAL' || rawType === 'EXTERNAL' || rawType === 'NONE' ? rawType : 'NONE'
  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle ?? null,
    categoryLabel: dto.category_label ?? null,
    image: { alt: (dto.image?.alt as string) ?? dto.title, src: dto.image?.url ?? null },
    link: {
      type,
      internalPath: dto.internal_path ?? null,
      externalUrl: dto.external_url ?? null
    },
    startAt: dto.start_at ?? null,
    endAt: dto.end_at ?? null,
    sortOrder: dto.sort_order ?? 0
  }
}

function toCompetitionSummary(dto: Record<string, unknown>): CompetitionSummary {
  return {
    id: (dto.id as string) ?? '',
    name: (dto.name as string) ?? (dto.title as string) ?? '',
    edition: (dto.edition as string) ?? '',
    category: (dto.category as CompetitionSummary['category']) ?? 'OTHER',
    level: (dto.level as CompetitionSummary['level']) ?? 'OTHER',
    participationMode: (dto.participation_mode as CompetitionSummary['participationMode']) ?? 'TEAM',
    registrationStartAt: (dto.registration_start_at as string) ?? null,
    registrationEndAt: (dto.registration_end_at as string) ?? null,
    eventStartAt: (dto.event_start_at as string) ?? null,
    eventEndAt: (dto.event_end_at as string) ?? null,
    officialUrl: (dto.official_url as string) ?? null,
    cover: { alt: (dto.name as string) ?? '', src: ((dto.cover as Record<string, unknown>)?.url as string) ?? null },
    detailPath: `/competitions/${dto.id}`
  }
}

function toDeadlineItem(dto: Record<string, unknown>, index: number): DeadlineItem | null {
  const end = (dto.registration_end_at as string) ?? (dto.apply_end_at as string) ?? (dto.end_at as string)
  if (!end) return null
  const rawKind = dto.kind as string | undefined
  const kind: DeadlineItem['kind'] = rawKind === 'ACTIVITY' || rawKind === 'RECRUITMENT' ? rawKind : 'COMPETITION'
  const id = (dto.id as string) ?? `deadline-${index}`
  let detailPath = `/competitions/${id}`
  if (kind === 'ACTIVITY') detailPath = `/activities/${id}`
  else if (kind === 'RECRUITMENT') {
    const orgId = ((dto.organization as Record<string, unknown>)?.id as string) ?? (dto.organization_id as string) ?? ''
    detailPath = orgId ? `/organizations/${orgId}/recruitments/${id}` : `/organizations`
  }
  return {
    id,
    kind,
    title: (dto.name as string) ?? (dto.title as string) ?? '',
    deadlineAt: end,
    detailPath
  }
}

function toTeamSummary(dto: Record<string, unknown>): TeamRecruitmentSummary {
  return {
    id: dto.id as string,
    title: (dto.title as string) ?? '',
    postType: (dto.post_type as TeamRecruitmentSummary['postType']) ?? 'TEAM_RECRUITING',
    competitionName: ((dto.competition as Record<string, unknown>)?.name as string) ?? '',
    baseMemberCount: Number(dto.base_member_count ?? 1),
    targetMemberCount: Number(dto.target_member_count ?? 1),
    roles: Array.isArray(dto.roles) ? (dto.roles as string[]) : [],
    createdAt: (dto.created_at as string) ?? new Date().toISOString(),
    detailPath: `/teams/${dto.id}`
  }
}

function toOrgRecruitmentSummary(dto: Record<string, unknown>): OrganizationRecruitmentSummary {
  const org = dto.organization as Record<string, unknown> | undefined
  const positions = Array.isArray(dto.positions) ? dto.positions as Array<Record<string, unknown>> : []
  const orgId = (org?.id as string) ?? (dto.organization_id as string) ?? ''
  return {
    id: dto.id as string,
    organizationId: orgId,
    organizationName: (org?.name as string) ?? '',
    organizationType: (org?.organization_type as OrganizationRecruitmentSummary['organizationType']) ?? 'OTHER',
    recruitmentId: dto.id as string,
    recruitmentTitle: (dto.title as string) ?? '',
    positions: positions.map(p => ({ name: p.name as string, headcount: Number(p.headcount ?? 1) })),
    applyStartAt: (dto.apply_start_at as string) ?? null,
    applyEndAt: (dto.apply_end_at as string) ?? null,
    organizationPath: orgId ? `/organizations/${orgId}` : '/organizations',
    recruitmentPath: orgId ? `/organizations/${orgId}/recruitments/${dto.id}` : `/organizations`
  }
}

function toActivitySummary(dto: Record<string, unknown>): ActivitySummary {
  return {
    id: dto.id as string,
    title: (dto.title as string) ?? '',
    activityType: (dto.activity_type as ActivitySummary['activityType']) ?? 'OTHER',
    summary: (dto.summary as string) ?? null,
    startAt: (dto.start_at as string) ?? new Date().toISOString(),
    endAt: (dto.end_at as string) ?? null,
    location: (dto.location as string) ?? '',
    organizerName: (dto.organizer_name as string) ?? null,
    registrationRequired: Boolean(dto.registration_required),
    registrationEndAt: (dto.registration_end_at as string) ?? null,
    cover: { alt: (dto.title as string) ?? '', src: ((dto.cover as Record<string, unknown>)?.url as string) ?? null },
    detailPath: `/activities/${dto.id}`
  }
}

function toAnnouncementSummary(dto: Record<string, unknown>): AnnouncementSummary {
  return {
    id: dto.id as string,
    title: (dto.title as string) ?? '',
    publishedAt: (dto.published_at as string) ?? (dto.created_at as string) ?? new Date().toISOString(),
    detailPath: `/activities/announcements/${dto.id}`
  }
}

function toGuideSummary(dto: Record<string, unknown>): GuideSummary {
  return {
    id: dto.id as string,
    title: (dto.title as string) ?? '',
    category: (dto.category as GuideSummary['category']) ?? 'OTHER',
    summary: (dto.summary as string) ?? null,
    publishedAt: (dto.published_at as string) ?? (dto.created_at as string) ?? new Date().toISOString(),
    detailPath: `/qa/guides/${dto.id}`
  }
}

function toFaqSummary(dto: Record<string, unknown>): FaqSummary {
  return {
    id: dto.id as string,
    category: (dto.category as FaqSummary['category']) ?? 'OTHER',
    question: (dto.question as string) ?? (dto.title as string) ?? '',
    detailPath: '/qa/faqs'
  }
}

export interface HomeData {
  banners: CarouselSlide[]
  deadlines: DeadlineItem[]
  featuredCompetitions: CompetitionSummary[]
  announcements: AnnouncementSummary[]
  featuredGuides: GuideSummary[]
  teamPosts: TeamRecruitmentSummary[]
  recruitingOrganizations: OrganizationRecruitmentSummary[]
  activities: ActivitySummary[]
  faqs: FaqSummary[]
}

export async function getHome(): Promise<HomeData> {
  const dto = await http.get<HomeDto>('/home')
  return {
    banners: (dto.banners ?? []).map(toCarouselSlide),
    deadlines: (dto.deadlines ?? []).map(toDeadlineItem).filter(Boolean) as DeadlineItem[],
    featuredCompetitions: (dto.featured_competitions ?? []).map(toCompetitionSummary),
    announcements: (dto.announcements ?? []).map(toAnnouncementSummary),
    featuredGuides: (dto.featured_guides ?? []).map(toGuideSummary),
    teamPosts: (dto.team_posts ?? []).map(toTeamSummary),
    recruitingOrganizations: (dto.recruiting_organizations ?? []).map(toOrgRecruitmentSummary),
    activities: (dto.activities ?? []).map(toActivitySummary),
    faqs: (dto.faqs ?? []).map(toFaqSummary)
  }
}
