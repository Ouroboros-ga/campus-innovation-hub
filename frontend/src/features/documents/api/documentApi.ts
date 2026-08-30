/** 文档中心 API：公开 DTO 与运营 DTO 在同一 HTTP 边界内分别校验。 */

import type {
  DocumentAllowedAction,
  DocumentCategory,
  DocumentEditorDraft,
  DocumentPublicationState,
  OpsDocument
} from '@/features/documents/ops/types'
import { http } from '@/shared/http/client'
import { AppError } from '@/shared/http/types'

export interface SiteDocument {
  id: string
  slug: string
  title: string
  category: DocumentCategory
  summary: string | null
  bodyMd: string | null
  publicationState?: DocumentPublicationState
  publishedAt: string | null
  version: string
  updatedAt: string | null
  createdAt?: string | null
}

interface PublicDocumentDto {
  id: string
  slug: string
  title: string
  category: DocumentCategory
  summary?: string | null
  body_md?: string | null
  published_at?: string | null
  version?: string | null
  updated_at?: string | null
}

interface PaginatedDto {
  count: number
  results: unknown[]
}

interface DocumentWriteDto {
  slug?: string
  title: string
  category: DocumentCategory
  summary: string | null
  body_md: string
  sort_order: number
  version: string
}

const categories = new Set<DocumentCategory>(['ABOUT', 'CONTACT', 'HELP', 'PRIVACY', 'TERMS', 'OTHER'])
const publicationStates = new Set<DocumentPublicationState>(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
const allowedActions = new Set<DocumentAllowedAction>(['EDIT', 'PUBLISH', 'ARCHIVE'])

function toPublicDocument(dto: PublicDocumentDto): SiteDocument {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    summary: dto.summary ?? null,
    bodyMd: dto.body_md ?? null,
    publishedAt: dto.published_at ?? null,
    version: dto.version ?? '1.0',
    updatedAt: dto.updated_at ?? null
  }
}

function invalidResponse(): never {
  throw new AppError('文档管理接口返回了无法识别的数据。', {
    status: 0,
    code: 'INVALID_RESPONSE'
  })
}

function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse()
  return value as Record<string, unknown>
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) invalidResponse()
  return [...value]
}

function nullableString(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') invalidResponse()
  return value
}

function parseOpsDocument(value: unknown): OpsDocument {
  const dto = recordOf(value)
  if (
    typeof dto.id !== 'string' ||
    typeof dto.slug !== 'string' ||
    typeof dto.title !== 'string' ||
    typeof dto.category !== 'string' ||
    !categories.has(dto.category as DocumentCategory) ||
    typeof dto.body_md !== 'string' ||
    typeof dto.sort_order !== 'number' ||
    !Number.isInteger(dto.sort_order) ||
    dto.sort_order < 0 ||
    typeof dto.version !== 'string' ||
    typeof dto.publication_state !== 'string' ||
    !publicationStates.has(dto.publication_state as DocumentPublicationState) ||
    typeof dto.created_by_id !== 'string' ||
    typeof dto.updated_by_id !== 'string'
  ) {
    invalidResponse()
  }
  const summary = nullableString(dto.summary)
  const publishedAt = nullableString(dto.published_at)
  const createdAt = nullableString(dto.created_at)
  const updatedAt = nullableString(dto.updated_at)
  const actions = stringArray(dto.allowed_actions)
  if (actions.some(action => !allowedActions.has(action as DocumentAllowedAction))) invalidResponse()

  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    category: dto.category as DocumentCategory,
    summary,
    bodyMd: dto.body_md,
    sortOrder: dto.sort_order,
    version: dto.version,
    publicationState: dto.publication_state as DocumentPublicationState,
    publishedAt,
    createdAt,
    updatedAt,
    createdById: dto.created_by_id,
    updatedById: dto.updated_by_id,
    allowedActions: actions as DocumentAllowedAction[],
    detailPath: `/docs/${dto.slug}`
  }
}

