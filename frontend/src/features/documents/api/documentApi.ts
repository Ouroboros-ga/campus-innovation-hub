/**
 * 文档中心 API（PUBLIC + OPS）。
 *
 * 契约：
 * - GET  /api/documents               公开列表（PUBLIC）
 * - GET  /api/documents/{slug}        公开详情（PUBLIC）
 * - GET  /api/ops/documents           运营列表（OPERATOR）
 * - POST /api/ops/documents           新建（OPERATOR）
 * - GET  /api/ops/documents/{id}      运营详情
 * - PATCH /api/ops/documents/{id}     编辑草稿
 * - POST /api/ops/documents/{id}/publish  发布
 * - POST /api/ops/documents/{id}/archive  归档
 */

import { http } from '@/shared/http/client'

export type DocumentCategory = 'ABOUT' | 'CONTACT' | 'HELP' | 'PRIVACY' | 'TERMS' | 'OTHER'
export type PublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface SiteDocument {
  id: string
  slug: string
  title: string
  category: DocumentCategory
  summary: string | null
  bodyMd: string | null
  publicationState?: PublicationState
  publishedAt: string | null
  version: string
  updatedAt: string | null
  createdAt?: string | null
}

interface DocumentListDto {
  id: string
  slug: string
  title: string
  category: DocumentCategory
  summary?: string | null
  published_at?: string | null
  version?: string | null
  updated_at?: string | null
}

interface DocumentDetailDto extends DocumentListDto {
  body_md?: string | null
}

function toDoc(dto: DocumentListDto & Partial<DocumentDetailDto>): SiteDocument {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    summary: dto.summary ?? null,
    bodyMd: (dto.body_md as string | null) ?? null,
    publishedAt: dto.published_at ?? null,
    version: dto.version ?? '1.0',
    updatedAt: dto.updated_at ?? null
  }
}

// ---------------------------------------------------------------------------
// PUBLIC
// ---------------------------------------------------------------------------

export async function listDocuments(params?: { category?: DocumentCategory }): Promise<SiteDocument[]> {
  const data = await http.get<DocumentListDto[]>('/documents', {
    query: { category: params?.category }
  })
  // 后端在无数据时返回 fallback 列表（id 为 fallback-*），直接映射
  if (Array.isArray(data)) return data.map(toDoc)
  // 兼容分页包裹（若未来改为分页）
  const maybePaginated = data as unknown as { results?: DocumentListDto[] }
  if (maybePaginated.results) return maybePaginated.results.map(toDoc)
  return []
}

export async function getDocument(slug: string): Promise<SiteDocument> {
  const data = await http.get<DocumentDetailDto>(`/documents/${encodeURIComponent(slug)}`)
  return toDoc(data)
}

// ---------------------------------------------------------------------------
// OPS (管理端)
// ---------------------------------------------------------------------------

export interface OpsDocument extends SiteDocument {
  publicationState: PublicationState
  publishedAt: string | null
  createdAt: string | null
  createdById?: string
  updatedById?: string
}

interface OpsListDto extends DocumentDetailDto {
  publication_state: PublicationState
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  created_by_id: string
  updated_by_id: string
}

function toOpsDoc(dto: OpsListDto): OpsDocument {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    summary: dto.summary ?? null,
    bodyMd: dto.body_md ?? null,
    publicationState: dto.publication_state,
    publishedAt: dto.published_at,
    version: dto.version ?? '1.0',
    updatedAt: dto.updated_at,
    createdAt: dto.created_at,
    createdById: dto.created_by_id,
    updatedById: dto.updated_by_id
  }
}

export async function listOpsDocuments(params?: {
  q?: string
  category?: DocumentCategory
  status?: PublicationState
  page?: number
  pageSize?: number
}): Promise<{ items: OpsDocument[]; total: number }> {
  const res = await http.get<{ count: number; results: OpsListDto[] }>('/ops/documents', {
    query: {
      q: params?.q,
      category: params?.category,
      status: params?.status,
      page: params?.page,
      page_size: params?.pageSize
    }
  })
  return { items: res.results.map(toOpsDoc), total: res.count }
}

export async function getOpsDocument(id: string): Promise<OpsDocument> {
  const dto = await http.get<OpsListDto>(`/ops/documents/${encodeURIComponent(id)}`)
  return toOpsDoc(dto)
}

export async function createDocument(payload: {
  slug: string
  title: string
  category: DocumentCategory
  summary?: string | null
  body_md: string
  sort_order?: number
  version?: string
}): Promise<OpsDocument> {
  const dto = await http.post<OpsListDto>('/ops/documents', payload)
  return toOpsDoc(dto)
}

export async function updateDocument(
  id: string,
  payload: Partial<{ slug: string; title: string; category: DocumentCategory; summary: string | null; body_md: string; sort_order: number; version: string }>
): Promise<OpsDocument> {
  const dto = await http.patch<OpsListDto>(`/ops/documents/${encodeURIComponent(id)}`, payload)
  return toOpsDoc(dto)
}

export async function publishDocument(id: string): Promise<void> {
  await http.post(`/ops/documents/${encodeURIComponent(id)}/publish`)
}

export async function archiveDocument(id: string): Promise<void> {
  await http.post(`/ops/documents/${encodeURIComponent(id)}/archive`)
}
