import { computed, ref, type Ref } from 'vue'

import {
  createFaq,
  getFaq,
  publishFaq,
  toFaqEditorDraft,
  updateFaq,
  validateFaq
} from '@/features/ops/api/opsFaqApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import { AppError } from '@/shared/http/types'
import type { EditorIntent } from '@/shared/types/editor'
import { emptyFaqDraft, type FaqEditorDraft, type OpsFaq } from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  category: 'category',
  question: 'question',
  answer_md: 'answerMd',
  sort_order: 'sortOrder',
  is_featured: 'isFeatured',
  featured_order: 'featuredOrder'
}

export function useFaqEditor(faqId: Ref<string | undefined>) {
  const faq = ref<OpsFaq | null>(null)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false

  const isNew = computed(() => !faqId.value)
  const task = useEditorTask<FaqEditorDraft, OpsFaq>({
    initialDraft: emptyFaqDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!faqId.value) {
          faq.value = null
          return emptyFaqDraft()
        }
        const loaded = await getFaq(faqId.value, signal)
        faq.value = loaded
        return toFaqEditorDraft(loaded)
      },
      validate: validateFaq,
      async submit(draft, intent) {
        try {
          if (!faqId.value) return await createFaq(draft, intent === 'PUBLISH')

          const current = faq.value
          if (!current) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }

          if (intent === 'PUBLISH') {
            if (!current.allowedActions.includes('PUBLISH')) {
              throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
            }
            if (current.allowedActions.includes('EDIT')) await updateFaq(faqId.value, draft)
            await publishFaq(faqId.value)
            return getFaq(faqId.value)
          }

          if (!current.allowedActions.includes('EDIT')) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }
          return await updateFaq(faqId.value, draft)
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function submit(intent: EditorIntent): Promise<OpsFaq | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) {
      faq.value = result
      return result
    }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = 'FAQ 状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const errors = computed(() => ({
    ...task.clientErrors.value,
    ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases)
  }))
  const canEdit = computed(() => isNew.value || faq.value?.allowedActions.includes('EDIT') === true)
  const canPublish = computed(() => isNew.value || faq.value?.allowedActions.includes('PUBLISH') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || faq.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (faq.value?.publicationState === 'DRAFT' && canPublish.value) return 'PUBLISH'
    if (faq.value?.publicationState === 'PUBLISHED' && canEdit.value) return 'SAVE_PUBLISHED'
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
    if (faq.value?.publicationState === 'PUBLISHED') return '已发布'
    if (faq.value?.publicationState === 'ARCHIVED') return '已归档'
    return '草稿'
  })
  const impact = computed(() => {
    if (isNew.value) return '发布时一次创建并上线；保存草稿不会公开'
    if (faq.value?.publicationState === 'PUBLISHED') return '保存后立即对学生端 FAQ 生效'
    if (faq.value?.publicationState === 'ARCHIVED') return '内容已归档，不可编辑'
    return '当前仅运营端可见，发布后学生可以查看'
  })

  return {
    ...task,
    faq,
    isNew,
    canEdit,
    canPublish,
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
