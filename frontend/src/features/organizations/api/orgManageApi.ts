/**
 * 组织管理 API（真实后端，非 mock）。
 *
 * - GET    /manage/organizations/:id/profile
 * - PATCH  /manage/organizations/:id/profile
 */

import { http } from '@/shared/http/client'

interface MediaRefDto {
  id?: string
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
  logo: { src: string | null; alt: string } | null
  banner: { src: string | null; alt: string } | null
  publicContact: string | null
}

function toProfile(dto: OrgProfileDto): OrgProfile {
  return {
    id: dto.id,
    name: dto.name,
    organizationType: dto.organization_type,
    shortIntro: dto.short_intro ?? null,
    descriptionMd: dto.description_md ?? null,
    logo: dto.logo ? { alt: dto.name, src: dto.logo.url ?? null } : null,
    banner: dto.banner ? { alt: dto.name, src: dto.banner.url ?? null } : null,
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
