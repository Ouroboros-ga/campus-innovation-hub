<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import ConsultationDetail from '@/features/ops/consultations/ConsultationDetail.vue'
import ConsultationQueue from '@/features/ops/consultations/ConsultationQueue.vue'
import { consultationCategoryLabel, type ConsultationCategory, type ConsultationStatus, type ConsultationVisibility } from '@/features/ops/consultations/types'
import { useConsultationWorkbench } from '@/features/ops/consultations/useConsultationWorkbench'
import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import ManagementFilterBar from '@/shared/components/management/ManagementFilterBar.vue'
import ManagementPageHeader from '@/shared/components/management/ManagementPageHeader.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const workbench = useConsultationWorkbench()
const { isPhone } = useBreakpoint()
const pageSize = 20
const selectedId = ref(typeof route.query.selected === 'string' ? route.query.selected : '')
const query = computed(() => ({
  q: typeof route.query.q === 'string' ? route.query.q : undefined,
  status: typeof route.query.status === 'string' ? route.query.status as ConsultationStatus : undefined,
  visibility: typeof route.query.visibility === 'string' ? route.query.visibility as ConsultationVisibility : undefined,
  category: typeof route.query.category === 'string' ? route.query.category as ConsultationCategory : undefined,
  page: Math.max(1, Number(route.query.page ?? 1) || 1), pageSize
}))
const search = ref(query.value.q ?? '')

async function pushQuery(overrides: Record<string, string | undefined> = {}, resetPage = false): Promise<void> {
  const next: Record<string, string> = {}
  const values = { q: search.value || undefined, status: query.value.status, visibility: query.value.visibility, category: query.value.category, page: String(query.value.page), ...overrides }
  if (values.q) next.q = values.q
  if (values.status) next.status = values.status
  if (values.visibility) next.visibility = values.visibility
  if (values.category) next.category = values.category
  const page = resetPage ? 1 : Number(values.page)
  if (page > 1) next.page = String(page)
  if (selectedId.value) next.selected = selectedId.value
  await router.replace({ query: next })
}
async function refreshQueue(): Promise<void> { await workbench.loadQueue(query.value) }
async function select(id: string): Promise<void> {
  if (isPhone.value) {
    await router.push({ name: 'ops-consultation-task', params: { id } })
    return
  }
  const alreadySelected = selectedId.value === id && route.query.selected === id
  selectedId.value = id
  if (alreadySelected) await workbench.loadDetail(id)
  else await pushQuery()
}
async function retryDetail(): Promise<void> { if (selectedId.value) await workbench.loadDetail(selectedId.value) }
async function sendReply(bodyMd: string): Promise<void> { if (await workbench.sendReply(bodyMd)) { toast.add({ title: '正式回复已发送', color: 'success' }); await refreshQueue() } }
async function closeCurrent(): Promise<void> { if (await workbench.closeCurrent()) { toast.add({ title: '咨询已关闭', color: 'success' }); await refreshQueue() } }
function reset(): void { selectedId.value = ''; search.value = ''; void router.replace({ query: {} }) }

watch(() => route.query, async () => {
  search.value = query.value.q ?? ''
  selectedId.value = typeof route.query.selected === 'string' ? route.query.selected : ''
  await refreshQueue()
  if (selectedId.value && selectedId.value !== workbench.detail.value?.id) await workbench.loadDetail(selectedId.value)
})
onMounted(async () => { await refreshQueue(); if (selectedId.value) await workbench.loadDetail(selectedId.value) })
</script>

<template>
  <div class="space-y-5">
    <ManagementPageHeader title="咨询答疑工作台" description="处理学生咨询、保留完整回复记录，并在处理完成后关闭事项。"><template #actions><UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="reset">重置筛选</UButton></template></ManagementPageHeader>
    <ManagementFilterBar><div class="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4"><UInput v-model="search" placeholder="搜索标题或正文" icon="i-lucide-search" @keyup.enter="pushQuery({}, true)" /><USelect :model-value="query.status ?? 'ALL'" :items="[{ label: '全部状态', value: 'ALL' }, { label: '待回复', value: 'OPEN' }, { label: '已回复', value: 'ANSWERED' }, { label: '已关闭', value: 'CLOSED' }]" @update:model-value="pushQuery({ status: $event === 'ALL' ? undefined : $event }, true)" /><USelect :model-value="query.visibility ?? 'ALL'" :items="[{ label: '全部可见性', value: 'ALL' }, { label: '公开咨询', value: 'PUBLIC' }, { label: '私密咨询', value: 'PRIVATE' }]" @update:model-value="pushQuery({ visibility: $event === 'ALL' ? undefined : $event }, true)" /><USelect :model-value="query.category ?? 'ALL'" :items="[{ label: '全部分类', value: 'ALL' }, ...Object.entries(consultationCategoryLabel).map(([value, label]) => ({ value, label }))]" @update:model-value="pushQuery({ category: $event === 'ALL' ? undefined : $event }, true)" /></div></ManagementFilterBar>
    <div class="grid min-h-[36rem] gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]"><ConsultationQueue :items="workbench.items.value" :selected-id="selectedId" :loading="workbench.queueLoading.value" :error="workbench.queueError.value" @select="select" @retry="refreshQueue" /><div class="min-w-0"><div class="mb-3 flex justify-end"><UButton v-if="selectedId" :to="{ name: 'ops-consultation-task', params: { id: selectedId } }" color="neutral" variant="ghost" size="sm" icon="i-lucide-external-link">在独立页处理</UButton></div><ConsultationDetail :consultation="workbench.detail.value" :loading="workbench.detailLoading.value" :error="workbench.detailError.value" :action-error="workbench.actionError.value" :action-pending="workbench.actionPending.value" @retry="retryDetail" @reply="sendReply" @close="closeCurrent" /></div></div>
    <div v-if="!workbench.queueLoading.value && !workbench.queueError.value && workbench.total.value > pageSize" class="flex justify-center"><UPagination :page="query.page" :total="workbench.total.value" :items-per-page="pageSize" @update:page="pushQuery({ page: String($event) })" /></div>
  </div>
</template>
