export type DocumentCategory = 'ABOUT' | 'CONTACT' | 'HELP' | 'PRIVACY' | 'TERMS' | 'OTHER'
export type DocumentPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type DocumentAllowedAction = 'EDIT' | 'PUBLISH' | 'ARCHIVE'

export interface DocumentEditorDraft {
  slug: string
  title: string
  category: DocumentCategory
  summary: string
  bodyMd: string
  sortOrder: number
  version: string
}

export interface OpsDocument {
  id: string
  slug: string
  title: string
  category: DocumentCategory
  summary: string | null
  bodyMd: string
  sortOrder: number
  version: string
  publicationState: DocumentPublicationState
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  createdById: string
  updatedById: string
  allowedActions: DocumentAllowedAction[]
  detailPath: string
}

export const emptyDocumentDraft = (): DocumentEditorDraft => ({
  slug: '',
  title: '',
  category: 'ABOUT',
  summary: '',
  bodyMd: '',
  sortOrder: 0,
  version: '1.0'
})

export const documentCategoryLabel: Record<DocumentCategory, string> = {
  ABOUT: '关于我们',
  CONTACT: '联系我们',
  HELP: '使用帮助',
  PRIVACY: '隐私政策',
  TERMS: '服务条款',
  OTHER: '其他'
}
