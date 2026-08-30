<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import {
  archiveManageRecruitment,
  cancelManageRecruitment,
  completeManageRecruitment,
  listManageRecruitments,
  publishManageRecruitment,
  type ManageRecruitment
} from '@/features/organizations/api/orgManageApi'
import { formatCompactDate } from '@/shared/lib/date'
import { AppError } from '@/shared/http/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const orgId = computed(() => String(route.params.organizationId ?? ''))

const recruitments = ref<ManageRecruitment[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const status = ref((route.query.status as string) ?? 'ALL')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20

const statusMeta: Record<string, { label: string; color: 'neutral' | 'info' | 'warning' }> = {
  DRAFT: { label: '草稿', color: 'neutral' },
  PUBLISHED: { label: '已发布', color: 'info' },
  CANCELLED: { label: '已取消', color: 'warning' },
  ARCHIVED: { label: '已归档', color: 'neutral' },
  COMPLETED: { label: '已结束', color: 'neutral' }
}

function syncFromRoute() {
  status.value = (route.query.status as string) ?? 'ALL'
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const s = overrides.status !== undefined ? overrides.status : status.value
  const p = resetPage ? '1' : (overrides.page !== undefined ? overrides.page : String(page.value))
  if (s && s !== 'ALL') next.status = s
  if (Number(p) > 1) next.page = String(p)
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listManageRecruitments(orgId.value, {
      status: status.value === 'ALL' ? undefined : status.value,
      page: page.value,
      pageSize
    })
    recruitments.value = res.items
    total.value = res.total
  } catch (err) {
    error.value = err instanceof AppError ? err.message : '招新列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch([() => route.params.organizationId, () => route.query], () => { syncFromRoute(); void load() })
onMounted(() => { syncFromRoute(); load() })

function onFilterChange() { pushRoute({}, true) }
function onPageChange(p: number) { pushRoute({ page: String(p) }) }
function onReset() { status.value = 'ALL'; page.value = 1; router.replace({ query: {} }) }

function openCreate() {
  void router.push({ name: 'org-manage-recruitment-new', params: { organizationId: orgId.value } })
}
function openEdit(recruitment: ManageRecruitment) {
  void router.push({ name: 'org-manage-recruitment-edit', params: { organizationId: orgId.value, recruitmentId: recruitment.id } })
}

async function publish(recruitment: ManageRecruitment) {
  try {
    await publishManageRecruitment(orgId.value, recruitment.id)
    toast.add({ title: '已发布', description: '该招新已发布。', color: 'success', icon: 'i-lucide-check-circle' })
    load()
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '发布失败，请稍后重试。'
    toast.add({ title: '发布失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

async function cancelRecruitment(recruitment: ManageRecruitment) {
  try {
    await cancelManageRecruitment(orgId.value, recruitment.id)
    toast.add({ title: '已结束', description: '该招新已停止。', color: 'neutral', icon: 'i-lucide-lock' })
    load()
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '操作失败，请稍后重试。'
    toast.add({ title: '操作失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

async function completeRecruitment(recruitment: ManageRecruitment) {
  try {
    await completeManageRecruitment(orgId.value, recruitment.id)
    toast.add({ title: '招新已完成', description: '该招新已结束并保留申请记录。', color: 'success', icon: 'i-lucide-check-circle' })
    load()
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '操作失败，请稍后重试。'
    toast.add({ title: '操作失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

async function archiveRecruitment(recruitment: ManageRecruitment) {
  try {
    await archiveManageRecruitment(orgId.value, recruitment.id)
    toast.add({ title: '已归档', description: '该招新已从日常管理列表归档。', color: 'neutral', icon: 'i-lucide-archive' })
    load()
  } catch (err) {
    const msg = err instanceof AppError ? err.message : '操作失败，请稍后重试。'
    toast.add({ title: '操作失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

function viewApplications() {
  void router.push({ name: 'org-manage-applications', params: { organizationId: orgId.value } })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-highlighted">
        招新管理
      </h2>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        新建招新
      </UButton>
    </div>

    <div class="flex flex-wrap gap-2">
      <USelect
        v-model="status"
        :items="[{label:'全部状态',value:'ALL'},{label:'草稿',value:'DRAFT'},{label:'已发布',value:'PUBLISHED'},{label:'已取消',value:'CANCELLED'},{label:'已归档',value:'ARCHIVED'}]"
        size="sm"
        class="w-36"
        @update:model-value="onFilterChange"
      />
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-rotate-ccw"
        @click="onReset"
      >
        重置
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
      v-else-if="recruitments.length"
      class="space-y-3"
    >
      <li
        v-for="recruitment in recruitments"
        :key="recruitment.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ recruitment.title }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ recruitment.applyStartAt ? formatCompactDate(recruitment.applyStartAt) + ' 开始 ·' : '' }}
              {{ formatCompactDate(recruitment.applyEndAt) }} 截止
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="statusMeta[recruitment.publicationState]?.color ?? 'neutral'"
          >
            {{ statusMeta[recruitment.publicationState]?.label ?? recruitment.publicationState }}
          </UBadge>
        </div>

        <div class="mt-2 text-xs text-muted">
          申请人数：待处理 {{ recruitment.applicationCounts.pending }} · 已接受 {{ recruitment.applicationCounts.accepted }}
          <span class="mx-1 text-border">·</span>
          岗位数：{{ recruitment.positions.length }}
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-pencil"
            v-if="recruitment.allowedActions.includes('EDIT')"
            @click="openEdit(recruitment)"
          >
            编辑
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-file-text"
            @click="viewApplications"
          >
            查看申请
          </UButton>
          <UButton
            v-if="recruitment.allowedActions.includes('PUBLISH')"
            size="sm"
            color="primary"
            variant="outline"
            icon="i-lucide-megaphone"
            @click="publish(recruitment)"
          >
            发布
          </UButton>
          <UButton
            v-if="recruitment.allowedActions.includes('CANCEL')"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-check"
            @click="cancelRecruitment(recruitment)"
          >
            结束
          </UButton>
          <UButton
            v-if="recruitment.allowedActions.includes('COMPLETE')"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-circle-check"
            @click="completeRecruitment(recruitment)"
          >
            完成
          </UButton>
          <UButton
            v-if="recruitment.allowedActions.includes('ARCHIVE')"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-archive"
            @click="archiveRecruitment(recruitment)"
          >
            归档
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无招新，点击「新建招新」创建。
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
