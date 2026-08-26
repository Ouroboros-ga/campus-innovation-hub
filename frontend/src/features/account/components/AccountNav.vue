<script setup lang="ts">
import { useRoute } from 'vue-router'

/** 账号侧边导航（FE-070，桌面展示；手机由返回头承担进入）。 */
const route = useRoute()

const items = [
  { name: 'me-profile', label: '个人资料', icon: 'i-lucide-user-round' },
  { name: 'me-follows', label: '我的关注', icon: 'i-lucide-heart' },
  { name: 'me-teams', label: '我的组队', icon: 'i-lucide-users' },
  { name: 'me-applications', label: '我的申请', icon: 'i-lucide-file-text' },
  { name: 'me-activities', label: '我的活动', icon: 'i-lucide-calendar-check' },
  { name: 'me-questions', label: '我的咨询', icon: 'i-lucide-message-square' },
  { name: 'me-settings', label: '账号设置', icon: 'i-lucide-settings' }
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav
    aria-label="账号导航"
    class="space-y-1"
  >
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
      :class="isActive(item.name)
        ? 'bg-primary-50 font-medium text-primary-600 dark:bg-primary-950 dark:text-primary-400'
        : 'text-muted hover:bg-neutral-100 hover:text-highlighted dark:hover:bg-neutral-800'"
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
