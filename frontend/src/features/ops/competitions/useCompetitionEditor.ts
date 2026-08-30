import { computed, ref, type Ref } from 'vue'

import {
  createCompetition,
  getCompetition,
  publishCompetition,
  toCompetitionEditorDraft,
  updateCompetition,
  validateCompetition
} from '@/features/ops/api/opsCompetitionApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { AppError } from '@/shared/http/types'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import type { EditorIntent } from '@/shared/types/editor'
import {
  emptyCompetitionDraft,
  type CompetitionEditorDraft,
  type OpsCompetition
} from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  name: 'name', edition: 'edition', category: 'category', level: 'level',
  participation_mode: 'participationMode', description_md: 'descriptionMd',
  college_organized: 'collegeOrganized', registration_start_at: 'registrationStartAt',
  registration_end_at: 'registrationEndAt', event_start_at: 'eventStartAt',
  event_end_at: 'eventEndAt', official_url: 'officialUrl', registration_url: 'registrationUrl',
  official_notice_url: 'officialNoticeUrl', cover_asset_id: 'cover',
  suitable_grade_min: 'suitableGradeMin', suitable_grade_max: 'suitableGradeMax',
  suitable_for_md: 'suitableForMd', preparation_advice_md: 'preparationAdviceMd',
  college_contact_name: 'collegeContactName', college_contact_text: 'collegeContactText'
}

export function useCompetitionEditor(competitionId: Ref<string | undefined>) {
  const competition = ref<OpsCompetition | null>(null)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false
  const isNew = computed(() => !competitionId.value)

  const task = useEditorTask<CompetitionEditorDraft, OpsCompetition>({
    initialDraft: emptyCompetitionDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!competitionId.value) {
          competition.value = null
          return emptyCompetitionDraft()
        }
        const loaded = await getCompetition(competitionId.value, signal)
        competition.value = loaded
        return toCompetitionEditorDraft(loaded)
      },
      validate: validateCompetition,
      async submit(draft, intent) {
        try {
          if (!competitionId.value) return createCompetition(draft, intent === 'PUBLISH')
          const current = competition.value
          if (!current || !current.allowedActions.includes('EDIT')) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }
          const updated = await updateCompetition(competitionId.value, draft)
          if (intent === 'PUBLISH') {
            if (!updated.allowedActions.includes('PUBLISH')) {
              throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
            }
            await publishCompetition(competitionId.value)
            return getCompetition(competitionId.value)
          }
          return updated
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function load(): Promise<void> {
    await task.load()
  }

  async function submit(intent: EditorIntent): Promise<OpsCompetition | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) {
      competition.value = result
      return result
    }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = '竞赛状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const canEdit = computed(() => isNew.value || competition.value?.allowedActions.includes('EDIT') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || competition.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (competition.value?.publicationState === 'DRAFT' && competition.value.allowedActions.includes('PUBLISH')) return 'PUBLISH'
    if (competition.value?.publicationState === 'PUBLISHED' && competition.value.allowedActions.includes('EDIT')) return 'SAVE_PUBLISHED'
    return null
  })
  const primaryLabel = computed(() => primaryIntent.value === 'SAVE_PUBLISHED' ? '保存更新' : '发布')
  const statusLabel = computed(() => {
    if (isNew.value) return '未保存'
    if (competition.value?.publicationState === 'PUBLISHED') return '已发布'
    if (competition.value?.publicationState === 'CANCELLED') return '已取消'
    if (competition.value?.publicationState === 'ARCHIVED') return '已归档'
    return '草稿'
  })
  const impact = computed(() => {
    if (isNew.value) return '发布时一次创建并上线；保存草稿不会公开'
    if (competition.value?.publicationState === 'PUBLISHED') return '保存后立即对学生端生效'
    if (competition.value?.publicationState === 'DRAFT') return '当前仅运营端可见，发布后学生可查看'
    return '当前状态不可直接编辑，请新建一条内容。'
  })
  const errors = computed(() => ({
    ...task.clientErrors.value,
    ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases)
  }))

  return {
    ...task,
    competition,
    isNew,
    canEdit,
    canSaveDraft,
    primaryIntent,
    primaryLabel,
    primaryDisabled: computed(() => !canEdit.value || task.isSubmitting.value),
    statusLabel,
    impact,
    errors,
    conflictNotice,
    load,
    submit
  }
}
