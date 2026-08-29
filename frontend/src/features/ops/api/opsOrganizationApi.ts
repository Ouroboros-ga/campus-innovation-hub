import { http } from '@/shared/http/client'

export interface OpsOrganization {
  id: string
  name: string
  organization_type: string
  short_intro: string | null
  description_md?: string | null
  logo: { id?: string; url: string | null } | null
  banner?: { id?: string; url: string | null } | null
  public_contact?: string | null
  qq_group_number?: string | null
  qq_group_join_url?: string | null
  qq_group_qr?: { id?: string; url: string | null } | null
  allow_online_application?: boolean
  is_active?: boolean
  leader: { user_id: string; display_name: string; avatar: { url: string | null } | null; title: string | null } | null
  advisor: { user_id: string; display_name: string; avatar: { url: string | null } | null; title: string | null } | null
  member_count: number
  is_recruiting: boolean
  recruitment_end_at: string | null
  updated_at: string
  created_at: string
}

export function listOpsOrganizations(params: {
  q?: string
  organization_type?: string
  is_recruiting?: boolean
  page?: number
  pageSize?: number
}) {
  return http.get<{ count: number; next: string | null; previous: string | null; results: OpsOrganization[] }>('/ops/organizations', {
    query: {
      q: params.q,
      organization_type: params.organization_type,
      is_recruiting: params.is_recruiting === undefined ? undefined : String(params.is_recruiting),
      page: params.page,
      page_size: params.pageSize
    }
  })
}

export interface OrganizationCreatePayload {
  name: string
  organization_type: string
  short_intro?: string | null
  description_md?: string | null
  logo_asset_id?: string | null
  banner_asset_id?: string | null
  public_contact?: string | null
  qq_group_number?: string | null
  qq_group_qr_asset_id?: string | null
  qq_group_join_url?: string | null
  allow_online_application?: boolean
  related_links_json?: Array<{ label?: string | null; url?: string | null; type?: string | null }>
  leader_user_id?: string | null
  leader_title?: string | null
  advisor_user_id?: string | null
  advisor_title?: string | null
}

export interface OrganizationUpdatePayload extends Partial<OrganizationCreatePayload> {
  is_active?: boolean
}

export function createOpsOrganization(payload: OrganizationCreatePayload) {
  return http.post<OpsOrganization>('/ops/organizations', payload)
}

export function updateOpsOrganization(id: string, payload: OrganizationUpdatePayload) {
  return http.patch<OpsOrganization>(`/ops/organizations/${id}`, payload)
}

export function getOpsOrganization(id: string) {
  return http.get<OpsOrganization>(`/ops/organizations/${id}`)
}

export interface OpsUserOption {
  id: string
  username: string
  real_name: string
  identity_type: string
  display_name: string
  avatar: { url: string | null } | null
  department: string | null
  major: string | null
}

export function searchOpsUsers(params: { q: string; identity_type?: string; page?: number; pageSize?: number }) {
  return http.get<{ count: number; results: OpsUserOption[] }>('/ops/users/search', {
    query: {
      q: params.q,
      identity_type: params.identity_type,
      page: params.page,
      page_size: params.pageSize
    }
  })
}
