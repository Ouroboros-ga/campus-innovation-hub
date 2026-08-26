<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'
import { useGlobalSearchStore } from '@/stores/globalSearch'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import ActivityBrowseCard from '@/features/dynamics/components/ActivityBrowseCard.vue'
import ActivityBrowseFilters from '@/features/dynamics/components/ActivityBrowseFilters.vue'
import ActivityListRow from '@/features/dynamics/components/ActivityListRow.vue'
import AnnouncementListRow from '@/features/dynamics/components/AnnouncementListRow.vue'
import AnnouncementTable from '@/features/dynamics/components/AnnouncementTable.vue'
import DynamicsTabList from '@/features/dynamics/components/DynamicsTabList.vue'
import {
  announcementScopeOptions,
  filterActivities,
  filterAnnouncements,
  normalizeActivityStatus,
  normalizeActivityType,
  normalizeAnnouncementScope,
  normalizeTab,
  paginate,
  splitAllTab
} from '@/features/dynamics/lib/dynamicsFilters'
import type { DynamicsTab } from '@/features/dynamics/types'

/**
 * 校园动态（/activities?tab=all|activities|announcements）— FE-050 双端建设。
 *
 * 设计来源：
 * - FrontendImplementationPlan.md FE-050：展示名「校园动态」，URL 承载 tab/筛选/分页；
 * - 活动与公告是两种独立类型、fixture、列表行与详情目标，不合并为通用动态；
 * - 参考设计稿：桌面「近期活动」用带封面卡片、「最新公告」用表格化列表；手机用紧凑
 *   列表行 + 精选活动卡 +「已加载全部内容」；顶部搜索复用全局搜索（§30，不建独立后端）；
 * - FrontendDesign.md §16.5（手机端标题由居中头部承载）、§34.5（筛选 URL 承载）。
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

/** 手机端「近期活动」精选卡：取 isFeatured，否则取第一条。 */
const featuredRecent = computed(
  () =>
    allTab.value.recentActivities.find(activity => activity.isFeatured) ??
    allTab.value.recentActivities[0]
)
/** 手机端「近期活动」其余条目（不含精选卡）。 */
const restRecent = computed(() =>
  allTab.value.recentActivities.filter(
    activity => activity !== featuredRecent.value
  )
)

function openSearch() {
  useGlobalSearchStore().openSearch()
}

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
    <!-- 页头：桌面标题 + 副标语；右侧搜索（复用全局搜索，§30）。手机端标题由居中头部承载。 -->
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="hidden md:block">
        <h1 class="text-2xl font-semibold text-highlighted">
          校园动态
        </h1>
        <p class="mt-1 text-sm text-muted">
          了解学院最新活动与重要公告，参与交流与成长
        </p>
      </div>

      <button
        type="button"
        aria-label="搜索活动、公告、关键词"
        class="flex min-h-11 w-full items-center gap-2 rounded-md border border-default bg-default px-3 text-muted transition-colors hover:border-primary-300 focus-visible:outline-3 md:w-96"
        @click="openSearch"
      >
        <UIcon
          name="i-lucide-search"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <span class="truncate text-sm">搜索活动、公告、关键词</span>
      </button>
    </div>

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
      <!-- 近期活动 -->
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

        <!-- 桌面/平板：带封面卡片网格 -->
        <ul
          class="mt-4 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4"
        >
          <li
            v-for="item in allTab.recentActivities"
            :key="item.id"
          >
            <ActivityBrowseCard :activity="item" />
          </li>
        </ul>

        <!-- 手机：精选活动卡 + 紧凑列表行 -->
        <div class="mt-2 md:hidden">
          <ActivityBrowseCard
            v-if="featuredRecent"
            :activity="featuredRecent"
          />
          <ul
            v-if="restRecent.length"
            class="mt-2 divide-y divide-default"
          >
            <li
              v-for="item in restRecent"
              :key="item.id"
            >
              <ActivityListRow :activity="item" />
            </li>
          </ul>
          <p class="mt-4 text-center text-xs text-muted">
            已加载全部内容
          </p>
        </div>
      </div>

      <!-- 最新公告 -->
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

        <!-- 桌面/平板：表格化列表 -->
        <div class="mt-4 hidden md:block">
          <AnnouncementTable :announcements="allTab.latestAnnouncements" />
        </div>

        <!-- 手机：紧凑列表行 -->
        <ul class="mt-2 divide-y divide-default md:hidden">
          <li
            v-for="item in allTab.latestAnnouncements"
            :key="item.id"
          >
            <AnnouncementListRow :announcement="item" />
          </li>
        </ul>
        <p class="mt-4 text-center text-xs text-muted md:hidden">
          已加载全部内容
        </p>
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

      <template v-if="activitiesResult.filtered.length">
        <!-- 桌面/平板：卡片网格 -->
        <ul class="mt-4 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="item in activitiesResult.filtered"
            :key="item.id"
          >
            <ActivityBrowseCard :activity="item" />
          </li>
        </ul>
        <!-- 手机：紧凑列表行 -->
        <ul class="mt-2 divide-y divide-default md:hidden">
          <li
            v-for="item in activitiesResult.filtered"
            :key="item.id"
          >
            <ActivityListRow :activity="item" />
          </li>
        </ul>
        <p class="mt-4 text-center text-xs text-muted md:hidden">
          已加载全部内容
        </p>
      </template>
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

      <template v-if="announcements.length">
        <!-- 桌面/平板：表格化列表 -->
        <div class="mt-4 hidden md:block">
          <AnnouncementTable :announcements="announcements" />
        </div>
        <!-- 手机：紧凑列表行 -->
        <ul class="mt-2 divide-y divide-default md:hidden">
          <li
            v-for="item in announcements"
            :key="item.id"
          >
            <AnnouncementListRow :announcement="item" />
          </li>
        </ul>
        <p class="mt-4 text-center text-xs text-muted md:hidden">
          已加载全部内容
        </p>
      </template>
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
