<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import ConsultationDetail from '@/features/ops/consultations/ConsultationDetail.vue'
import { useConsultationWorkbench } from '@/features/ops/consultations/useConsultationWorkbench'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = computed(() => String(route.params.id ?? ''))
const workbench = useConsultationWorkbench()
async function load(): Promise<void> { await workbench.loadDetail(id.value) }
async function sendReply(bodyMd: string): Promise<void> { if (await workbench.sendReply(bodyMd)) toast.add({ title: '正式回复已发送', color: 'success' }) }
async function closeCurrent(): Promise<void> { if (await workbench.closeCurrent()) toast.add({ title: '咨询已关闭', color: 'success' }) }
onMounted(load)
watch(id, (next, previous) => { if (next && next !== previous) void load() })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-4"><UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="router.push({ name: 'ops-questions' })">返回咨询队列</UButton><ConsultationDetail :consultation="workbench.detail.value" :loading="workbench.detailLoading.value" :error="workbench.detailError.value" :action-error="workbench.actionError.value" :action-pending="workbench.actionPending.value" @retry="load" @reply="sendReply" @close="closeCurrent" /></div>
</template>
