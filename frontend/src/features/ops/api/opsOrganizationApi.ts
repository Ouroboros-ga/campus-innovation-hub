import { http } from '@/shared/http/client'

export interface OpsOrganization {
  id: string
  name: string
  organization_type: string
  short_intro: string | null
  logo: { id?: string; url: string | null } | null
  leader: { display_name: string; avatar: { url: string | null } | null; title: string | null } | null
  advisor: { display_name: string; avatar: { url: string | null } | null; title: string | null } | null
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
}

export function createOpsOrganization(payload: OrganizationCreatePayload) {
  return http.post<OpsOrganization>('/ops/organizations', payload)
}