export function validateDocument(draft: DocumentEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const slug = draft.slug.trim()
  if (!slug) errors.slug = '请填写文档标识'
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = '仅允许小写字母、数字与连字符'
  const title = draft.title.trim()
  if (!title) errors.title = '请填写文档标题'
  else if (title.length < 2) errors.title = '文档标题至少需要 2 个字符'
  if (!draft.bodyMd.trim()) errors.bodyMd = '请填写文档正文'
  if (!Number.isInteger(draft.sortOrder) || draft.sortOrder < 0) errors.sortOrder = '排序必须是非负整数'
  if (!draft.version.trim()) errors.version = '请填写版本号'
  return errors
}

function toDocumentWriteDto(draft: DocumentEditorDraft, includeSlug: boolean): DocumentWriteDto {
  return {
    ...(includeSlug ? { slug: draft.slug.trim().toLowerCase() } : {}),
    title: draft.title.trim(),
    category: draft.category,
    summary: draft.summary.trim() || null,
    body_md: draft.bodyMd,
    sort_order: draft.sortOrder,
    version: draft.version.trim()
  }
}

export function toDocumentEditorDraft(document: OpsDocument): DocumentEditorDraft {
  return {
    slug: document.slug,
    title: document.title,
    category: document.category,
    summary: document.summary ?? '',
    bodyMd: document.bodyMd,
    sortOrder: document.sortOrder,
    version: document.version
  }
}

export async function listDocuments(params?: { category?: DocumentCategory }): Promise<SiteDocument[]> {
  const data = await http.get<PublicDocumentDto[] | { results?: PublicDocumentDto[] }>('/documents', {
    query: { category: params?.category }
  })
  if (Array.isArray(data)) return data.map(toPublicDocument)
  return Array.isArray(data.results) ? data.results.map(toPublicDocument) : []
}

export async function getDocument(slug: string): Promise<SiteDocument> {
  return toPublicDocument(await http.get<PublicDocumentDto>(`/documents/${encodeURIComponent(slug)}`))
}

export async function listOpsDocuments(params?: {
  q?: string
  category?: DocumentCategory
  status?: DocumentPublicationState
  page?: number
  pageSize?: number
}): Promise<{ items: OpsDocument[]; total: number; page: number }> {
  const response = await http.get<PaginatedDto>('/ops/documents', {
    query: {
      q: params?.q,
      category: params?.category,
      status: params?.status,
      page: params?.page,
      page_size: params?.pageSize
    }
  })
  if (!response || typeof response.count !== 'number' || !Array.isArray(response.results)) invalidResponse()
  return {
    items: response.results.map(parseOpsDocument),
    total: response.count,
    page: params?.page ?? 1
  }
}

export async function getOpsDocument(id: string, signal?: AbortSignal): Promise<OpsDocument> {
  return parseOpsDocument(await http.get<unknown>(`/ops/documents/${encodeURIComponent(id)}`, { signal }))
}

export async function createDocument(draft: DocumentEditorDraft, publish = false): Promise<OpsDocument> {
  return parseOpsDocument(await http.post<unknown>('/ops/documents', {
    ...toDocumentWriteDto(draft, true),
    publish
  }))
}

export async function updateDocument(
  id: string,
  draft: DocumentEditorDraft,
  canChangeSlug = true
): Promise<OpsDocument> {
  return parseOpsDocument(await http.patch<unknown>(
    `/ops/documents/${encodeURIComponent(id)}`,
    toDocumentWriteDto(draft, canChangeSlug)
  ))
}

export async function publishDocument(id: string): Promise<void> {
  await http.post(`/ops/documents/${encodeURIComponent(id)}/publish`)
}

export async function archiveDocument(id: string): Promise<void> {
  await http.post(`/ops/documents/${encodeURIComponent(id)}/archive`)
}

export type {
  DocumentAllowedAction,
  DocumentCategory,
  DocumentEditorDraft,
  DocumentPublicationState,
  OpsDocument
} from '@/features/documents/ops/types'
export type PublicationState = DocumentPublicationState
