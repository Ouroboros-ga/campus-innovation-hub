<script setup lang="ts">
import type { CompetitionHighlight } from '../types'

/**
 * 赛事亮点（按参考设计稿：紧凑单行，4 列，图标 + 标题 + 说明）。
 * 不再使用整块大卡片，缩小图标与留白，降低区块高度。
 */
defineProps<{ highlights: CompetitionHighlight[] }>()
</script>

<template>
  <ul class="grid grid-cols-4 gap-x-3 gap-y-4">
    <li
      v-for="item in highlights"
      :key="item.title"
      class="flex min-w-0 items-start gap-2"
    >
      <UIcon
        :name="item.icon"
        class="mt-0.5 size-5 shrink-0 text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium leading-5 text-highlighted">
          {{ item.title }}
        </span>
        <span class="mt-0.5 block text-xs leading-4 text-muted">
          {{ item.note }}
        </span>
      </span>
    </li>
  </ul>
</template>
