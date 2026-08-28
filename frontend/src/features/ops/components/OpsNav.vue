<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 运营侧栏 — 按反馈重整：
 * 1) 去重：移去 aside 品牌头（由全局 AppHeader 承载），侧栏仅导航
 * 2) 组织：合并「二级社团组织 + 二级组织管理/三级全部组织」为单一「组织管理」分组，唯一入口 ops-organizations
 * 3) 组队：新增二级「组队管理」直达 ops-teams
 * 4) 咨询：去重「二级咨询」叶子，保留分组内的三级「咨询与反馈」
 */
const route = useRoute()

const contentOpen = ref(true)
const orgOpen = ref(true)
const consultOpen = ref(true)

const isActive = (name: string) => route.name === name

const contentChildren = [
  { name: 'ops-competitions', label: '竞赛管理', icon: 'i-lucide-trophy' },
  { name: 'ops-activities', label: '校园动态', icon: 'i-lucide-calendar-days' },
  { name: 'ops-guides', label: '指南管理', icon: 'i-lucide-book-open' },
  { name: 'ops-faq', label: 'FAQ 管理', icon: 'i-lucide-help-circle' }
]
</script>

<template>
  <nav
    aria-label="运营导航"
    class="space-y-1"
  >
    <RouterLink
      :to="{ name: 'ops-overview' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
      :class="isActive('ops-overview') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon
        name="i-lucide-layout-dashboard"
        class="size-4"
      />
      运营工作台
    </RouterLink>

    <!-- 内容管理 -->
    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        @click="contentOpen = !contentOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon
            name="i-lucide-folder-open"
            class="size-4"
          />
          内容管理
        </span>
        <UIcon
          :name="contentOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-3.5 text-muted"
        />
      </button>
      <div
        v-show="contentOpen"
        class="ml-2 space-y-0.5 border-l border-default pl-3"
      >
        <RouterLink
          :to="{ name: 'ops-system' }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive('ops-system') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon
            name="i-lucide-home"
            class="size-3.5"
          />
          首页管理
        </RouterLink>
        <RouterLink
          v-for="c in contentChildren"
          :key="c.name"
          :to="{ name: c.name }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive(c.name) ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon
            :name="c.icon"
            class="size-3.5"
          />
          {{ c.label }}
        </RouterLink>
      </div>
    </div>

    <!-- 组队广场（新增二级单列） -->
    <RouterLink
      :to="{ name: 'ops-teams' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
      :class="isActive('ops-teams') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon
        name="i-lucide-users"
        class="size-4"
      />
      组队管理
    </RouterLink>

    <!-- 组织管理（重整：仅此一组，消去此前“二级社团组织”与“二级组织管理→全部组织”重复） -->
    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        :class="isActive('ops-organizations') ? 'text-primary-700 dark:text-primary-300' : ''"
        @click="orgOpen = !orgOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon
            name="i-lucide-building-2"
            class="size-4"
          />
          组织管理
        </span>
        <UIcon
          :name="orgOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-3.5 text-muted"
        />
      </button>
      <div
        v-show="orgOpen"
        class="ml-2 space-y-0.5 border-l border-default pl-3"
      >
        <RouterLink
          :to="{ name: 'ops-organizations' }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive('ops-organizations') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon
            name="i-lucide-users-round"
            class="size-3.5"
          />
          全部组织
        </RouterLink>
        <RouterLink
          :to="{ name: 'ops-recruitment-applications' }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive('ops-recruitment-applications') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon
            name="i-lucide-user-plus"
            class="size-3.5"
          />
          招新审核
        </RouterLink>
      </div>
    </div>

    <!-- 咨询与反馈（重整：去二级叶子，仅保留分组内的三级） -->
    <div>
      <button
        class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-toned hover:bg-muted hover:text-highlighted"
        :class="isActive('ops-questions') ? 'text-primary-700 dark:text-primary-300' : ''"
        @click="consultOpen = !consultOpen"
      >
        <span class="flex items-center gap-2">
          <UIcon
            name="i-lucide-message-square"
            class="size-4"
          />
          咨询与反馈
        </span>
        <UIcon
          :name="consultOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="size-3.5 text-muted"
        />
      </button>
      <div
        v-show="consultOpen"
        class="ml-2 space-y-0.5 border-l border-default pl-3"
      >
        <RouterLink
          :to="{ name: 'ops-questions' }"
          class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm"
          :class="isActive('ops-questions') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-muted hover:bg-muted hover:text-highlighted'"
        >
          <UIcon
            name="i-lucide-inbox"
            class="size-3.5"
          />
          咨询列表
        </RouterLink>
      </div>
    </div>

    <RouterLink
      :to="{ name: 'ops-analytics' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
      :class="isActive('ops-analytics') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon
        name="i-lucide-bar-chart-3"
        class="size-4"
      />
      数据分析
    </RouterLink>
    <RouterLink
      :to="{ name: 'ops-system' }"
      class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm"
      :class="isActive('ops-system') ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-toned hover:bg-muted hover:text-highlighted'"
    >
      <UIcon
        name="i-lucide-settings"
        class="size-4"
      />
      系统设置
    </RouterLink>
  </nav>
</template>
