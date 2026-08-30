import { computed, ref, type Ref } from 'vue'

import {
  createManageRecruitment,
  getManageRecruitment,
  publishManageRecruitment,
  updateManageRecruitment,
  type ManageRecruitment
} from '@/features/organizations/api/orgManageApi'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import { AppError } from '@/shared/http/types'
import { firstFieldErrors } from '@/shared/lib/form-errors'
import type { EditorIntent } from '@/shared/types/editor'
import { emptyRecruitmentDraft, type RecruitmentEditorDraft } from './types'

const aliases = {
  title: 'title', intro_md: 'introMd', apply_start_at: 'applyStartAt', apply_end_at: 'applyEndAt',
  target_grade_min: 'targetGradeMin', target_grade_max: 'targetGradeMax', notes_md: 'notesMd', positions: 'positions'
}

function toDraft(recruitment: ManageRecruitment): RecruitmentEditorDraft {
  return {
    title: recruitment.title, introMd: recruitment.introMd, applyStartAt: recruitment.applyStartAt ?? '', applyEndAt: recruitment.applyEndAt,
    targetGradeMin: recruitment.targetGradeMin, targetGradeMax: recruitment.targetGradeMax, notesMd: recruitment.notesMd ?? '',
    positions: recruitment.positions.map(position => ({ id: position.id, name: position.name, headcount: position.headcount, descriptionMd: position.description ?? '', requirementsMd: position.requirements ?? '' }))
  }
}

function validateRecruitment(draft: RecruitmentEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (draft.title.trim().length < 2) errors.title = '招新标题至少需要 2 个字符'
  if (!draft.introMd.trim()) errors.introMd = '请填写招新介绍'
  if (!draft.applyEndAt) errors.applyEndAt = '请选择申请截止时间'
  if (draft.applyStartAt && draft.applyEndAt && draft.applyStartAt > draft.applyEndAt) errors.applyStartAt = '开始时间不能晚于截止时间'
  if ((draft.targetGradeMin === null) !== (draft.targetGradeMax === null)) errors.targetGradeMin = '目标年级上下限必须同时填写或同时为空'
  if (draft.targetGradeMin !== null && draft.targetGradeMax !== null && draft.targetGradeMin > draft.targetGradeMax) errors.targetGradeMin = '目标年级下限不能大于上限'
  if (!draft.positions.length) errors.positions = '至少保留一个岗位'
  if (draft.positions.some(position => !position.name.trim() || position.headcount < 1)) errors.positions = '每个岗位都需要名称和至少 1 个名额'
  if (new Set(draft.positions.map(position => position.name.trim()).filter(Boolean)).size !== draft.positions.filter(position => position.name.trim()).length) errors.positions = '岗位名称不能重复'
  return errors
}

export function useRecruitmentEditor(organizationId: Ref<string>, recruitmentId: Ref<string | undefined>) {
  const recruitment = ref<ManageRecruitment | null>(null)
  const isNew = computed(() => !recruitmentId.value)
  const task = useEditorTask<RecruitmentEditorDraft, ManageRecruitment>({
    initialDraft: emptyRecruitmentDraft(),
    adapter: {
      async load() {
        if (!recruitmentId.value) { recruitment.value = null; return emptyRecruitmentDraft() }
        const loaded = await getManageRecruitment(organizationId.value, recruitmentId.value)
        recruitment.value = loaded
        return toDraft(loaded)
      },
      validate: validateRecruitment,
      async submit(draft, intent) {
        const payload = {
          title: draft.title.trim(), intro_md: draft.introMd, apply_start_at: draft.applyStartAt || null, apply_end_at: draft.applyEndAt,
          target_grade_min: draft.targetGradeMin, target_grade_max: draft.targetGradeMax, notes_md: draft.notesMd.trim() || null,
          positions: draft.positions.map((position, index) => ({ ...(position.id ? { id: position.id } : {}), name: position.name.trim(), headcount: position.headcount, description_md: position.descriptionMd.trim() || null, requirements_md: position.requirementsMd.trim() || null, sort_order: index }))
        }
        if (!recruitmentId.value) return createManageRecruitment(organizationId.value, { ...payload, publish: intent === 'PUBLISH' })
        const current = recruitment.value
        if (!current || !current.allowedActions.includes('EDIT')) throw new AppError('当前状态不允许编辑。', { status: 409, code: 'INVALID_STATE' })
        const updated = await updateManageRecruitment(organizationId.value, recruitmentId.value, payload)
        if (intent === 'PUBLISH') {
          if (!updated.allowedActions.includes('PUBLISH')) throw new AppError('当前状态不允许发布。', { status: 409, code: 'INVALID_STATE' })
          await publishManageRecruitment(organizationId.value, recruitmentId.value)
          return getManageRecruitment(organizationId.value, recruitmentId.value)
        }
        return updated
      }
    }
  })
  const canEdit = computed(() => isNew.value || recruitment.value?.allowedActions.includes('EDIT') === true)
  const canSaveDraft = computed(() => canEdit.value && (isNew.value || recruitment.value?.publicationState === 'DRAFT'))
  const primaryIntent = computed<EditorIntent | null>(() => {
    if (isNew.value) return 'PUBLISH'
    if (recruitment.value?.publicationState === 'DRAFT' && recruitment.value.allowedActions.includes('PUBLISH')) return 'PUBLISH'
    if (recruitment.value?.publicationState === 'PUBLISHED' && recruitment.value.allowedActions.includes('EDIT')) return 'SAVE_PUBLISHED'
    return null
  })
  return {
    ...task,
    recruitment,
    isNew,
    canEdit,
    canSaveDraft,
    primaryIntent,
    primaryLabel: computed(() => primaryIntent.value === 'SAVE_PUBLISHED' ? '保存更新' : '发布'),
    primaryDisabled: computed(() => !canEdit.value || task.isSubmitting.value),
    statusLabel: computed(() => isNew.value ? '未保存' : recruitment.value?.publicationState === 'PUBLISHED' ? '已发布' : recruitment.value?.publicationState === 'CANCELLED' ? '已取消' : recruitment.value?.publicationState === 'ARCHIVED' ? '已归档' : '草稿'),
    impact: computed(() => isNew.value ? '发布时一次创建并上线；保存草稿不会公开' : recruitment.value?.publicationState === 'PUBLISHED' ? '保存后立即对学生端生效' : '当前仅组织管理端可见'),
    errors: computed(() => ({ ...task.clientErrors.value, ...firstFieldErrors(task.serverFieldErrors.value, aliases) })),
    load: task.load,
    submit: task.submit
  }
}
