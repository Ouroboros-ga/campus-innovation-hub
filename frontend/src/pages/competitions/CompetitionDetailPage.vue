<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import CompetitionDetailView from '@/features/competitions/views/CompetitionDetailView.vue'
import { getCompetition } from '@/features/competitions/api/competitionApi'
import type { CompetitionDetail } from '@/features/competitions/types'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 竞赛详情页（按参考设计稿，PC + 移动端；FE-101 API 驱动）。
 *
 * 桌面为「左内容 + 右侧栏」双栏布局；手机为单列卡片流，并在底部提供
 * 关注 / 立即报名的 Sticky Action Bar（§34.7）。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

const detail = ref<CompetitionDetail | null>(null)
const loading = ref(true)
const error = ref(false)

watch(
  id,
  async () => {
    loading.value = true
    error.value = false
    detail.value = null
    try {
      detail.value = await getCompetition(id.value)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)


</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-6xl">
      <!-- 桌面面包屑 -->
      <nav
        class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
        aria-label="面包屑"
      >
        <RouterLink
          to="/competitions"
          class="transition-colors hover:text-primary-600"
        >
          竞赛
        </RouterLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
        <span class="text-highlighted">
          竞赛详情
        </span>
      </nav>

      <div
        v-if="loading"
        class="space-y-4"
      >
        <USkeleton class="h-44 w-full rounded-card" />
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-24 w-full rounded-card"
        />
      </div>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该竞赛，或加载失败。
        </p>
        <RouterLink
          to="/competitions"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回竞赛列表
        </RouterLink>
      </div>

      <template v-else-if="detail">
        <CompetitionDetailView :detail="detail" />
      </template>
    </PageContainer>
  </section>
</template>
