<script setup lang="ts">
import type { AccountTimelineItem } from '@/mocks/fixtures/account'

defineProps<{ items: AccountTimelineItem[] }>()
</script>

<template>
  <ul class="space-y-3">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex gap-3"
    >
      <span
        class="grid size-8 shrink-0 place-items-center rounded-full border"
        :class="item.iconColor === 'success'
          ? 'border-success-200 bg-success-50 text-success-600 dark:border-success-800 dark:bg-success-950 dark:text-success-400'
          : item.iconColor === 'primary'
            ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-400'
            : 'border-default bg-muted text-muted'"
        aria-hidden="true"
      >
        <UIcon :name="item.icon" class="size-4" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-highlighted">{{ item.title }}</span>
        <span class="mt-0.5 block text-xs text-muted">{{ item.description }}</span>
      </span>
      <span class="shrink-0 text-xs text-muted">{{ item.timeLabel }}</span>
    </li>
  </ul>
</template>
