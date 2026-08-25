<script setup lang="ts">
import { computed } from 'vue'

import { announcementList } from '@/mocks/fixtures/homepage'
import { formatCompactDate } from '@/shared/lib/date'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 首页「最新通知」通知栏（公告条）。
 *
 * 设计来源：
 * - FrontendDesign.md §3.1 / §17（无 emoji，用 Lucide 图标）、§7.3 / §7.4（token 与暗色映射）、
 *   §35（触控目标）、§43（简体中文文案）；
 * - 绑定到 `/announcements`（待建页面），充当首页到公告的快捷入口。
 */
const latest = computed(() =>
  [...announcementList]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .at(0) ?? null
)
</script>

<template>
  <section
    v-if="latest"
    class="border-b border-default bg-default"
  >
    <PageContainer>
      <div class="flex items-center gap-3 py-3">
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-megaphone"
            class="size-4 text-primary-600 dark:text-primary-400"
          />
        </span>

        <span class="hidden shrink-0 items-center text-sm font-medium text-highlighted sm:flex">
          最新通知
        </span>

        <RouterLink
          :to="latest.detailPath"
          class="min-w-0 flex-1"
        >
          <span class="block truncate text-sm text-muted transition-colors hover:text-primary-600">
            {{ latest.title }}
          </span>
        </RouterLink>

        <span class="hidden shrink-0 text-xs tabular-nums text-muted lg:inline">
          {{ formatCompactDate(latest.publishedAt) }}
        </span>

        <RouterLink
          to="/announcements"
          class="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-primary-600"
        >
          查看通知
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </PageContainer>
  </section>
</template>
