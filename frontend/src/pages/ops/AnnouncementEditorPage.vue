<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import AnnouncementEditorForm from '@/features/ops/announcements/AnnouncementEditorForm.vue'
import { useAnnouncementEditor } from '@/features/ops/announcements/useAnnouncementEditor'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { formatCompactDate } from '@/shared/lib/date'
import type { EditorIntent } from '@/shared/types/editor'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const announcementId = computed(() => typeof route.params.id === 'string' ? route.params.id : undefined)
const editor = useAnnouncementEditor(announcementId)
const loadError = computed(() => !editor.isNew.value && editor.phase.value === 'FAILED' && !editor.announcement.value ? editor.formError.value : null)
const statusTone = computed(() => editor.announcement.value?.publicationState === 'PUBLISHED' ? 'success' as const : editor.announcement.value?.publicationState === 'ARCHIVED' ? 'warning' as const : 'neutral' as const)
const subtitle = computed(() => editor.draft.value.title || (editor.isNew.value ? '创建一则新的校园公告' : '公告详情'))
const updatedDetail = computed(() => editor.announcement.value?.updatedAt ? `最后更新于 ${formatCompactDate(editor.announcement.value.updatedAt)}` : '')

onMounted(editor.load)
watch(announcementId, (next, previous) => { if (next !== previous) void editor.load() })

async function runSubmit(intent: EditorIntent): Promise<void> {
  const wasNew = editor.isNew.value
  const result = await editor.submit(intent)
  if (!result) return
  if (intent === 'SAVE_DRAFT') {
    toast.add({ title: wasNew ? '草稿已创建' : '草稿已保存', description: '内容仍只对运营人员可见。', color: 'success' })
    if (wasNew) await router.replace({ name: 'ops-announcement-edit', params: { id: result.id } })
    return
  }
  if (intent === 'PUBLISH') {
    toast.add({ title: '公告已发布', description: '学生端现在可以查看该公告。', color: 'success' })
    await router.push({ name: 'ops-activities', query: { tab: 'announcements' } })
    return
  }
  toast.add({ title: '更新已保存', description: '修改已立即对学生端生效。', color: 'success' })
}

function submitPrimary(): void { const intent = editor.primaryIntent.value; if (intent) void runSubmit(intent) }
function saveDraft(): void { void runSubmit('SAVE_DRAFT') }

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
function backToList(): void { void router.push({ name: 'ops-activities', query: { tab: 'announcements' } }) }
async function discardAndLeave(): Promise<void> {
  const target = pendingPath.value ?? '/ops/activities?tab=announcements'
  allowLeave = true
  try { await router.push(target) } finally { allowLeave = false; pendingPath.value = null }
}
</script>

<template>
  <EditorTaskShell
    :title="editor.isNew.value ? '新建公告' : '编辑公告'"
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
        <div v-if="editor.conflictNotice.value" class="rounded-surface border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning" role="status">
          {{ editor.conflictNotice.value }}
        </div>
      </div>
    </template>
    <template #form>
      <AnnouncementEditorForm v-model="editor.draft.value" :errors="editor.errors.value" :disabled="!editor.canEdit.value || editor.isSubmitting.value" />
    </template>
    <template #preview>
      <article>
        <p class="text-xs font-medium text-primary-600 dark:text-primary-400">
          {{ editor.draft.value.publisherScope === 'PLATFORM' ? '平台发布' : editor.draft.value.publisherScope === 'ACADEMY' ? '学院发布' : '学校发布' }}
        </p>
        <h2 class="mt-2 text-xl font-bold text-highlighted">{{ editor.draft.value.title || '公告标题' }}</h2>
        <p v-if="editor.draft.value.summary" class="mt-3 border-l-2 border-primary-500 pl-3 text-sm text-toned">{{ editor.draft.value.summary }}</p>
        <RichContent class="mt-6" :content="editor.draft.value.bodyMd || '在左侧填写正文后，这里会显示学生端阅读效果。'" />
        <dl v-if="editor.draft.value.sourceName || editor.draft.value.externalUrl || editor.draft.value.relation" class="mt-6 space-y-2 border-t border-default pt-4 text-sm">
          <div v-if="editor.draft.value.sourceName"><dt class="text-muted">信息来源</dt><dd>{{ editor.draft.value.sourceName }}</dd></div>
          <div v-if="editor.draft.value.relation"><dt class="text-muted">关联内容</dt><dd>{{ editor.draft.value.relation.title }}</dd></div>
          <div v-if="editor.draft.value.externalUrl"><dt class="text-muted">原文链接</dt><dd class="break-all">{{ editor.draft.value.externalUrl }}</dd></div>
        </dl>
      </article>
    </template>
    <template v-if="editor.canSaveDraft.value" #secondary-actions>
      <UButton type="button" color="neutral" variant="outline" icon="i-lucide-save" @click="saveDraft">保存草稿</UButton>
    </template>
  </EditorTaskShell>
  <UnsavedChangesDialog v-model:open="unsavedDialogOpen" @cancel="pendingPath = null" @confirm="discardAndLeave" />
</template>
