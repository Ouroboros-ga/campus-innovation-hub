<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listOpsRecruitmentApplications, type OpsRecruitmentApplication } from '@/features/ops/api/opsRecruitmentApi'
import { AppError } from '@/shared/http/types'
import { formatCompactDate } from '@/shared/lib/date'

const route = useRoute()
const router = useRouter()
const items = ref<OpsRecruitmentApplication[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const q = ref((route.query.q as string) ?? '')
const status = ref((route.query.status as string) ?? 'ALL')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '待审', value: 'PENDING' },
  { label: '已通过', value: 'ACCEPTED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已撤回', value: 'WITHDRAWN' }
]

function syncFromRoute() {
  q.value = (route.query.q as string) ?? ''
  status.value = (route.query.status as string) ?? 'ALL'
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(over: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const qq = over.q !== undefined ? over.q : q.value
  const st = over.status !== undefined ? over.status : status.value
  const p = resetPage ? '1' : (over.page !== undefined ? over.page : String(page.value))
  if (qq) next.q = qq
  if (st && st !== 'ALL') next.status = st
  if (Number(p) > 1) next.page = p
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listOpsRecruitmentApplications({
      q: q.value || undefined,
      status: status.value === 'ALL' ? undefined : status.value,
      page: page.value,
      pageSize
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    error.value = e instanceof AppError ? e.message : '加载失败'
  } finally { loading.value = false }
}

watch(() => route.query, () => { syncFromRoute(); load() })
onMounted(() => { syncFromRoute(); load() })

function onSearch() { pushRoute({}, true) }
function onFilter() { pushRoute({}, true) }
function onPage(p: number) { pushRoute({ page: String(p) }) }
function onReset() { q.value=''; status.value='ALL'; router.replace({query:{}}) }
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">招新审核</h2>
        <p class="text-sm text-muted">全平台只读聚合（运营查看，审核在组织侧）</p>
      </div>
      <UButton color="neutral" variant="ghost" size="xs" icon="i-lucide-rotate-ccw" @click="onReset">重置</UButton>
    </div>

    <div class="flex flex-wrap gap-2 rounded-lg border border-default bg-default p-3">
      <UInput v-model="q" placeholder="搜申请人/招新/组织" icon="i-lucide-search" size="sm" class="w-64" @keyup.enter="onSearch" />
      <USelect v-model="status" :items="statusOptions" size="sm" class="w-36" @update:model-value="onFilter" />
      <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-search" @click="onSearch">搜索</UButton>
    </div>

    <p v-if="error" class="text-sm text-danger-600">{{ error }}</p>
    <div v-if="loading" class="py-10 text-center text-sm text-muted">正在加载…</div>
    <div v-else class="overflow-x-auto rounded-lg border border-default bg-default">
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-xs text-muted">
          <tr>
            <th class="px-3 py-2 text-left font-medium">申请人</th>
            <th class="px-3 py-2 text-left font-medium">组织</th>
            <th class="px-3 py-2 text-left font-medium">招新</th>
            <th class="px-3 py-2 text-left font-medium">岗位</th>
            <th class="px-3 py-2 text-left font-medium">状态</th>
            <th class="px-3 py-2 text-left font-medium">申请时间</th>
            <th class="px-3 py-2 text-left font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="it in items" :key="it.id" class="hover:bg-muted/20">
            <td class="px-3 py-2"><p class="font-medium">{{ it.applicantName }}</p><p class="text-xs text-muted">{{ it.applicantUsername }}</p></td>
            <td class="px-3 py-2 text-xs">{{ it.organizationName }}</td>
            <td class="px-3 py-2 text-xs max-w-[200px] truncate">{{ it.recruitmentTitle }}</td>
            <td class="px-3 py-2 text-xs">{{ it.positionName ?? '—' }}</td>
            <td class="px-3 py-2"><UBadge :color="it.status==='PENDING'?'warning':it.status==='ACCEPTED'?'success':it.status==='REJECTED'?'error':'neutral'" variant="soft" size="xs">{{ it.status==='PENDING'?'待审':it.status==='ACCEPTED'?'已通过':it.status==='REJECTED'?'已拒绝':'已撤回' }}</UBadge></td>
            <td class="px-3 py-2 text-xs text-muted">{{ formatCompactDate(it.createdAt) }}</td>
            <td class="px-3 py-2"><UButton :to="it.managePath" size="xs" variant="ghost" color="neutral">去审核</UButton></td>
          </tr>
          <tr v-if="!items.length"><td colspan="7" class="py-10 text-center text-sm text-muted">暂无申请</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between text-xs text-muted"><span>共 {{ total }} 条</span><UPagination v-if="total>pageSize" :page="page" :total="total" :items-per-page="pageSize" @update:page="onPage" /></div>
  </div>
</template>
