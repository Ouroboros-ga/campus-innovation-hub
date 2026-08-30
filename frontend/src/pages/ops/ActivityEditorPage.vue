<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import ActivityEditorForm from '@/features/ops/activities/ActivityEditorForm.vue'
import { useActivityEditor } from '@/features/ops/activities/useActivityEditor'
import type { ActivityAnnouncementIntent } from '@/features/ops/activities/types'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { activityTypeLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'
import type { EditorIntent } from '@/shared/types/editor'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const activityId = computed(() => typeof route.params.id === 'string' ? route.params.id : undefined)
const announcementIntent = ref<ActivityAnnouncementIntent>({
  enabled: route.query.withAnnouncement === '1', title: '', publisherScope: 'ACADEMY', bodyMd: '', externalUrl: ''
})
const editor = useActivityEditor(activityId, announcementIntent)
const loadError = computed(() => !editor.isNew.value && editor.phase.value === 'FAILED' && !editor.activity.value ? editor.formError.value : null)
const subtitle = computed(() => editor.draft.value.title || (editor.isNew.value ? '创建一条新的校园活动' : '活动详情'))
const statusTone = computed(() => editor.activity.value?.publicationState === 'PUBLISHED' ? 'success' as const : editor.activity.value?.publicationState === 'DRAFT' ? 'neutral' as const : 'warning' as const)
const updatedDetail = computed(() => editor.activity.value?.updatedAt ? `最后更新于 ${formatCompactDate(editor.activity.value.updatedAt)}` : '')

watch(() => editor.draft.value.title, title => {
  if (editor.isNew.value && announcementIntent.value.enabled && !announcementIntent.value.title) announcementIntent.value.title = `${title} 报名开启`
  if (editor.isNew.value && announcementIntent.value.enabled && !announcementIntent.value.bodyMd) announcementIntent.value.bodyMd = `「${title}」活动详情与报名方式见活动页。`
})
onMounted(editor.load)
watch(activityId, (next, previous) => { if (next !== previous) void editor.load() })

async function runSubmit(intent: EditorIntent): Promise<void> {
  const wasNew = editor.isNew.value
  const result = await editor.submit(intent)
  if (!result) return
  if (intent === 'SAVE_DRAFT') {
    toast.add({ title: wasNew ? '草稿已创建' : '草稿已保存', description: '活动仍只对运营端可见。', color: 'success' })
    if (wasNew) await router.replace({ name: 'ops-activity-edit', params: { id: result.id } })
    return
  }
  if (intent === 'PUBLISH') {
    toast.add({ title: announcementIntent.value.enabled && wasNew ? '活动与公告已发布' : '活动已发布', description: '学生端现在可以查看最新内容。', color: 'success' })
    await router.push({ name: 'ops-activities' })
    return
  }
  toast.add({ title: '更新已保存', description: '修改已立即对学生端生效。', color: 'success' })
}
function submitPrimary(): void { if (editor.primaryIntent.value) void runSubmit(editor.primaryIntent.value) }
function saveDraft(): void { void runSubmit('SAVE_DRAFT') }
function backToList(): void { void router.push({ name: 'ops-activities' }) }

const unsavedDialogOpen = ref(false)
const pendingPath = ref<string | null>(null)
let allowLeave = false
function guardUnsavedChanges(to: { fullPath: string }): boolean {
  if (allowLeave || !editor.isDirty.value) return true
  pendingPath.value = to.fullPath
  unsavedDialogOpen.value = true
  return false
}
onBeforeRouteLeave(guardUnsavedChanges)
onBeforeRouteUpdate(guardUnsavedChanges)
async function discardAndLeave(): Promise<void> {
  const target = pendingPath.value ?? '/ops/activities'
  allowLeave = true
  try { await router.push(target) } finally { allowLeave = false; pendingPath.value = null }
}
</script>

<template>
  <EditorTaskShell
    :title="editor.isNew.value ? '新建活动' : '编辑活动'"
    :subtitle="subtitle"
    back-label="返回校园动态"
    :primary-label="editor.primaryLabel.value"
    :primary-icon="editor.primaryIntent.value === 'PUBLISH' ? 'i-lucide-send' : 'i-lucide-save'"
    :primary-visible="editor.primaryIntent.value !== null"
    :primary-disabled="editor.primaryDisabled.value"
    :submitting="editor.isSubmitting.value"
    :loading="editor.isLoading.value"
    :load-error="loadError"
    :form-error="loadError ? null : editor.formError.value"
    preview-title="学生端预览"
    @back="backToList"
    @primary="submitPrimary"
    @retry="editor.load"
  >
    <template #status>
      <div class="space-y-3">
        <EditorStatusBanner :status-label="editor.statusLabel.value" :impact="editor.impact.value" :detail="updatedDetail" :tone="statusTone" />
        <div v-if="editor.conflictNotice.value" class="rounded-surface border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">{{ editor.conflictNotice.value }}</div>
      </div>
    </template>
    <template #form>
      <ActivityEditorForm v-model="editor.draft.value" v-model:announcement="announcementIntent" :errors="editor.errors.value" :disabled="!editor.canEdit.value || editor.isSubmitting.value" :is-new="editor.isNew.value" />
    </template>
    <template #preview>
      <article>
        <p class="text-xs font-medium text-primary-600 dark:text-primary-400">{{ activityTypeLabel[editor.draft.value.activityType] }}</p>
        <h2 class="mt-2 text-xl font-bold text-highlighted">{{ editor.draft.value.title || '活动名称' }}</h2>
        <p v-if="editor.draft.value.summary" class="mt-3 border-l-2 border-primary-500 pl-3 text-sm text-toned">{{ editor.draft.value.summary }}</p>
        <RichContent class="mt-6" :content="editor.draft.value.descriptionMd || '在左侧填写活动正文后，这里会显示学生端阅读效果。'" />
      </article>
    </template>
    <template v-if="editor.canSaveDraft.value" #secondary-actions>
      <UButton type="button" color="neutral" variant="outline" icon="i-lucide-save" @click="saveDraft">保存草稿</UButton>
    </template>
  </EditorTaskShell>

  <UnsavedChangesDialog v-model:open="unsavedDialogOpen" @cancel="pendingPath = null" @confirm="discardAndLeave" />
</template>
