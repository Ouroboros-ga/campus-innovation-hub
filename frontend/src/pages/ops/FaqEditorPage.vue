<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import FaqEditorForm from '@/features/ops/faq/FaqEditorForm.vue'
import { useFaqEditor } from '@/features/ops/faq/useFaqEditor'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { formatCompactDate } from '@/shared/lib/date'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import type { EditorIntent } from '@/shared/types/editor'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const faqId = computed(() => typeof route.params.id === 'string' ? route.params.id : undefined)
const editor = useFaqEditor(faqId)

const loadError = computed(() =>
  !editor.isNew.value && editor.phase.value === 'FAILED' && !editor.faq.value
    ? editor.formError.value
    : null
)
const statusTone = computed(() => {
  if (editor.faq.value?.publicationState === 'PUBLISHED') return 'success' as const
  if (editor.faq.value?.publicationState === 'ARCHIVED') return 'warning' as const
  return 'neutral' as const
})
const subtitle = computed(() => editor.draft.value.question || (editor.isNew.value ? '创建一条新的常见问题' : 'FAQ 详情'))
const updatedDetail = computed(() => editor.faq.value?.updatedAt
  ? `最后更新于 ${formatCompactDate(editor.faq.value.updatedAt)}`
  : '')

onMounted(editor.load)
watch(faqId, (next, previous) => {
  if (next !== previous) void editor.load()
})

async function runSubmit(intent: EditorIntent): Promise<void> {
  const wasNew = editor.isNew.value
  const result = await editor.submit(intent)
  if (!result) return

  if (intent === 'SAVE_DRAFT') {
    toast.add({
      title: wasNew ? '草稿已创建' : '草稿已保存',
      description: '内容仍只对运营人员可见。',
      color: 'success'
    })
    if (wasNew) await router.replace({ name: 'ops-faq-edit', params: { id: result.id } })
    return
  }
  if (intent === 'PUBLISH') {
    toast.add({
      title: 'FAQ 已发布',
      description: '学生端现在可以查看这条常见问题。',
      color: 'success'
    })
    await router.push({ name: 'ops-faq' })
    return
  }
  toast.add({
    title: '更新已保存',
    description: '修改已立即对学生端生效。',
    color: 'success'
  })
}

function submitPrimary(): void {
  const intent = editor.primaryIntent.value
  if (intent) void runSubmit(intent)
}

function saveDraft(): void {
  void runSubmit('SAVE_DRAFT')
}

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

function backToList(): void {
  void router.push({ name: 'ops-faq' })
}

async function discardAndLeave(): Promise<void> {
  const target = pendingPath.value ?? '/ops/faq'
  allowLeave = true
  try {
    await router.push(target)
  } finally {
    allowLeave = false
    pendingPath.value = null
  }
}
</script>

<template>
  <EditorTaskShell
    :title="editor.isNew.value ? '新建 FAQ' : '编辑 FAQ'"
    :subtitle="subtitle"
    back-label="返回 FAQ 列表"
    :primary-label="editor.primaryLabel.value"
    :primary-icon="editor.primaryIntent.value === 'PUBLISH' ? 'i-lucide-send' : 'i-lucide-save'"
    :primary-visible="editor.primaryIntent.value !== null"
    :primary-disabled="editor.primaryDisabled.value"
    :submitting="editor.isSubmitting.value"
    :loading="editor.isLoading.value"
    :load-error="loadError"
    :form-error="loadError ? null : editor.formError.value"
    preview-title="学生端 FAQ 预览"
    @back="backToList"
    @primary="submitPrimary"
    @retry="editor.load"
  >
    <template #status>
      <div class="space-y-3">
        <EditorStatusBanner
          :status-label="editor.statusLabel.value"
          :impact="editor.impact.value"
          :detail="updatedDetail"
          :tone="statusTone"
        />
        <div
          v-if="editor.conflictNotice.value"
          class="rounded-surface border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
          role="status"
        >
          {{ editor.conflictNotice.value }}
        </div>
      </div>
    </template>

    <template #form>
      <FaqEditorForm
        v-model="editor.draft.value"
        :errors="editor.errors.value"
        :disabled="!editor.canEdit.value || editor.isSubmitting.value"
      />
    </template>

    <template #preview>
      <article>
        <p class="text-xs font-medium text-primary-600 dark:text-primary-400">
          {{ guideCategoryLabel[editor.draft.value.category] }}
        </p>
        <h2 class="mt-2 text-xl font-bold text-highlighted">
          {{ editor.draft.value.question || '常见问题' }}
        </h2>
        <RichContent
          class="mt-6"
          :content="editor.draft.value.answerMd || '在左侧填写答案后，这里会显示学生端阅读效果。'"
        />
      </article>
    </template>

    <template v-if="editor.canSaveDraft.value" #secondary-actions>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        icon="i-lucide-save"
        @click="saveDraft"
      >
        保存草稿
      </UButton>
    </template>
  </EditorTaskShell>

  <UnsavedChangesDialog
    v-model:open="unsavedDialogOpen"
    @cancel="pendingPath = null"
    @confirm="discardAndLeave"
  />
</template>
