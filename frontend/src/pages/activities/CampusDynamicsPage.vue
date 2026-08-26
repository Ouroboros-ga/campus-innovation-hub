<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import ActivityBrowseFilters from '@/features/dynamics/components/ActivityBrowseFilters.vue'
import ActivityListRow from '@/features/dynamics/components/ActivityListRow.vue'
import AnnouncementListRow from '@/features/dynamics/components/AnnouncementListRow.vue'
import DynamicsTabList from '@/features/dynamics/components/DynamicsTabList.vue'
import {
  filterActivities,
  filterAnnouncements,
  normalizeActivityStatus,
  normalizeActivityType,
  normalizeAnnouncementScope,
  normalizeTab,
  paginate,
  splitAllTab
} from '@/features/dynamics/lib/dynamicsFilters'
import { announcementScopeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import type { DynamicsTab } from '@/features/dynamics/types'

/**
 * 校园动态（/activities?tab=all|activities|announcements）— FE-050。
 *
 * 设计来源：
 * - FrontendImplementationPlan.md FE-050：展示名「校园动态」，URL 承载 tab/筛选/分页；
 * - 活动与公告是两种独立类型、fixture、列表行与详情目标，不合并为通用动态；
 * - FrontendDesign.md §34：Phone 为紧凑列表行 +「动态」底栏标签；
 *   tab 可见选中态、键盘可达；§18 / §20：区块 + 紧凑列表。
 */
const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 6

const now = computed(() => new Date())
const tab = computed<DynamicsTab>(() => normalizeTab(route.query.tab))
const status = computed(() => normalizeActivityStatus(route.query.status))
const type = computed(() => normalizeActivityType(route.query.type))
const scope = computed(() => normalizeAnnouncementScope(route.query.scope))

const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? '1'), 10)
  return Number.isFinite(value) && value > 0 ? value : 1
})

/** tab=activities：筛选 + 分页后的活动。 */
const activitiesResult = computed(() => {
  const filtered = filterActivities(
    dynamicsActivities,
    { status: status.value, type: type.value },
    now.value
  )
  const paged = paginate(filtered, page.value, PAGE_SIZE)
  return { filtered: paged.items, total: filtered.length, totalPages: paged.totalPages }
})

/** tab=announcements：按来源筛选后的公告。 */
const announcements = computed(() =>
  filterAnnouncements(dynamicsAnnouncements, { scope: scope.value })
)

/** tab=all：近期活动 + 最新公告两个区块。 */
const allTab = computed(() =>
  splitAllTab(dynamicsActivities, dynamicsAnnouncements)
)

function applyTab(next: DynamicsTab) {
  router.replace({ query: { tab: next } })
}

function onActivityFilter(patch: { status?: string; type?: string }) {
  router.replace({
    query: {
      tab: 'activities',
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.type ? { type: patch.type } : {})
    }
  })
}

function onActivityReset() {
  router.replace({ query: { tab: 'activities' } })
}

function onAnnouncementScope(value: string | undefined) {
  router.replace({
    query: {
      tab: 'announcements',
      ...(value ? { scope: value } : {})
    }
  })
}

function onPageChange(next: number) {
  router.replace({
    query: {
      tab: 'activities',
      ...(status.value !== 'ALL' ? { status: status.value } : {}),
      ...(type.value !== 'ALL' ? { type: type.value } : {}),
      ...(next > 1 ? { page: String(next) } : {})
    }
  })
}
</script>

<template>
  <PageContainer class="py-6 sm:py-8">
    <!-- 手机端：大标题由居中头部提供，页面内不再重复 -->
    <header class="hidden md:block">
      <h1 class="text-2xl font-semibold text-highlighted">
        校园动态
      </h1>
      <p class="mt-1 text-sm text-muted">
        汇聚学院活动与通知公告
      </p>
    </header>

    <DynamicsTabList
      class="mt-4"
      :model-value="tab"
      @update:model-value="applyTab"
    />

    <!-- tab=all：近期活动 + 最新公告 -->
    <section
      v-if="tab === 'all'"
      class="mt-6 space-y-8"
    >
      <div>
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-highlighted">
            近期活动
          </h2>
          <RouterLink
            :to="{ path: '/activities', query: { tab: 'activities' } }"
            class="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-primary-600"
          >
            查看全部
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4"
              aria-hidden="true"
            />
          </RouterLink>
        </div>
        <ul class="mt-2 divide-y divide-default">
          <li
            v-for="item in allTab.recentActivities"
            :key="item.id"
          >
            <ActivityListRow :activity="item" />
          </li>
        </ul>
      </div>

      <div>
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-highlighted">
            最新公告
          </h2>
          <RouterLink
            :to="{ path: '/activities', query: { tab: 'announcements' } }"
            class="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-primary-600"
          >
            查看全部
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4"
              aria-hidden="true"
            />
          </RouterLink>
        </div>
        <ul class="mt-2 divide-y divide-default">
          <li
            v-for="item in allTab.latestAnnouncements"
            :key="item.id"
          >
            <AnnouncementListRow :announcement="item" />
          </li>
        </ul>
      </div>
    </section>

    <!-- tab=activities：活动列表 -->
    <section
      v-else-if="tab === 'activities'"
      class="mt-6"
    >
      <ActivityBrowseFilters
        :status="status"
        :type="type"
        @change="onActivityFilter"
        @reset="onActivityReset"
      />

      <ul
        v-if="activitiesResult.filtered.length"
        class="mt-2 divide-y divide-default"
      >
        <li
          v-for="item in activitiesResult.filtered"
          :key="item.id"
        >
          <ActivityListRow :activity="item" />
        </li>
      </ul>
      <UEmpty
        v-else
        icon="i-lucide-calendar-x"
        title="暂无匹配的活动"
        description="尝试调整筛选条件后再试"
        class="mt-6"
      />

      <UPagination
        v-if="activitiesResult.totalPages > 1"
        :model-value="page"
        :total="activitiesResult.total"
        :page-size="PAGE_SIZE"
        class="mt-6 justify-center"
        @update:model-value="onPageChange"
      />
    </section>

    <!-- tab=announcements：公告列表 -->
    <section
      v-else
      class="mt-6"
    >
      <USelect
        :model-value="scope === 'ALL' ? undefined : scope"
        :items="announcementScopeOptions"
        placeholder="全部来源"
        class="w-44"
        @update:model-value="value => onAnnouncementScope(value || undefined)"
      />

      <ul
        v-if="announcements.length"
        class="mt-2 divide-y divide-default"
      >
        <li
          v-for="item in announcements"
          :key="item.id"
        >
          <AnnouncementListRow :announcement="item" />
        </li>
      </ul>
      <UEmpty
        v-else
        icon="i-lucide-inbox"
        title="暂无公告"
        description="该来源下暂没有发布公告"
        class="mt-6"
      />
    </section>
  </PageContainer>
</template>
