<script setup lang="ts">
import { useRoute } from 'vue-router'

/**
 * 组织管理紧凑导航（FE-080）。
 * 三段：组织资料 / 招新管理 / 申请管理；高亮当前，携带 organizationId。
 */
const route = useRoute()

const items = [
  { name: 'org-manage-profile', label: '组织资料', icon: 'i-lucide-building-2' },
  { name: 'org-manage-recruitments', label: '招新管理', icon: 'i-lucide-megaphone' },
  { name: 'org-manage-applications', label: '申请管理', icon: 'i-lucide-file-text' }
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav
    aria-label="组织管理导航"
    class="flex flex-wrap gap-2"
  >
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name, params: { organizationId: route.params.organizationId } }"
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
