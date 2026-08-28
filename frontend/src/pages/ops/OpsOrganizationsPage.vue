<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listOpsOrganizations, type OpsOrganization } from '@/features/ops/api/opsOrganizationApi'
import { getOrganizationStats, type OrganizationStats } from '@/features/ops/api/opsOverviewApi'
import { formatCompactDate } from '@/shared/lib/date'
import { organizationTypeLabel } from '@/shared/lib/domain-labels'

const stats = ref<OrganizationStats | null>(null)
const organizations = ref<OpsOrganization[]>([])
const total = ref(0)
const loading = ref(true)
const query = ref('')
const orgType = ref('ALL')
const recruiting = ref('ALL')

async function load() {
  loading.value = true
  try {
    const [s, list] = await Promise.all([
      getOrganizationStats(),
      listOpsOrganizations({
        q: query.value || undefined,
        organization_type: orgType.value === 'ALL' ? undefined : orgType.value,
        is_recruiting: recruiting.value === 'ALL' ? undefined : recruiting.value === 'RECRUITING',
        page: 1,
        pageSize: 20
      })
    ])
    stats.value = s
    organizations.value = list.results
    total.value = list.count
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
}

onMounted(load)

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
        <h2 class="text-lg font-semibold text-highlighted">社团组织管理</h2>
        <p class="text-sm text-muted">管理学院所有社团组织信息、招新状态与资料内容</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus">新建组织</UButton>
    </div>

    <!-- 顶部统计 -->
    <div class="grid gap-3 sm:grid-cols-4">
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">全部组织</p>
          <span class="grid size-7 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950"><UIcon name="i-lucide-users" class="size-4" /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">{{ stats?.total ?? '-' }}</p>
        <p class="text-xs text-success-600">较上周 ↑ 5.2%</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">招新中</p>
          <span class="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950"><UIcon name="i-lucide-user-plus" class="size-4" /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">{{ stats?.recruiting ?? '-' }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">已暂停招新</p>
          <span class="grid size-7 place-items-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950"><UIcon name="i-lucide-pause" class="size-4" /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">{{ stats?.not_recruiting ?? '-' }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-muted">本月新增</p>
          <span class="grid size-7 place-items-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950"><UIcon name="i-lucide-sparkles" class="size-4" /></span>
        </div>
        <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">{{ stats?.new_this_month ?? '-' }}</p>
        <p v-if="stats?.top_organization" class="truncate text-xs text-muted">人气：{{ stats.top_organization.name }}</p>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex flex-wrap gap-2 rounded-lg border border-default bg-default p-3">
      <UInput v-model="query" placeholder="搜索组织名称、简介、负责人..." icon="i-lucide-search" size="sm" class="w-64" @keyup.enter="load" />
      <USelect v-model="orgType" :items="typeOptions" size="sm" class="w-32" />
      <USelect v-model="recruiting" :items="recruitingOptions" size="sm" class="w-32" />
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-rotate-ccw" @click="query='';orgType='ALL';recruiting='ALL';load()">重置</UButton>
      <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-download">导出</UButton>
    </div>

    <!-- 表 -->
    <div class="overflow-x-auto rounded-lg border border-default bg-default">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-xs text-muted">
          <tr>
            <th class="w-8 px-3 py-2"><UCheckbox /></th>
            <th class="px-3 py-2 text-left font-normal">组织信息</th>
            <th class="px-3 py-2 text-left font-normal">类型 / 分类</th>
            <th class="px-3 py-2 text-left font-normal">负责人</th>
            <th class="px-3 py-2 text-left font-normal">指导老师</th>
            <th class="px-3 py-2 text-left font-normal">招新状态</th>
            <th class="px-3 py-2 text-left font-normal">成员数</th>
            <th class="px-3 py-2 text-left font-normal">更新时间</th>
            <th class="px-3 py-2 text-left font-normal">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-if="loading">
            <td colspan="9" class="py-10 text-center text-sm text-muted">正在加载…</td>
          </tr>
          <tr v-for="org in organizations" :key="org.id" class="hover:bg-muted/30">
            <td class="px-3 py-2"><UCheckbox /></td>
            <td class="px-3 py-2">
              <div class="flex gap-2">
                <img v-if="org.logo?.url" :src="org.logo.url" :alt="org.name" class="size-8 rounded-full object-cover" />
                <span v-else class="grid size-8 place-items-center rounded-full bg-muted"><UIcon name="i-lucide-building-2" class="size-4 text-muted" /></span>
                <div class="min-w-0">
                  <p class="truncate font-medium text-highlighted">{{ org.name }}</p>
                  <p class="truncate text-xs text-muted">{{ org.short_intro ?? '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-3 py-2">
              <UBadge size="xs" color="neutral" variant="soft">{{ organizationTypeLabel[org.organization_type as keyof typeof organizationTypeLabel] ?? org.organization_type }}</UBadge>
            </td>
            <td class="px-3 py-2">
              <div v-if="org.leader" class="flex items-center gap-1.5">
                <UAvatar :src="org.leader.avatar?.url ?? undefined" :alt="org.leader.display_name" size="xs" />
                <span class="text-xs">{{ org.leader.display_name }}</span>
              </div>
              <span v-else class="text-xs text-muted">—</span>
            </td>
            <td class="px-3 py-2">
              <div v-if="org.advisor" class="flex items-center gap-1.5">
                <UAvatar :src="org.advisor.avatar?.url ?? undefined" :alt="org.advisor.display_name" size="xs" />
                <span class="text-xs">{{ org.advisor.display_name }}</span>
              </div>
              <span v-else class="text-xs text-muted">—</span>
            </td>
            <td class="px-3 py-2">
              <UBadge v-if="org.is_recruiting" size="xs" color="success" variant="soft">招新中</UBadge>
              <UBadge v-else size="xs" color="warning" variant="soft">暂停招新</UBadge>
              <p v-if="org.recruitment_end_at" class="text-xs text-muted">截止 {{ formatCompactDate(org.recruitment_end_at) }}</p>
            </td>
            <td class="px-3 py-2 tabular-nums">{{ org.member_count }}</td>
            <td class="px-3 py-2 text-xs text-muted">{{ formatCompactDate(org.updated_at) }}</td>
            <td class="px-3 py-2">
              <div class="flex gap-1">
                <UButton size="xs" variant="ghost" color="neutral" :to="`/organizations/${org.id}`">查看</UButton>
                <UButton size="xs" color="primary" variant="soft" :to="`/manage/organizations/${org.id}`">Studio</UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !organizations.length">
            <td colspan="9" class="py-10 text-center text-sm text-muted">暂无组织</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-xs text-muted">
      <span>共 {{ total }} 条</span>
      <UPagination :total="total" :page-size="20" />
    </div>
  </div>
</template>
