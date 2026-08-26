<script setup lang="ts">
import { useGlobalSearchStore } from '@/stores/globalSearch'

/**
 * 首页手机端全宽搜索入口（FrontendDesign.md §18.3）。
 * 打开与桌面端相同的全局搜索体验，不建独立的移动搜索后端。
 * 仅在手机端展示（< 768px）。store 在点击时按需实例化，避免渲染期依赖 Pinia。
 */
function openSearch() {
  useGlobalSearchStore().openSearch()
}
</script>

<template>
  <div class="px-4 pt-3 md:hidden">
    <UButton
      aria-label="搜索"
      color="neutral"
      variant="soft"
      block
      class="justify-start gap-2 text-default"
      @click="openSearch"
    >
      <UIcon
        name="i-lucide-search"
        class="size-5 shrink-0 text-muted"
        aria-hidden="true"
      />
      <span class="truncate text-sm text-muted">搜索竞赛、组织、组队与活动…</span>
    </UButton>
  </div>
</template>
