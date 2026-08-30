import { computed, ref, type Ref } from 'vue'

import {
  createActivity,
  createActivityWithAnnouncement,
  getActivity,
  publishActivity,
  toActivityEditorDraft,
  updateActivity,
  validateActivity
} from '@/features/ops/api/opsActivityApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { AppError } from '@/shared/http/types'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import type { EditorIntent } from '@/shared/types/editor'
import {
  emptyActivityDraft,
  type ActivityAnnouncementIntent,
  type ActivityEditorDraft,
  type OpsActivity
} from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  title: 'title', activity_type: 'activityType', summary: 'summary', description_md: 'descriptionMd',
  organizer_organization_id: 'organizerOrganizationId', organizer_name: 'organizerName',
  speaker: 'speaker', location: 'location', start_at: 'startAt', end_at: 'endAt',
  registration_required: 'registrationRequired', registration_start_at: 'registrationStartAt',
  registration_end_at: 'registrationEndAt', capacity: 'capacity', notes_md: 'notesMd', cover_asset_id: 'cover'
}

export function useActivityEditor(
  activityId: Ref<string | undefined>,
  announcementIntent: Ref<ActivityAnnouncementIntent>
) {
  const activity = ref<OpsActivity | null>(null)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false
  const isNew = computed(() => !activityId.value)

  const task = useEditorTask<ActivityEditorDraft, OpsActivity>({
    initialDraft: emptyActivityDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!activityId.value) {
          activity.value = null
          return emptyActivityDraft()
        }
        const loaded = await getActivity(activityId.value, signal)
        activity.value = loaded
        return toActivityEditorDraft(loaded)
      },
      validate: validateActivity,
      async submit(draft, intent) {
        try {
          if (!activityId.value) {
            if (announcementIntent.value.enabled) {
              return (await createActivityWithAnnouncement(draft, announcementIntent.value, intent === 'PUBLISH')).activity
            }
            return createActivity(draft, intent === 'PUBLISH')
          }
          const current = activity.value
          if (!current || !current.allowedActions.includes('EDIT')) {
            throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          }
          const updated = await updateActivity(activityId.value, draft)
          if (intent === 'PUBLISH') {
            if (!updated.allowedActions.includes('PUBLISH')) {
              throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
            }
            await publishActivity(activityId.value)
            return getActivity(activityId.value)
          }
          return updated
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function load(): Promise<void> { await task.load() }
  async function submit(intent: EditorIntent): Promise<OpsActivity | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) {
      activity.value = result
      return result
    }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = '活动状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const canEdit = computed(() => isNew.value || activity.value?.allowedActions.includes('EDIT') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || activity.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (activity.value?.publicationState === 'DRAFT' && activity.value.allowedActions.includes('PUBLISH')) return 'PUBLISH'
    if (activity.value?.publicationState === 'PUBLISHED' && activity.value.allowedActions.includes('EDIT')) return 'SAVE_PUBLISHED'
    return null
  })
  const primaryLabel = computed(() => primaryIntent.value === 'SAVE_PUBLISHED' ? '保存更新' : '发布')
  const statusLabel = computed(() => {
    if (isNew.value) return '未保存'
    if (activity.value?.publicationState === 'PUBLISHED') return '已发布'
    if (activity.value?.publicationState === 'CANCELLED') return '已取消'
    if (activity.value?.publicationState === 'ARCHIVED') return '已归档'
    return '草稿'
  })
  const impact = computed(() => {
    if (isNew.value && announcementIntent.value.enabled) return '活动与公告会在一次事务中同时创建；发布后一起对学生端可见'
    if (isNew.value) return '发布时一次创建并上线；保存草稿不会公开'
    if (activity.value?.publicationState === 'PUBLISHED') return '保存后立即对学生端生效'
    if (activity.value?.publicationState === 'DRAFT') return '当前仅运营端可见，发布后学生可查看'
    return '当前状态不可直接编辑，请新建一条内容。'
  })
  const errors = computed(() => ({
    ...task.clientErrors.value,
    ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases)
  }))

  return {
    ...task,
    activity,
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
