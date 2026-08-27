<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import MyOrganizationsSection from '@/features/organizations/components/MyOrganizationsSection.vue'
import OrganizationCard from '@/features/organizations/components/OrganizationCard.vue'
import OrganizationFilterGroup from '@/features/organizations/components/OrganizationFilterGroup.vue'
import { useOrganizationQuery } from '@/features/organizations/composables/useOrganizationQuery'
import {
  filterOrganizations,
  normalizeOrgSort,
  normalizeOrgStatus,
  normalizeOrgType,
  organizationRecruitmentOptions,
  organizationTypeOptions,
  paginateOrganizations,
  sortOrganizations
} from '@/features/organizations/lib/organizationFilters'
import { useAuthStore } from '@/stores/auth'
import type { MyOrganization } from '@/features/organizations/types'

/**
 * 社团与组织（FE-040 / FE-103 API 驱动）— /organizations
 *
 * 设计来源：FrontendDesign.md §23（Org List：logo/name/type/desc/recruitment）、
 * §34.5（筛选 URL 承载）、PageMap §组织列表（我的组织、筛选、卡、排序）。
 * 全部组织来源 `GET /api/organizations`；「我的组织」由 `GET /api/auth/me` 的 memberships 派生（无 Mock）。
 */
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 8
const now = computed(() => new Date())

const {
  items: organizations,
  loading,
  error,
  reload
} = useOrganizationQuery()

const auth = useAuthStore()
const myOrganizations = computed<MyOrganization[]>(() => {
  const memberships = auth.organizationMemberships as Array<{ organization_id: string; role: string; title: string | null }>
  if (!memberships.length) return []
  return memberships
    .map(m => {
      const org = organizations.value.find(o => o.id === m.organization_id)
      if (!org) return null
      const role = m.role as MyOrganization['membership']
      const roleLabel = m.title || (role === 'ADVISOR' ? '指导老师' : role === 'LEADER' ? '负责人' : '成员')
      return { organization: org, membership: role, roleLabel } as MyOrganization
    })
    .filter(Boolean) as MyOrganization[]
})

const q = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const type = computed(() => normalizeOrgType(route.query.type))
const status = computed(() => normalizeOrgStatus(route.query.status))
const sort = computed(() => normalizeOrgSort(route.query.sort))
const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? '1'), 10)
  return Number.isFinite(value) && value > 0 ? value : 1
})

const filtered = computed(() =>
  filterOrganizations(organizations.value, { type: type.value, status: status.value, q: q.value }, now.value)
)
const sorted = computed(() => sortOrganizations(filtered.value, sort.value))
const paged = computed(() =>
  paginateOrganizations(sorted.value, page.value, PAGE_SIZE)
)

function applyQuery(patch: {
  q?: string
  type?: string
  status?: string
  sort?: string
  page?: number
}) {
  const next: Record<string, string> = {}
  const nextQ = patch.q ?? q.value
  const nextType = patch.type ?? (type.value === 'ALL' ? undefined : type.value)
  const nextStatus = patch.status ?? (status.value === 'ALL' ? undefined : status.value)
  const nextSort = patch.sort ?? (sort.value === 'DEFAULT' ? undefined : sort.value)
  let nextPage = patch.page ?? page.value
  const filterChanged =
    patch.q !== undefined ||
    patch.type !== undefined ||
    patch.status !== undefined ||
    patch.sort !== undefined
  if (filterChanged && patch.page === undefined) nextPage = 1

  if (nextQ) next.q = nextQ
  if (nextType) next.type = nextType
  if (nextStatus) next.status = nextStatus
  if (nextSort) next.sort = nextSort
  if (nextPage > 1) next.page = String(nextPage)
  void router.replace({ query: next })
}
</script>

<template>
  <section class="py-6 sm:py-8">
    <PageContainer>
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <!-- 手机端：大标题由居中头部提供，页面内不再重复 -->
        <div class="hidden md:block">
          <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
            社团与组织
          </h1>
          <p class="mt-2 max-w-xl text-base text-muted">
            加入志同道合的组织，结识伙伴、成长进步、共同创造价值。
          </p>
        </div>
        <UInput
          :model-value="q"
          icon="i-lucide-search"
          placeholder="搜索组织名称、关键词"
          aria-label="搜索组织"
          class="w-full md:w-72"
          @update:model-value="v => applyQuery({ q: v })"
        />
      </div>

      <MyOrganizationsSection
        v-if="myOrganizations.length"
        class="mt-8"
        :items="myOrganizations"
      />

      <div
        data-test="org-filters"
        class="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start"
      >
        <OrganizationFilterGroup
          label="组织类型"
          :model-value="type"
          :options="organizationTypeOptions"
          @update:model-value="v => applyQuery({ type: v === 'ALL' ? '' : v })"
        />
        <OrganizationFilterGroup
          label="招新状态"
          :model-value="status"
          :options="organizationRecruitmentOptions"
          @update:model-value="v => applyQuery({ status: v === 'ALL' ? '' : v })"
        />
      </div>

      <section
        class="mt-8"
        data-test="all-organizations"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-layout-grid"
              class="size-5 text-highlighted"
              aria-hidden="true"
            />
            <h2 class="text-lg font-semibold text-highlighted">
              全部组织
            </h2>
          </div>
          <USelect
            :model-value="sort"
            :items="[
              { label: '默认排序', value: 'DEFAULT' },
              { label: '按名称排序', value: 'NAME' }
            ]"
            aria-label="排序方式"
            class="w-36"
            @update:model-value="v => applyQuery({ sort: v || 'DEFAULT' })"
          />
        </div>

        <template v-if="loading">
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <USkeleton
              v-for="n in 6"
              :key="n"
              class="h-40 w-full rounded-card"
            />
          </div>
        </template>

        <template v-else-if="error">
          <div class="flex flex-col items-center gap-3 py-16 text-center">
            <span
              class="flex size-12 items-center justify-center rounded-control bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400"
              aria-hidden="true"
            >
              <UIcon
                name="i-lucide-circle-alert"
                class="size-6"
              />
            </span>
            <p class="text-sm font-medium text-highlighted">
              组织信息加载失败
            </p>
            <p class="text-sm text-muted">
              请检查网络后重试。
            </p>
            <UButton
              color="primary"
              variant="solid"
              icon="i-lucide-refresh-ccw"
              @click="reload"
            >
              重新加载
            </UButton>
          </div>
        </template>

        <template v-else>
          <ul
            v-if="paged.items.length"
            class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <li
              v-for="item in paged.items"
              :key="item.id"
              class="min-w-0"
            >
              <OrganizationCard :org="item" />
            </li>
          </ul>
          <UEmpty
            v-else
            icon="i-lucide-users"
            title="没有符合条件的组织"
            description="尝试调整筛选条件或清除关键词。"
            class="mt-6"
          />
        </template>

        <UPagination
          v-if="!loading && !error && paged.totalPages > 1"
          :model-value="page"
          :total="sorted.length"
          :page-size="PAGE_SIZE"
          class="mt-8 justify-center"
          @update:model-value="(v: number) => applyQuery({ page: v })"
        />
      </section>
    </PageContainer>
  </section>
</template>
