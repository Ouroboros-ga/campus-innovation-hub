<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import MyOrganizationsSection from '@/features/organizations/components/MyOrganizationsSection.vue'
import OrganizationCard from '@/features/organizations/components/OrganizationCard.vue'
import OrganizationFilterGroup from '@/features/organizations/components/OrganizationFilterGroup.vue'
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
import { myOrganizations, organizations } from '@/mocks/fixtures/organizations'

/**
 * 社团与组织（FE-040）— /organizations
 *
 * 设计来源：FrontendDesign.md §23（Org List：logo/name/type/desc/recruitment）、
 * §34.5（筛选 URL 承载）、PageMap §组织列表（我的组织、筛选、卡、排序）。
 */
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 8
const now = computed(() => new Date())

const q = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const type = computed(() => normalizeOrgType(route.query.type))
const status = computed(() => normalizeOrgStatus(route.query.status))
const sort = computed(() => normalizeOrgSort(route.query.sort))
const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? '1'), 10)
  return Number.isFinite(value) && value > 0 ? value : 1
})

const filtered = computed(() =>
  filterOrganizations(organizations, { type: type.value, status: status.value, q: q.value }, now.value)
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
  <section class="py-10 sm:py-14">
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
          class="w-full md:w-72"
          @update:model-value="v => applyQuery({ q: v })"
        />
      </div>

      <div class="mt-6 space-y-3">
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

      <MyOrganizationsSection
        v-if="myOrganizations.length"
        class="mt-8"
        :items="myOrganizations"
      />

      <section
        class="mt-10"
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
            class="w-36"
            @update:model-value="v => applyQuery({ sort: v || 'DEFAULT' })"
          />
        </div>

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

        <UPagination
          v-if="paged.totalPages > 1"
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
