<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

/** 运营侧栏三级导航（去公告管理，软色活力保留但去实色块）。 */
const route = useRoute()

const contentOpen = ref(true)
const orgOpen = ref(false)
const userOpen = ref(false)

const isActive = (name: string) => route.name === name

const contentChildren = [
  { name: 'ops-competitions', label: '竞赛管理', icon: 'i-lucide-trophy' },
  { name: 'ops-activities', label: '校园动态', icon: 'i-lucide-calendar-days' },
  { name: 'ops-guides', label: '指南管理', icon: 'i-lucide-book-open' }
]
</script>

<template>
  <nav aria-label="运营导航" class="space-y-1">
    <RouterLink
      :to="{ name: 'ops-overview' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
      :class="isActive('ops-overview') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon name="i-lucide-layout-dashboard" class="size-4" />
      运营工作台
    </RouterLink>

    <!-- 内容管理 -->
    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        @click="contentOpen = !contentOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon name="i-lucide-folder-open" class="size-4" />
          内容管理
        </span>
        <UIcon :name="contentOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5 text-muted" />
      </button>
      <div v-show="contentOpen" class="ml-2 space-y-0.5 border-l border-default pl-3">
        <!-- 首页为固定模板 Studio，占位 -->
        <a class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-muted hover:text-highlighted" href="#">
          <UIcon name="i-lucide-home" class="size-3.5" />
          首页管理
        </a>
        <RouterLink
          v-for="c in contentChildren"
          :key="c.name"
          :to="{ name: c.name }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive(c.name) ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon :name="c.icon" class="size-3.5" />
          {{ c.label }}
        </RouterLink>
      </div>
    </div>

    <!-- 社团组织（单项，对应 Fig1） -->
    <RouterLink
      :to="{ name: 'ops-organizations' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
      :class="isActive('ops-organizations') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon name="i-lucide-users-round" class="size-4" />
      社团组织
    </RouterLink>

    <!-- 组织管理 -->
    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        @click="orgOpen = !orgOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon name="i-lucide-building-2" class="size-4" />
          组织管理
        </span>
        <UIcon :name="orgOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5 text-muted" />
      </button>
      <div v-show="orgOpen" class="ml-2 space-y-0.5 border-l border-default pl-3">
        <RouterLink
          :to="{ name: 'ops-organizations' }"
          class="flex rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive('ops-organizations') ? 'font-medium text-primary-700' : 'text-muted hover:text-highlighted'"
        >
          全部组织
        </RouterLink>
      </div>
    </div>

    <RouterLink
      :to="{ name: 'ops-questions' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
      :class="isActive('ops-questions') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon name="i-lucide-message-square" class="size-4" />
      咨询与反馈
    </RouterLink>

    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        @click="userOpen = !userOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon name="i-lucide-user-cog" class="size-4" />
          用户与申请
        </span>
        <UIcon :name="userOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5 text-muted" />
      </button>
      <div v-show="userOpen" class="ml-2 space-y-0.5 border-l border-default pl-3">
        <span class="block rounded-md px-2.5 py-1.5 text-sm text-muted">用户列表</span>
        <span class="block rounded-md px-2.5 py-1.5 text-sm text-muted">申请审核</span>
      </div>
    </div>

    <a class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted" href="#">
      <UIcon name="i-lucide-bar-chart-3" class="size-4" />
      数据分析
    </a>
    <a class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted" href="#">
      <UIcon name="i-lucide-settings" class="size-4" />
      系统设置
    </a>
  </nav>
</template>
