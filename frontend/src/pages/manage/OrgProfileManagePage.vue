<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import OrganizationProfileForm from '@/features/organizations/editor/OrganizationProfileForm.vue'
import { useOrganizationProfileEditor } from '@/features/organizations/editor/useOrganizationProfileEditor'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const organizationId = computed(() => String(route.params.organizationId ?? ''))
const editor = useOrganizationProfileEditor(organizationId)
const loadError = computed(() => editor.phase.value === 'FAILED' && !editor.profile.value ? editor.formError.value : null)

onMounted(editor.load)
watch(organizationId, () => void editor.load())
async function save(): Promise<void> {
  const result = await editor.save()
  if (result) toast.add({ title: '资料已保存', description: '组织公开资料已更新。', color: 'success' })
}
function backToOrganization(): void { void router.push(`/organizations/${organizationId.value}`) }

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
  const target = pendingPath.value ?? `/organizations/${organizationId.value}`
  allowLeave = true
  try { await router.push(target) } finally { allowLeave = false; pendingPath.value = null }
}
</script>

<template>
  <EditorTaskShell
    title="组织资料"
    :subtitle="editor.profile.value?.name ?? '维护组织公开资料'"
    back-label="返回组织主页"
    primary-label="保存资料"
    primary-icon="i-lucide-save"
    :primary-visible="true"
    :primary-disabled="editor.isSubmitting.value"
    :submitting="editor.isSubmitting.value"
    :loading="editor.isLoading.value"
    :load-error="loadError"
    :form-error="loadError ? null : editor.formError.value"
    preview-title="组织页预览"
    @back="backToOrganization"
    @primary="save"
    @retry="editor.load"
  >
    <template #status><EditorStatusBanner status-label="组织资料" impact="保存后将更新组织公开页面；不存在草稿或发布状态。" tone="neutral" /></template>
    <template #form><OrganizationProfileForm v-model="editor.draft.value" :errors="editor.errors.value" :disabled="editor.isSubmitting.value" /></template>
    <template #preview>
      <article>
        <img v-if="editor.draft.value.banner?.src" :src="editor.draft.value.banner.src" :alt="editor.draft.value.banner.alt" class="mb-5 aspect-video w-full rounded-surface object-cover" >
        <h2 class="text-xl font-bold text-highlighted">{{ editor.profile.value?.name ?? '组织名称' }}</h2>
        <p v-if="editor.draft.value.shortIntro" class="mt-2 text-sm text-toned">{{ editor.draft.value.shortIntro }}</p>
        <RichContent class="mt-6" :content="editor.draft.value.descriptionMd || '在左侧填写组织介绍后，这里会显示公开页面效果。'" />
        <p v-if="editor.draft.value.publicContact" class="mt-5 text-sm text-toned">联系：{{ editor.draft.value.publicContact }}</p>
      </article>
    </template>
  </EditorTaskShell>
  <UnsavedChangesDialog v-model:open="unsavedDialogOpen" @cancel="pendingPath = null" @confirm="discardAndLeave" />
</template>
