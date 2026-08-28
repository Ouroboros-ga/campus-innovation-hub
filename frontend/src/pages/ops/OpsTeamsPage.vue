<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { closeOpsTeam, listOpsTeams, type OpsTeam } from '@/features/ops/api/opsTeamApi'
import { formatCompactDate } from '@/shared/lib/date'
import { AppError } from '@/shared/http/types'

const route = useRoute()
const router = useRouter()

const teams = ref<OpsTeam[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const q = ref((route.query.q as string) ?? '')
const postType = ref((route.query.post_type as string) ?? 'ALL')
const status = ref((route.query.status as string) ?? 'ALL')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20

function syncFromRoute() {
  q.value = (route.query.q as string) ?? ''
  postType.value = (route.query.post_type as string) ?? 'ALL'
  status.value = (route.query.status as string) ?? 'ALL'
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const qq = overrides.q !== undefined ? overrides.q : q.value
  const pt = overrides.post_type !== undefined ? overrides.post_type : postType.value
  const st = overrides.status !== undefined ? overrides.status : status.value
  const p = resetPage ? '1' : (overrides.page !== undefined ? overrides.page : String(page.value))
  if (qq) next.q = qq
  if (pt && pt !== 'ALL') next.post_type = pt
  if (st && st !== 'ALL') next.status = st
  if (Number(p) > 1) next.page = String(p)
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listOpsTeams({
      q: q.value || undefined,
      postType: postType.value === 'ALL' ? undefined : postType.value,
      status: status.value === 'ALL' ? undefined : status.value,
      page: page.value,
      pageSize
    })
    teams.value = res.items
    total.value = res.total
  } catch (err) {
    error.value = err instanceof AppError ? err.message : '组队列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => { syncFromRoute(); load() })
onMounted(() => { syncFromRoute(); load() })

function onSearch() { pushRoute({}, true) }
function onFilterChange() { pushRoute({}, true) }
function onPageChange(p: number) { pushRoute({ page: String(p) }) }
function onReset() { q.value = ''; postType.value = 'ALL'; status.value = 'ALL'; page.value = 1; router.replace({ query: {} }) }

async function onClose(team: OpsTeam) {
  try {
    await closeOpsTeam(team.id)
    load()
  } catch (err) {
    error.value = err instanceof AppError ? err.message : '关闭失败，请稍后重试。'
  }
}

const postTypeOptions = [
  { label: '全部类型', value: 'ALL' },
  { label: '队伍招募', value: 'TEAM_RECRUITING' },
  { label: '个人找队', value: 'PERSON_LOOKING' }
]
const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '招募中', value: 'RECRUITING' },
  { label: '已满员', value: 'FULL' },
  { label: '已关闭', value: 'CLOSED' }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          组队管理
        </h2>
        <p class="text-sm text-muted">
          管理组队广场发布、招募状态与举报处理
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        @click="onReset"
      >
        重置
      </UButton>
    </div>

    <div class="flex flex-wrap gap-2 rounded-lg border border-default bg-default p-3">
      <UInput
        v-model="q"
        placeholder="搜索标题、方向、队伍名"
        icon="i-lucide-search"
        size="sm"
        class="w-64"
        @keyup.enter="onSearch"
      />
      <USelect
        v-model="postType"
        :items="postTypeOptions"
        size="sm"
        class="w-36"
        @update:model-value="onFilterChange"
      />
      <USelect
        v-model="status"
        :items="statusOptions"
        size="sm"
        class="w-32"
        @update:model-value="onFilterChange"
      />
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-search"
        @click="onSearch"
      >
        搜索
      </UButton>
    </div>

    <p
      v-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>

    <div
      v-if="loading"
      class="py-10 text-center text-sm text-muted"
    >
      正在加载…
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-lg border border-default bg-default"
    >
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-xs text-muted">
          <tr>
            <th class="px-3 py-2 text-left font-normal">
              标题
            </th>
            <th class="px-3 py-2 text-left font-normal">
              竞赛
            </th>
            <th class="px-3 py-2 text-left font-normal">
              类型
            </th>
            <th class="px-3 py-2 text-left font-normal">
              状态
            </th>
            <th class="px-3 py-2 text-left font-normal">
              人数
            </th>
            <th class="px-3 py-2 text-left font-normal">
              发布者
            </th>
            <th class="px-3 py-2 text-left font-normal">
              创建时间
            </th>
            <th class="px-3 py-2 text-left font-normal">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="team in teams"
            :key="team.id"
            class="hover:bg-muted/30"
          >
            <td class="max-w-[240px] px-3 py-2">
              <p class="truncate font-medium text-highlighted">
                {{ team.title }}
              </p>
              <p class="truncate text-xs text-muted">
                {{ team.direction }}
              </p>
            </td>
            <td class="px-3 py-2 text-xs">
              {{ team.competitionName }}
            </td>
            <td class="px-3 py-2">
              <UBadge
                size="xs"
                variant="soft"
                :color="team.postType==='TEAM_RECRUITING'?'info':'success'"
              >
                {{ team.postType==='TEAM_RECRUITING'?'队伍招募':'个人找队' }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <UBadge
                size="xs"
                variant="soft"
                :color="team.status==='RECRUITING'?'success':team.status==='FULL'?'warning':'neutral'"
              >
                {{ team.status==='RECRUITING'?'招募中':team.status==='FULL'?'已满员':'已关闭' }}
              </UBadge>
            </td>
            <td class="px-3 py-2 tabular-nums">
              {{ team.currentMemberCount }}/{{ team.targetMemberCount }}
            </td>
            <td class="px-3 py-2 text-xs">
              {{ team.authorName }}
            </td>
            <td class="px-3 py-2 text-xs text-muted">
              {{ formatCompactDate(team.createdAt) }}
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :to="team.detailPath"
                >
                  查看
                </UButton>
                <UButton
                  v-if="team.status==='RECRUITING'"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="onClose(team)"
                >
                  关闭
                </UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!teams.length">
            <td
              colspan="8"
              class="py-10 text-center text-sm text-muted"
            >
              暂无符合条件的组队
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-xs text-muted">
      <span>共 {{ total }} 条</span>
      <UPagination
        v-if="total > pageSize"
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>
