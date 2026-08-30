import { computed, ref, type Ref } from 'vue'

import {
  createAnnouncement,
  getAnnouncement,
  publishAnnouncement,
  toAnnouncementEditorDraft,
  updateAnnouncement,
  validateAnnouncement
} from '@/features/ops/api/opsAnnouncementApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import { AppError } from '@/shared/http/types'
import type { EditorIntent } from '@/shared/types/editor'
import { emptyAnnouncementDraft, type AnnouncementEditorDraft, type OpsAnnouncement } from './types'

const fieldAliases: Readonly<Record<string, string>> = {
  title: 'title', summary: 'summary', body_md: 'bodyMd', publisher_scope: 'publisherScope',
  source_name: 'sourceName', external_url: 'externalUrl', is_pinned: 'isPinned',
  is_home_featured: 'isHomeFeatured', competition_id: 'relation', activity_id: 'relation',
  organization_id: 'relation', recruitment_id: 'relation'
}

export function useAnnouncementEditor(announcementId: Ref<string | undefined>) {
  const announcement = ref<OpsAnnouncement | null>(null)
  const conflictNotice = ref<string | null>(null)
  let conflictDetected = false
  const isNew = computed(() => !announcementId.value)

  const task = useEditorTask<AnnouncementEditorDraft, OpsAnnouncement>({
    initialDraft: emptyAnnouncementDraft(),
    adapter: {
      async load(signal) {
        conflictNotice.value = null
        if (!announcementId.value) {
          announcement.value = null
          return emptyAnnouncementDraft()
        }
        const loaded = await getAnnouncement(announcementId.value, signal)
        announcement.value = loaded
        return toAnnouncementEditorDraft(loaded)
      },
      validate: validateAnnouncement,
      async submit(draft, intent) {
        try {
          if (!announcementId.value) return await createAnnouncement(draft, intent === 'PUBLISH')
          const current = announcement.value
          if (!current) throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          if (intent === 'PUBLISH') {
            if (!current.allowedActions.includes('PUBLISH')) throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
            if (current.allowedActions.includes('EDIT')) await updateAnnouncement(announcementId.value, draft)
            await publishAnnouncement(announcementId.value)
            return getAnnouncement(announcementId.value)
          }
          if (!current.allowedActions.includes('EDIT')) throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
          return await updateAnnouncement(announcementId.value, draft)
        } catch (error: unknown) {
          conflictDetected = error instanceof AppError && error.status === 409
          throw error
        }
      }
    }
  })

  async function submit(intent: EditorIntent): Promise<OpsAnnouncement | null> {
    conflictDetected = false
    conflictNotice.value = null
    const result = await task.submit(intent)
    if (result) { announcement.value = result; return result }
    if (conflictDetected) {
      await task.load()
      conflictNotice.value = '公告状态已变化，已重新加载服务器最新版本。'
    }
    return null
  }

  const errors = computed(() => ({ ...task.clientErrors.value, ...firstFieldErrors(task.serverFieldErrors.value, fieldAliases) }))
  const canEdit = computed(() => isNew.value || announcement.value?.allowedActions.includes('EDIT') === true)
  const canPublish = computed(() => isNew.value || announcement.value?.allowedActions.includes('PUBLISH') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || announcement.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (announcement.value?.publicationState === 'DRAFT' && canPublish.value) return 'PUBLISH'
    if (announcement.value?.publicationState === 'PUBLISHED' && canEdit.value) return 'SAVE_PUBLISHED'
    return null
  })
  const primaryLabel = computed(() => primaryIntent.value === 'SAVE_PUBLISHED' ? '保存更新' : '发布')
  const primaryDisabled = computed(() => primaryIntent.value === 'PUBLISH' ? !canPublish.value : primaryIntent.value === 'SAVE_PUBLISHED' ? !canEdit.value : true)
  const statusLabel = computed(() => isNew.value ? '未保存' : announcement.value?.publicationState === 'PUBLISHED' ? '已发布' : announcement.value?.publicationState === 'ARCHIVED' ? '已归档' : '草稿')
  const impact = computed(() => isNew.value ? '发布时一次创建并上线；保存草稿不会公开' : announcement.value?.publicationState === 'PUBLISHED' ? '保存后立即对学生端生效' : announcement.value?.publicationState === 'ARCHIVED' ? '内容已归档，不可编辑' : '当前仅运营端可见，发布后学生可以查看')

  return { ...task, announcement, isNew, canEdit, canPublish, canSaveDraft, primaryIntent, primaryLabel, primaryDisabled, statusLabel, impact, errors, conflictNotice, submit }
}
