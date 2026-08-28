import { http } from '@/shared/http/client'

export interface WorkbenchStats {
  pending: { applications: number; consultations: number; pending_publish: number; missing: number }
  overview: { total: number; published: number; draft: number; archived: number }
  health: { missing_cover: number; missing_official_url: number; near_deadline: number }
}

export interface CompetitionHealth {
  total: number
  missing_cover: number
  missing_official_url: number
  near_deadline: number
  featured: number
  featured_limit: number
  complete: number
}

export interface DynamicsStats {
  total: number
  published: number
  draft: number
  archived: number
  cancelled: number
  activities: { total: number; published: number; draft: number }
  announcements: { total: number; published: number; draft: number }
}

export interface OrganizationStats {
  total: number
  recruiting: number
  not_recruiting: number
  new_this_month: number
  top_organization: { id: string; name: string; member_count: number } | null
}

export interface RecentDrafts {
  recent: Array<{ id: string; title: string; type: string; updated_at: string }>
  drafts: Array<{ id: string; title: string; type: string; updated_at: string }>
}

export function getWorkbenchStats() {
  return http.get<WorkbenchStats>('/ops/overview/workbench')
}
export function getCompetitionHealth() {
  return http.get<CompetitionHealth>('/ops/overview/competitions/health')
}
export function getDynamicsStats() {
  return http.get<DynamicsStats>('/ops/overview/dynamics/stats')
}
export function getOrganizationStats() {
  return http.get<OrganizationStats>('/ops/organizations/stats')
}
export function getRecentDrafts() {
  return http.get<RecentDrafts>('/ops/overview/recent-drafts')
}
