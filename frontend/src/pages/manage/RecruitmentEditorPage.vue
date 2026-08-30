<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import RecruitmentEditorForm from '@/features/organizations/editor/RecruitmentEditorForm.vue'
import { useRecruitmentEditor } from '@/features/organizations/editor/useRecruitmentEditor'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import type { EditorIntent } from '@/shared/types/editor'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const organizationId = computed(() => String(route.params.organizationId ?? ''))
const recruitmentId = computed(() => typeof route.params.recruitmentId === 'string' ? route.params.recruitmentId : undefined)
const editor = useRecruitmentEditor(organizationId, recruitmentId)
const loadError = computed(() => !editor.isNew.value && editor.phase.value === 'FAILED' && !editor.recruitment.value ? editor.formError.value : null)

onMounted(editor.load)
watch(recruitmentId, (next, previous) => { if (next !== previous) void editor.load() })
async function runSubmit(intent: EditorIntent): Promise<void> {
  const wasNew = editor.isNew.value
  const result = await editor.submit(intent)
  if (!result) return
  if (intent === 'SAVE_DRAFT') {
    toast.add({ title: wasNew ? '草稿已创建' : '草稿已保存', color: 'success' })
    if (wasNew) await router.replace({ name: 'org-manage-recruitment-edit', params: { organizationId: organizationId.value, recruitmentId: result.id } })
    return
  }
  if (intent === 'PUBLISH') {
    toast.add({ title: '招新已发布', description: '学生端现在可以提交申请。', color: 'success' })
    await router.push({ name: 'org-manage-recruitments', params: { organizationId: organizationId.value } })
    return
  }
  toast.add({ title: '更新已保存', description: '修改已立即对学生端生效。', color: 'success' })
}
function backToList(): void { void router.push({ name: 'org-manage-recruitments', params: { organizationId: organizationId.value } }) }
function primary(): void { if (editor.primaryIntent.value) void runSubmit(editor.primaryIntent.value) }
function saveDraft(): void { void runSubmit('SAVE_DRAFT') }
const unsavedDialogOpen = ref(false)
const pendingPath = ref<string | null>(null)
let allowLeave = false
function guardUnsavedChanges(to: { fullPath: string }): boolean { if (allowLeave || !editor.isDirty.value) return true; pendingPath.value = to.fullPath; unsavedDialogOpen.value = true; return false }
onBeforeRouteLeave(guardUnsavedChanges)
onBeforeRouteUpdate(guardUnsavedChanges)
async function discardAndLeave(): Promise<void> { const target = pendingPath.value ?? `/manage/organizations/${organizationId.value}/recruitments`; allowLeave = true; try { await router.push(target) } finally { allowLeave = false; pendingPath.value = null } }
</script>

<template>
  <EditorTaskShell
    :title="editor.isNew.value ? '新建招新' : '编辑招新'"
    :subtitle="editor.draft.value.title || (editor.isNew.value ? '创建组织招新与岗位' : '招新详情')"
    back-label="返回招新列表"
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
    @primary="primary"
    @retry="editor.load"
  >
    <template #status><EditorStatusBanner :status-label="editor.statusLabel.value" :impact="editor.impact.value" :tone="editor.recruitment.value?.publicationState === 'PUBLISHED' ? 'success' : 'neutral'" /></template>
    <template #form><RecruitmentEditorForm v-model="editor.draft.value" :errors="editor.errors.value" :disabled="!editor.canEdit.value || editor.isSubmitting.value" /></template>
    <template #preview><article><h2 class="text-xl font-bold text-highlighted">{{ editor.draft.value.title || '招新标题' }}</h2><p class="mt-3 text-sm text-toned">截止时间：{{ editor.draft.value.applyEndAt || '待设置' }}</p><RichContent class="mt-6" :content="editor.draft.value.introMd || '在左侧填写招新介绍后，这里会显示学生端阅读效果。'" /><section class="mt-6"><h3 class="font-semibold text-highlighted">开放岗位</h3><ul class="mt-3 space-y-2"><li v-for="position in editor.draft.value.positions" :key="position.id ?? position.name" class="rounded-surface border border-default p-3 text-sm"><p class="font-medium">{{ position.name || '未命名岗位' }} · {{ position.headcount }} 人</p><p v-if="position.requirementsMd" class="mt-1 text-muted">{{ position.requirementsMd }}</p></li></ul></section></article></template>
    <template v-if="editor.canSaveDraft.value" #secondary-actions><UButton type="button" color="neutral" variant="outline" icon="i-lucide-save" @click="saveDraft">保存草稿</UButton></template>
  </EditorTaskShell>
  <UnsavedChangesDialog v-model:open="unsavedDialogOpen" @cancel="pendingPath = null" @confirm="discardAndLeave" />
</template>
