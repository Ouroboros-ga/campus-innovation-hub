<script setup lang="ts">
/**
 * 首页快捷入口（FE-006）。
 *
 * 设计来源：docs/frontend/FrontendDesign.md
 * - §20：快捷入口使用卡片（UCard 仅当内容需要边界时才用）；
 * - §17.2：快捷入口图标尺寸 20–22px；
 * - §17.3：图标容器允许用于快捷入口；
 * - §7.1：主蓝用于主 CTA / 活动控件（首页主操作）；
 * - §34：移动端 2x2 快捷入口；
 * - §35：整块可点击，触控目标 >= 44px。
 */

const entries = [
  {
    label: '找竞赛',
    hint: '探索竞赛机会',
    icon: 'i-lucide-trophy',
    to: '/competitions'
  },
  {
    label: '找队友',
    hint: '寻找合适伙伴',
    icon: 'i-lucide-users',
    to: '/teams'
  },
  {
    label: '找组织',
    hint: '加入优秀社团',
    icon: 'i-lucide-building-2',
    to: '/organizations'
  },
  {
    label: '找活动',
    hint: '参与精彩活动',
    icon: 'i-lucide-calendar-days',
    to: '/activities'
  }
] as const
</script>

<template>
  <ul class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
    <li
      v-for="item in entries"
      :key="item.to"
    >
      <RouterLink
        :to="item.to"
        class="flex items-center gap-3 rounded-card border border-default bg-default p-3 transition-colors hover:border-primary-300 hover:bg-muted"
      >
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
          aria-hidden="true"
        >
          <UIcon
            :name="item.icon"
            class="size-[22px] text-primary-600 dark:text-primary-400"
          />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-highlighted">
            {{ item.label }}
          </span>
          <span class="mt-0.5 block truncate text-xs text-muted">
            {{ item.hint }}
          </span>
        </span>
      </RouterLink>
    </li>
  </ul>
</template>
