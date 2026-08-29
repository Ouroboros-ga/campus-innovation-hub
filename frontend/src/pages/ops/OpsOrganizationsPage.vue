<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import OrganizationEditorModal from '@/features/ops/components/OrganizationEditorModal.vue'
import { listOpsOrganizations, type OpsOrganization } from '@/features/ops/api/opsOrganizationApi'
import { getOrganizationStats, type OrganizationStats } from '@/features/ops/api/opsOverviewApi'
import { formatCompactDate } from '@/shared/lib/date'
import { organizationTypeLabel } from '@/shared/lib/domain-labels'
import { useDebouncedValue } from '@/shared/composables/useDebouncedValue'

const route = useRoute()
const router = useRouter()

const stats = ref<OrganizationStats | null>(null)
const organizations = ref<OpsOrganization[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const query = ref((route.query.q as string) ?? '')
const orgType = ref((route.query.org_type as string) ?? 'ALL')
const recruiting = ref((route.query.recruiting as string) ?? 'ALL')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20
const editorOpen = ref(false)
const editingOrgId = ref<string | null>(null)

function syncFromRoute() {
  query.value = (route.query.q as string) ?? ''
  orgType.value = (route.query.org_type as string) ?? 'ALL'
  recruiting.value = (route.query.recruiting as string) ?? 'ALL'
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const q = overrides.q !== undefined ? overrides.q : query.value
  const t = overrides.org_type !== undefined ? overrides.org_type : orgType.value
  const r = overrides.recruiting !== undefined ? overrides.recruiting : recruiting.value
  const p = resetPage ? '1' : (overrides.page !== undefined ? overrides.page : String(page.value))
  if (q) next.q = q
  if (t && t !== 'ALL') next.org_type = t
  if (r && r !== 'ALL') next.recruiting = r
  if (Number(p) > 1) next.page = String(p)
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const results = await Promise.allSettled([
      getOrganizationStats(),
      listOpsOrganizations({
        q: query.value || undefined,
        organization_type: orgType.value === 'ALL' ? undefined : orgType.value,
        is_recruiting: recruiting.value === 'ALL' ? undefined : recruiting.value === 'RECRUITING',
        page: page.value,
        pageSize
      })
    ])
    const sRes = results[0]
    const listRes = results[1]
    if (listRes.status === 'fulfilled') {
      organizations.value = listRes.value.results
      total.value = listRes.value.count
    } else {
      throw listRes.reason
    }
    if (sRes.status === 'fulfilled') stats.value = sRes.value
  } catch {
    error.value = '组织列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => { syncFromRoute(); load() })

// 懒搜索：输入停顿 300ms 后自动写入 URL 触发加载
const debouncedQuery = useDebouncedValue(query, 300)
watch(debouncedQuery, () => pushRoute({}, true))

onMounted(() => { syncFromRoute(); load() })

function onFilterChange() { pushRoute({}, true) }
function onPageChange(p: number) { pushRoute({ page: String(p) }) }
function onReset() {
  query.value = ''; orgType.value = 'ALL'; recruiting.value = 'ALL'; page.value = 1
  router.replace({ query: {} })
}
function openCreate() { editingOrgId.value = null; editorOpen.value = true }
function openEdit(org: OpsOrganization) { editingOrgId.value = org.id; editorOpen.value = true }
function onEditorClose(open: boolean) { editorOpen.value = open; if (!open) editingOrgId.value = null }

const typeOptions = [
  { label: '组织类型', value: 'ALL' },
  { label: '学院部门', value: 'COLLEGE_DEPARTMENT' },
  { label: '学生社团', value: 'STUDENT_CLUB' },
  { label: '实验室', value: 'LABORATORY' },
  { label: '科创团队', value: 'INNOVATION_TEAM' },
  { label: '其他', value: 'OTHER' }
]
const recruitingOptions = [
  { label: '招新状态', value: 'ALL' },
  { label: '招新中', value: 'RECRUITING' },
  { label: '未招新', value: 'NOT' }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          社团组织管理
        </h2>
        <p class="text-sm text-muted">
          管理学院所有社团组织信息、招新状态与资料内容
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        新建组织
      </UButton>
    </div>

    <!-- 顶部统计 -->
    <div class="grid gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">
            全部组织
          </p>
          <span class="grid size-7 place-items-center rounded-full bg-primary-50 text-primary dark:bg-primary-950"><UIcon
            name="i-lucide-users"
            class="size-4"
          /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">
          {{ stats?.total ?? '-' }}
        </p>
      </div>
      <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">
            招新中
          </p>
          <span class="grid size-7 place-items-center rounded-full bg-success-50 text-success-600 dark:bg-success-950"><UIcon
            name="i-lucide-user-plus"
            class="size-4"
          /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">
          {{ stats?.recruiting ?? '-' }}
        </p>
      </div>
      <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">
            已暂停招新
          </p>
          <span class="grid size-7 place-items-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-950"><UIcon
            name="i-lucide-pause"
            class="size-4"
          /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">
          {{ stats?.not_recruiting ?? '-' }}
        </p>
      </div>
      <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">
            本月新增
          </p>
          <span class="grid size-7 place-items-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950"><UIcon
            name="i-lucide-sparkles"
            class="size-4"
          /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">
          {{ stats?.new_this_month ?? '-' }}
        </p>
        <p
          v-if="stats?.top_organization"
          class="truncate text-xs text-muted"
        >
          人气：{{ stats.top_organization.name }}
        </p>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex flex-wrap gap-2 rounded-xl border border-default bg-default p-5 shadow-sm">
      <UInput
        v-model="query"
        placeholder="搜索组织名称、简介、负责人..."
        icon="i-lucide-search"
        size="sm"
        class="w-64"
      />
      <USelect
        v-model="orgType"
        :items="typeOptions"
        size="sm"
        class="w-32"
        @update:model-value="onFilterChange"
      />
      <USelect
        v-model="recruiting"
        :items="recruitingOptions"
        size="sm"
        class="w-32"
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
      <UTooltip text="敬请期待">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-download"
          disabled
        >
          导出
        </UButton>
      </UTooltip>
    </div>

    <p
      v-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>

    <!-- 表：桌面 -->
    <div class="hidden overflow-x-auto rounded-lg border border-default bg-default md:block">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-xs text-muted">
          <tr>
            <th class="w-8 px-3 py-2">
              <UCheckbox />
            </th>
            <th class="px-3 py-2 text-left font-normal">
              组织信息
            </th>
            <th class="px-3 py-2 text-left font-normal">
              类型 / 分类
            </th>
            <th class="px-3 py-2 text-left font-normal">
              负责人
            </th>
            <th class="px-3 py-2 text-left font-normal">
              指导老师
            </th>
            <th class="px-3 py-2 text-left font-normal">
              招新状态
            </th>
            <th class="px-3 py-2 text-left font-normal">
              成员数
            </th>
            <th class="px-3 py-2 text-left font-normal">
              更新时间
            </th>
            <th class="px-3 py-2 text-left font-normal">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="loading">
            <td
              colspan="9"
              class="py-10 text-center text-sm text-muted"
            >
              正在加载…
            </td>
          </tr>
          <tr
            v-for="org in organizations"
            :key="org.id"
            class="hover:bg-muted/30"
          >
            <td class="px-3 py-2">
              <UCheckbox />
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-2">
                <img
                  v-if="org.logo?.url"
                  :src="org.logo.url"
                  :alt="org.name"
                  class="size-8 rounded-full object-cover"
                >
                <span
                  v-else
                  class="grid size-8 place-items-center rounded-full bg-muted"
                ><UIcon
                  name="i-lucide-building-2"
                  class="size-4 text-muted"
                /></span>
                <div class="min-w-0">
                  <p class="truncate font-medium text-highlighted">
                    {{ org.name }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    {{ org.short_intro ?? '—' }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-3 py-2">
              <UBadge
                size="xs"
                color="neutral"
                variant="soft"
              >
                {{ organizationTypeLabel[org.organization_type as keyof typeof organizationTypeLabel] ?? org.organization_type }}
              </UBadge>
            </td>
            <td class="px-3 py-2">
              <div
                v-if="org.leader"
                class="flex items-center gap-1.5"
              >
                <UAvatar
                  :src="org.leader.avatar?.url ?? undefined"
                  :alt="org.leader.display_name"
                  size="xs"
                />
                <span class="text-xs">{{ org.leader.display_name }}</span>
              </div>
              <span
                v-else
                class="text-xs text-muted"
              >—</span>
            </td>
            <td class="px-3 py-2">
              <div
                v-if="org.advisor"
                class="flex items-center gap-1.5"
              >
                <UAvatar
                  :src="org.advisor.avatar?.url ?? undefined"
                  :alt="org.advisor.display_name"
                  size="xs"
                />
                <span class="text-xs">{{ org.advisor.display_name }}</span>
              </div>
              <span
                v-else
                class="text-xs text-muted"
              >—</span>
            </td>
            <td class="px-3 py-2">
              <UBadge
                v-if="org.is_recruiting"
                size="xs"
                color="success"
                variant="soft"
              >
                招新中
              </UBadge>
              <UBadge
                v-else
                size="xs"
                color="warning"
                variant="soft"
              >
                暂停招新
              </UBadge>
              <p
                v-if="org.recruitment_end_at"
                class="text-xs text-muted"
              >
                截止 {{ formatCompactDate(org.recruitment_end_at) }}
              </p>
            </td>
            <td class="px-3 py-2 tabular-nums">
              {{ org.member_count }}
            </td>
            <td class="px-3 py-2 text-xs text-muted">
              {{ formatCompactDate(org.updated_at) }}
            </td>
            <td class="px-3 py-2">
              <div class="flex gap-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :to="`/organizations/${org.id}`"
                >
                  查看
                </UButton>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  @click="openEdit(org)"
                >
                  编辑
                </UButton>
                <UButton
                  size="xs"
                  color="primary"
                  variant="soft"
                  :to="`/manage/organizations/${org.id}`"
                >
                  Studio
                </UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !error && !organizations.length">
            <td
              colspan="9"
              class="py-10 text-center text-sm text-muted"
            >
              暂无组织
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phone 卡片 -->
    <div class="space-y-3 md:hidden">
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-28 rounded-lg" />
      </div>
      <p v-else-if="error" class="py-6 text-center text-sm text-danger-600">
        {{ error }}
        <UButton size="xs" variant="ghost" class="ml-2" @click="load">重试</UButton>
      </p>
      <UEmpty
        v-else-if="!organizations.length"
        icon="i-lucide-building-2"
        title="暂无组织"
        description="试试调整搜索或筛选"
      >
        <template #actions>
          <UButton size="sm" variant="ghost" @click="onReset">清除筛选</UButton>
        </template>
      </UEmpty>
      <div v-else class="space-y-3">
        <div
          v-for="org in organizations"
          :key="org.id"
          class="rounded-xl border border-default bg-default p-5 shadow-sm"
        >
          <div class="flex items-start gap-4">
            <img
              v-if="org.logo?.url"
              :src="org.logo.url"
              :alt="org.name"
              class="size-10 shrink-0 rounded-full object-cover"
            >
            <span
              v-else
              class="grid size-10 place-items-center rounded-full bg-muted"
            ><UIcon name="i-lucide-building-2" class="size-5 text-muted" /></span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-highlighted">{{ org.name }}</p>
              <p class="truncate text-xs text-muted">{{ org.short_intro ?? '—' }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <UBadge size="xs" variant="soft" color="neutral">{{ organizationTypeLabel[org.organization_type as keyof typeof organizationTypeLabel] ?? org.organization_type }}</UBadge>
                <UBadge v-if="org.is_recruiting" size="xs" variant="soft" color="success">招新中</UBadge>
                <UBadge v-else size="xs" variant="soft" color="warning">暂停</UBadge>
                <span class="text-xs tabular-nums text-muted">{{ org.member_count }}人</span>
              </div>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between text-xs text-muted">
            <span>更新 {{ formatCompactDate(org.updated_at) }}</span>
            <div class="flex gap-1">
              <UButton size="xs" variant="ghost" color="neutral" :to="`/organizations/${org.id}`">查看</UButton>
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click="openEdit(org)">编辑</UButton>
              <UButton size="xs" variant="soft" color="primary" :to="`/manage/organizations/${org.id}`">Studio</UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-muted">
      <span>共 {{ total }} 条</span>
      <UPagination
        v-if="total > pageSize"
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        :sibling-count="1"
        @update:page="onPageChange"
      />
    </div>

    <OrganizationEditorModal :open="editorOpen" :organization-id="editingOrgId" @update:open="onEditorClose" @saved="load" />
  </div>
</template>


