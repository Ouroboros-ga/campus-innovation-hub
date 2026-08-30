<script setup lang="ts">
import { ref } from 'vue'

import ConsultationReplyComposer from './ConsultationReplyComposer.vue'
import { consultationCategoryLabel, consultationStatusLabel, consultationVisibilityLabel, type ConsultationDetail as Detail } from './types'
import ActionConfirmDialog from '@/shared/components/management/ActionConfirmDialog.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { formatDateTimeCompact } from '@/shared/lib/date'

withDefaults(defineProps<{ consultation: Detail | null; loading?: boolean; error?: string | null; actionError?: string | null; actionPending?: boolean }>(), { loading: false, error: null, actionError: null, actionPending: false })
const emit = defineEmits<{ retry: []; reply: [bodyMd: string]; close: [] }>()
const closeDialogOpen = ref(false)

function requestClose(): void {
  closeDialogOpen.value = true
}

function confirmClose(): void {
  emit('close')
}
</script>

<template>
  <section class="min-h-0 rounded-surface border border-default bg-default p-5 sm:p-6">
    <p v-if="loading" class="text-sm text-muted">正在加载咨询详情…</p>
    <div v-else-if="error" role="alert"><p class="text-sm text-error">{{ error }}</p><UButton class="mt-3" color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" @click="emit('retry')">重新加载</UButton></div>
    <p v-else-if="!consultation" class="text-sm text-muted">从左侧选择一条咨询，查看问题与完整答疑历史。</p>
    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="text-xl font-bold text-highlighted">{{ consultation.title }}</h2><p class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted"><span>{{ consultationCategoryLabel[consultation.category] }}</span><span>{{ consultationVisibilityLabel[consultation.visibility] }}</span><span>{{ consultationStatusLabel[consultation.status] }}</span></p></div><UButton v-if="consultation.allowedActions.includes('CLOSE')" color="neutral" variant="outline" icon="i-lucide-circle-x" :loading="actionPending" :disabled="actionPending" @click="requestClose">关闭咨询</UButton></div>
      <p class="mt-4 text-sm text-muted">提问人：{{ consultation.authorName }} · {{ formatDateTimeCompact(consultation.createdAt) }}</p>
      <p v-if="consultation.competition" class="mt-2 text-sm text-toned">关联竞赛：{{ consultation.competition.name }}</p>
      <RichContent class="mt-6" :content="consultation.bodyMd" />
      <section class="mt-8 border-t border-default pt-5"><h3 class="text-base font-semibold text-highlighted">正式回复历史</h3><p v-if="!consultation.replies.length" class="mt-3 text-sm text-muted">尚未有正式回复。</p><ol v-else class="mt-4 space-y-4"><li v-for="reply in consultation.replies" :key="reply.id" class="border-l-2 border-primary pl-4"><p class="text-sm font-medium text-highlighted">{{ reply.authorName }} <span class="font-normal text-muted">· {{ formatDateTimeCompact(reply.createdAt) }}</span></p><RichContent class="mt-2" :content="reply.bodyMd" /></li></ol></section>
      <p v-if="actionError" class="mt-5 text-sm text-error" role="alert">{{ actionError }}</p>
      <ConsultationReplyComposer v-if="consultation.allowedActions.includes('REPLY')" :submitting="actionPending" :error="actionError" :reset-key="consultation.replies.length" @submit="emit('reply', $event)" />
      <p v-else class="mt-6 rounded-surface bg-elevated p-4 text-sm text-muted">该咨询已关闭，历史记录保留，但不能继续追加回复。</p>
    </template>
  </section>
  <ActionConfirmDialog
    v-model:open="closeDialogOpen"
    title="关闭咨询"
    description="关闭后不能继续追加正式回复，且当前版本不支持重新打开。"
    confirm-label="确认关闭咨询"
    @confirm="confirmClose"
  />
</template>
