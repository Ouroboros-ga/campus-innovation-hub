<script setup lang="ts">
import { useRoute } from 'vue-router'

/** 平台运营紧凑导航（FE-090）。 */
const route = useRoute()

const items = [
  { name: 'ops-overview', label: '工作台', icon: 'i-lucide-layout-dashboard' },
  { name: 'ops-competitions', label: '竞赛管理', icon: 'i-lucide-trophy' },
  { name: 'ops-activities', label: '校园动态管理', icon: 'i-lucide-calendar-days' },
  { name: 'ops-questions', label: '咨询管理', icon: 'i-lucide-message-square' },
  { name: 'ops-guides', label: '指南管理', icon: 'i-lucide-book-open' }
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav
    aria-label="平台运营导航"
    class="flex flex-wrap gap-2"
  >
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors"
      :class="isActive(item.name)
        ? 'border-primary-600 bg-primary-50 font-medium text-primary-600 dark:border-primary-400 dark:bg-primary-950 dark:text-primary-400'
        : 'border-default text-muted hover:border-primary-300 hover:text-highlighted dark:hover:border-primary-700'"
    >
      <UIcon
        :name="item.icon"
        class="size-4"
        aria-hidden="true"
      />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
