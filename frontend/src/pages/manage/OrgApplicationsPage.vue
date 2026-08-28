<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { formatCompactDate } from '@/shared/lib/date'
import { AppError } from '@/shared/http/types'
import {
  acceptManageApplication,
  listManageApplications,
  rejectManageApplication,
  type ManageApplication
} from '@/features/organizations/api/orgManageApi'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')

const applications = ref<ManageApplication[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const filter = ref((route.query.status as string) ?? 'ALL')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20

const stateColor: Record<string, 'neutral' | 'success' | 'warning' | 'info'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral'
}
const stateLabel: Record<string, string> = {
  PENDING: '待处理',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回'
}
const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'ACCEPTED', label: '已接受' },
  { value: 'REJECTED', label: '已拒绝' }
] as const

function syncFromRoute() {
  filter.value = (route.query.status as string) ?? 'ALL'
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const s = overrides.status !== undefined ? overrides.status : filter.value
  const p = resetPage ? '1' : (overrides.page !== undefined ? overrides.page : String(page.value))
  if (s && s !== 'ALL') next.status = s
  if (Number(p) > 1) next.page = String(p)
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listManageApplications(orgId, {
      status: filter.value === 'ALL' ? undefined : filter.value,
      page: page.value,
      pageSize
    })
    applications.value = res.items
    total.value = res.total
  } catch (err) {
    error.value = err instanceof AppError ? err.message : '申请列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => { syncFromRoute(); load() })
onMounted(() => { syncFromRoute(); load() })

function onFilterChange() { pushRoute({}, true) }
function onPageChange(p: number) { pushRoute({ page: String(p) }) }
function onReset() { filter.value = 'ALL'; page.value = 1; router.replace({ query: {} }) }

async function decide(id: string, state: 'ACCEPTED' | 'REJECTED') {
  try {
    if (state === 'ACCEPTED') await acceptManageApplication(orgId, id)
    else await rejectManageApplication(orgId, id)
    toast.add({
      title: state === 'ACCEPTED' ? '已接受' : '已拒绝',
      description: state === 'ACCEPTED' ? '已创建成员身份并通知申请人。' : '已拒绝该申请。',
      color: state === 'ACCEPTED' ? 'success' : 'neutral',
      icon: state === 'ACCEPTED' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'
    })
    load()
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '操作失败，请稍后重试。'
    // 容量已满 409、重复申请、窗口关闭等后端口径直接透出
    toast.add({ title: '操作失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-highlighted">
        申请管理
      </h2>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-rotate-ccw"
        @click="onReset"
      >
        重置
      </UButton>
    </div>

    <div
      role="group"
      aria-label="申请状态筛选"
      class="flex flex-wrap gap-2"
    >
      <UButton
        v-for="item in filters"
        :key="item.value"
        size="sm"
        color="neutral"
        :variant="filter === item.value ? 'solid' : 'outline'"
        :aria-pressed="filter === item.value"
        @click="filter = item.value; onFilterChange()"
      >
        {{ item.label }}
      </UButton>
    </div>

    <div
      v-if="loading"
      class="py-10 text-center text-sm text-muted"
    >
      正在加载…
    </div>
    <p
      v-else-if="error"
      class="py-10 text-center text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>
    <ul
      v-else-if="applications.length"
      class="space-y-3"
    >
      <li
        v-for="application in applications"
        :key="application.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ application.applicantName }}
              <span class="font-normal text-muted">申请 {{ application.positionName }}</span>
            </p>
            <p class="mt-1 text-xs text-muted">
              岗位ID：{{ application.positionId.slice(0, 8) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="stateColor[application.status] ?? 'neutral'"
          >
            {{ stateLabel[application.status] ?? application.status }}
          </UBadge>
        </div>

        <p class="mt-2 text-xs leading-5 text-toned">
          简介：{{ application.selfIntro }}<span v-if="application.skills"> · 技能：{{ application.skills }}</span>
        </p>
        <p class="mt-1 text-xs text-muted">
          提交于 {{ formatCompactDate(application.createdAt) }}
        </p>

        <div
          v-if="application.status === 'PENDING'"
          class="mt-3 flex gap-2"
        >
          <UButton
            size="sm"
            color="success"
            variant="solid"
            icon="i-lucide-check"
            @click="decide(application.id, 'ACCEPTED')"
          >
            接受
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-x"
            @click="decide(application.id, 'REJECTED')"
          >
            拒绝
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无符合条件的申请。
    </p>

    <div
      v-if="!loading && !error && total > pageSize"
      class="flex justify-center"
    >
      <UPagination
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        @update:page="onPageChange"
      />
    </div>
    <p
      v-if="!loading && !error"
      class="text-center text-xs text-muted"
    >
      共 {{ total }} 条
    </p>
  </div>
</template>
