<script setup lang="ts">
import { useRouter } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import TeamFilters from '@/features/teams/components/TeamFilters.vue'
import TeamPostCard from '@/features/teams/components/TeamPostCard.vue'
import {
  TEAM_PAGE_SIZE,
  useTeamQuery
} from '@/features/teams/composables/useTeamQuery'

/**
 * 组队广场（FE-030）— /teams
 *
 * 设计来源：
 * - PageMap §组队广场：顶部 H1 + 说明 + 发布组队；筛选（关联竞赛 / 信息类型 / 状态）；
 *   列表项（标题 / 竞赛 / 队伍或个人 / 人数 / 岗位 / 技能 / 目标 / 发布者 / 查看详情）;
 *   本人帖子提供编辑 / 关闭；
 * - FrontendDesign §34.4（手机紧凑列表）、§40 / §41 / §42（empty / loading / error）。
 */
const router = useRouter()
const {
  query,
  items,
  loading,
  error,
  total,
  competitionOptions,
  updateQuery,
  reset,
  reload,
  closePost
} = useTeamQuery()

function onEdit() {
  void router.push('/teams/create')
}
</script>

<template>
  <section class="py-6 sm:py-8">
    <PageContainer>
      <!-- 桌面：标题 + 说明 + 发布组队 -->
      <div class="hidden items-end justify-between gap-4 md:flex">
        <div>
          <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
            组队广场
          </h1>
          <p class="mt-2 max-w-xl text-base text-muted">
            发布或加入队伍，找到合适的伙伴，一起冲击更高目标。
          </p>
        </div>
        <UButton
          to="/teams/create"
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
        >
          发布组队
        </UButton>
      </div>

      <!-- 手机：发布组队 CTA -->
      <div class="mb-3 flex justify-end md:hidden">
        <UButton
          to="/teams/create"
          color="primary"
          variant="soft"
          size="sm"
          icon="i-lucide-plus"
        >
          发布组队
        </UButton>
      </div>

      <TeamFilters
        class="mt-6"
        :query="query"
        :competition-options="competitionOptions"
        @change="updateQuery"
        @reset="reset"
      />

      <div class="mt-6">
        <template v-if="loading">
          <p class="text-sm text-muted">
            正在加载组队信息……
          </p>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <USkeleton
              v-for="n in 6"
              :key="n"
              class="h-64 w-full rounded-card"
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
              组队信息加载失败
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
            icon="i-lucide-users"
            title="没有符合条件的组队信息"
            description="试试调整筛选条件，或发布一条组队信息寻找队友。"
          />
          <div class="mt-4 flex justify-center">
            <UButton
              to="/teams/create"
              color="primary"
              variant="outline"
              icon="i-lucide-plus"
            >
              发布组队
            </UButton>
          </div>
        </template>

        <template v-else>
          <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="post in items"
              :key="post.id"
              class="min-w-0"
            >
              <TeamPostCard
                :post="post"
                @close="closePost"
                @edit="onEdit"
              />
            </li>
          </ul>

          <UPagination
            v-if="total > TEAM_PAGE_SIZE"
            :model-value="query.page ?? 1"
            :total="total"
            :items-per-page="TEAM_PAGE_SIZE"
            class="mt-8 justify-center"
            @update:model-value="(p: number) => updateQuery({ page: p })"
          />
        </template>
      </div>
    </PageContainer>
  </section>
</template>
