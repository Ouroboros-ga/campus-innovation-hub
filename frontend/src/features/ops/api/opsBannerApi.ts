import { http } from '@/shared/http/client'

interface BannerDto {
  id: string
  title: string
  subtitle: string | null
  category_label: string | null
  image: { id: string; url: string | null } | null
  alt_text: string | null
  link_type: string
  internal_path: string | null
  external_url: string | null
  start_at: string | null
  end_at: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by_id: string
  updated_by_id: string
}

interface PaginatedDto<T> {
  count: number
  next?: string | null
  previous?: string | null
  results: T[]
}

export interface OpsBanner {
  id: string
  title: string
  subtitle: string | null
  categoryLabel: string | null
  imageUrl: string | null
  imageAssetId: string | null
  altText: string | null
  linkType: string
  internalPath: string | null
  externalUrl: string | null
  startAt: string | null
  endAt: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function toOpsBanner(dto: BannerDto): OpsBanner {
  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle,
    categoryLabel: dto.category_label,
    imageUrl: dto.image?.url ?? null,
    imageAssetId: dto.image?.id ?? null,
    altText: dto.alt_text,
    linkType: dto.link_type,
    internalPath: dto.internal_path,
    externalUrl: dto.external_url,
    startAt: dto.start_at,
    endAt: dto.end_at,
    isActive: dto.is_active,
    sortOrder: dto.sort_order,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
  }
}

export async function listOpsBanners(params?: { active?: boolean; page?: number; pageSize?: number }) {
  const res = await http.get<PaginatedDto<BannerDto>>('/ops/banners', {
    query: {
      active: params?.active != null ? String(params.active) : undefined,
      page: params?.page,
      page_size: params?.pageSize
    }
  })
  return { items: res.results.map(toOpsBanner), total: res.count }
}

export async function patchOpsBanner(id: string, payload: Partial<{ title: string; subtitle: string | null; category_label: string | null; image_asset_id: string | null; alt_text: string | null; is_active: boolean; sort_order: number; link_type: string; internal_path: string | null; external_url: string | null; start_at: string | null; end_at: string | null }>) {
  const res = await http.patch<BannerDto>(`/ops/banners/${id}`, payload)
  return toOpsBanner(res as unknown as BannerDto)
}

export async function createOpsBanner(payload: { title: string; subtitle?: string | null; category_label?: string | null; image_asset_id: string; alt_text?: string | null; link_type: string; internal_path?: string | null; external_url?: string | null; start_at?: string | null; end_at?: string | null; is_active: boolean; sort_order: number }) {
  const res = await http.post<BannerDto>('/ops/banners', payload)
  return toOpsBanner(res as unknown as BannerDto)
}
