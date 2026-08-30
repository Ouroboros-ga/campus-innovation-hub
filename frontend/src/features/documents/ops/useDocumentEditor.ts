import { computed, ref, type Ref } from 'vue'

import {
  createDocument,
  getOpsDocument,
  publishDocument,
  toDocumentEditorDraft,
  updateDocument,
  validateDocument
} from '@/features/documents/api/documentApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import { AppError } from '@/shared/http/types'
import type { EditorIntent } from '@/shared/types/editor'
import { emptyDocumentDraft, type DocumentEditorDraft, type OpsDocument } from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  slug: 'slug',
  title: 'title',
  category: 'category',
  summary: 'summary',
  body_md: 'bodyMd',
  sort_order: 'sortOrder',
  version: 'version'
}

export function useDocumentEditor(documentId: Ref<string | undefined>) {
  const document = ref<OpsDocument | null>(null)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false

  const isNew = computed(() => !documentId.value)
  const task = useEditorTask<DocumentEditorDraft, OpsDocument>({
    initialDraft: emptyDocumentDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!documentId.value) {
          document.value = null
          return emptyDocumentDraft()
        }
        const loaded = await getOpsDocument(documentId.value, signal)
        document.value = loaded
        return toDocumentEditorDraft(loaded)
      },
      validate: validateDocument,
      async submit(draft, intent) {
        try {
          if (!documentId.value) return await createDocument(draft, intent === 'PUBLISH')

          const current = document.value
          if (!current) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }
          if (intent === 'PUBLISH') {
            if (!current.allowedActions.includes('PUBLISH')) {
              throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
            }
            if (current.allowedActions.includes('EDIT')) await updateDocument(documentId.value, draft, true)
            await publishDocument(documentId.value)
            return getOpsDocument(documentId.value)
          }
          if (!current.allowedActions.includes('EDIT')) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }
          return await updateDocument(documentId.value, draft, current.publicationState === 'DRAFT')
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function submit(intent: EditorIntent): Promise<OpsDocument | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) {
      document.value = result
      return result
    }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = '文档状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const errors = computed(() => ({
    ...task.clientErrors.value,
    ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases)
  }))
  const canEdit = computed(() => isNew.value || document.value?.allowedActions.includes('EDIT') === true)
  const canPublish = computed(() => isNew.value || document.value?.allowedActions.includes('PUBLISH') === true)
  const canChangeSlug = computed(() => isNew.value || document.value?.publicationState === 'DRAFT')
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || document.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (document.value?.publicationState === 'DRAFT' && canPublish.value) return 'PUBLISH'
    if (document.value?.publicationState === 'PUBLISHED' && canEdit.value) return 'SAVE_PUBLISHED'
    return null
  })
  const primaryLabel = computed(() => primaryIntent.value === 'SAVE_PUBLISHED' ? '保存更新' : '发布')
  const primaryDisabled = computed(() => {
    if (primaryIntent.value === 'PUBLISH') return !canPublish.value
    if (primaryIntent.value === 'SAVE_PUBLISHED') return !canEdit.value
    return true
  })
  const statusLabel = computed(() => {
    if (isNew.value) return '未保存'
    if (document.value?.publicationState === 'PUBLISHED') return '已发布'
    if (document.value?.publicationState === 'ARCHIVED') return '已归档'
    return '草稿'
  })
  const impact = computed(() => {
    if (isNew.value) return '发布时一次创建并上线；保存草稿不会公开'
    if (document.value?.publicationState === 'PUBLISHED') return '保存后立即对学生端生效；文档标识不可修改'
    if (document.value?.publicationState === 'ARCHIVED') return '内容已归档，不可编辑'
    return '当前仅运营端可见，发布后学生可以查看'
  })

  return {
    ...task,
    document,
    isNew,
    canEdit,
    canPublish,
    canChangeSlug,
    canSaveDraft,
    primaryIntent,
    primaryLabel,
    primaryDisabled,
    statusLabel,
    impact,
    errors,
    conflictNotice,
    submit
  }
}
