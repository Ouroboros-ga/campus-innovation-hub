import { computed, ref, type Ref } from 'vue'

import { listCompetitions } from '@/features/ops/api/opsCompetitionApi'
import {
  createGuide,
  getGuide,
  publishGuide,
  toGuideEditorDraft,
  updateGuide,
  validateGuide
} from '@/features/ops/api/opsGuideApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import { AppError } from '@/shared/http/types'
import type { EditorIntent } from '@/shared/types/editor'
import {
  emptyGuideDraft,
  type GuideCompetitionOption,
  type GuideEditorDraft,
  type OpsGuide
} from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  title: 'title',
  category: 'category',
  summary: 'summary',
  body_md: 'bodyMd',
  competition_ids: 'competitionIds',
  is_featured: 'isFeatured',
  featured_order: 'featuredOrder'
}

export function useGuideEditor(guideId: Ref<string | undefined>) {
  const guide = ref<OpsGuide | null>(null)
  const competitionOptions = ref<GuideCompetitionOption[]>([])
  const competitionOptionsLoading = ref(false)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false

  const isNew = computed(() => !guideId.value)

  const task = useEditorTask<GuideEditorDraft, OpsGuide>({
    initialDraft: emptyGuideDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!guideId.value) {
          guide.value = null
          return emptyGuideDraft()
        }
        const loaded = await getGuide(guideId.value, signal)
        guide.value = loaded
        return toGuideEditorDraft(loaded)
      },
      validate: validateGuide,
      async submit(draft, intent) {
        try {
          if (!guideId.value) {
            return await createGuide(draft, intent === 'PUBLISH')
          }

          const current = guide.value
          if (!current) {
            throw new AppError('当前状态不允许编辑。', {
              status: 409,
              code: 'INVALID_STATE'
            })
          }

          if (intent === 'PUBLISH') {
            if (!current.allowedActions.includes('PUBLISH')) {
              throw new AppError('当前状态不允许发布。', {
                status: 409,
                code: 'INVALID_STATE'
              })
            }
            if (current.allowedActions.includes('EDIT')) {
              await updateGuide(guideId.value, draft)
            }
            await publishGuide(guideId.value)
            return getGuide(guideId.value)
          }

          if (!current.allowedActions.includes('EDIT')) {
            throw new AppError('当前状态不允许编辑。', {
              status: 409,
              code: 'INVALID_STATE'
            })
          }
          return await updateGuide(guideId.value, draft)
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function loadCompetitionOptions(): Promise<void> {
    competitionOptionsLoading.value = true
    try {
      const result = await listCompetitions({ page: 1, pageSize: 100 })
      competitionOptions.value = result.items.map(item => ({
        label: `${item.name}${item.edition ? ` ${item.edition}` : ''}`,
        value: item.id
      }))
    } catch {
      competitionOptions.value = []
    } finally {
      competitionOptionsLoading.value = false
    }
  }

  async function load(): Promise<void> {
    await Promise.all([task.load(), loadCompetitionOptions()])
  }

  async function submit(intent: EditorIntent): Promise<OpsGuide | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) {
      guide.value = result
      return result
    }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = '内容状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const errors = computed(() => ({
    ...task.clientErrors.value,
    ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases)
  }))
  const canEdit = computed(() => isNew.value || guide.value?.allowedActions.includes('EDIT') === true)
  const canPublish = computed(() => isNew.value || guide.value?.allowedActions.includes('PUBLISH') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || guide.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (guide.value?.publicationState === 'DRAFT' && guide.value.allowedActions.includes('PUBLISH')) return 'PUBLISH'
    if (guide.value?.publicationState === 'PUBLISHED' && guide.value.allowedActions.includes('EDIT')) return 'SAVE_PUBLISHED'
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
    if (guide.value?.publicationState === 'PUBLISHED') return '已发布'
    if (guide.value?.publicationState === 'ARCHIVED') return '已归档'
    return '草稿'
  })
  const impact = computed(() => {
    if (isNew.value) return '发布时一次创建并上线；保存草稿不会公开'
    if (guide.value?.publicationState === 'PUBLISHED') return '保存后立即对学生生效'
    if (guide.value?.publicationState === 'ARCHIVED') return '内容已归档，不可编辑'
    return '当前仅运营端可见，发布后学生可查看'
  })

  return {
    ...task,
    guide,
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
    competitionOptions,
    competitionOptionsLoading,
    conflictNotice,
    load,
    submit
  }
}
