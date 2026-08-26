<script setup lang="ts">
import CompetitionBannerCard from '@/features/competitions/components/CompetitionBannerCard.vue'
import CompetitionCard from '@/features/homepage/components/CompetitionCard.vue'
import CompetitionFilters from '@/features/competitions/components/CompetitionFilters.vue'
import SelectedCompetitionChips from '@/features/competitions/components/SelectedCompetitionChips.vue'
import {
  COMPETITION_PAGE_SIZE,
  useCompetitionQuery
} from '@/features/competitions/composables/useCompetitionQuery'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 竞赛列表页（FE-020）。
 *
 * 设计来源：
 * - FrontendDesign.md §21（竞赛卡）、§34.4（手机紧凑列表行）、§34.5（手机筛选 Drawer）；
 * - §40/§41/§42：empty / loading / error 状态；错误可操作；
 * - §30：桌面卡格、手机紧凑行，不做卡片墙（§34.4）。
 */
const {
  query,
  items,
  loading,
  error,
  total,
  updateQuery,
  reset,
  reload
} = useCompetitionQuery()
</script>

<template>
  <section class="py-6 sm:py-8">
    <PageContainer>
      <!-- 手机端：大标题由居中头部提供，页面内不再重复 -->
      <div class="hidden md:block">
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          竞赛中心
        </h1>
        <p class="mt-2 max-w-xl text-base text-muted">
          汇聚校内外优质竞赛资源。发现机会，挑战自我，收获成长。
        </p>
      </div>

      <CompetitionFilters
        class="mt-6"
        :query="query"
        @change="updateQuery"
        @reset="reset"
      />

      <SelectedCompetitionChips
        class="mt-3"
        :query="query"
        @change="updateQuery"
        @reset="reset"
      />

      <div class="mt-6">
        <template v-if="loading">
          <p class="text-sm text-muted">
            正在加载竞赛……
          </p>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <USkeleton
              v-for="n in 6"
              :key="n"
              class="h-56 w-full rounded-card"
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
              竞赛列表加载失败
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

        <template v-else-if="total === 0">
          <UEmpty
            icon="i-lucide-search-x"
            title="没有符合条件的竞赛"
            description="试试调整筛选条件或清除关键词。"
          />
        </template>

        <template v-else>
          <!-- 手机：整宽横幅卡（按设计稿） -->
          <ul class="mt-2 space-y-4 md:hidden">
            <li
              v-for="item in items"
              :key="item.id"
            >
              <CompetitionBannerCard :item="item" />
            </li>
          </ul>

          <!-- 桌面 / 平板：卡片网格 -->
          <ul class="mt-4 hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:grid">
            <li
              v-for="item in items"
              :key="item.id"
              class="min-w-0"
            >
              <CompetitionCard :item="item" />
            </li>
          </ul>

          <UPagination
            v-if="total > COMPETITION_PAGE_SIZE"
            :model-value="query.page ?? 1"
            :total="total"
            :items-per-page="COMPETITION_PAGE_SIZE"
            class="mt-8 justify-center"
            @update:model-value="(p: number) => updateQuery({ page: p })"
          />
        </template>
      </div>
    </PageContainer>
  </section>
</template>
