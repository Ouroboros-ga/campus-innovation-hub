<script setup lang="ts">
import {
  guideList,
  hotCompetitions,
  recruitTeams
} from '@/mocks/fixtures/homepage'

/**
 * 首页 Hero 左列的「为你推荐」补充块。
 *
 * 作用：Hero 分栏因轮播采用 16:9 而较高，左列垂直居中后下方留白；
 * 用一条紧凑推荐列表填充（仅桌面显示，手机端保持简洁 §18.2）。
 *
 * 设计来源：
 * - FrontendDesign.md §3.1 / §17（无 emoji，Lucide 图标）、§7.3 / §7.4（token 与暗色）、
 *   §20 / §45（用列表而非卡片墙）、§43（简体中文）。
 */
const competition = hotCompetitions[0]
const guide = guideList[0]
const team = recruitTeams[0]

const items = [
  ...(competition
    ? [{
        icon: 'i-lucide-trophy',
        type: '重要竞赛',
        title: `${competition.name} ${competition.edition}`,
        to: competition.detailPath
      }]
    : []),
  ...(guide
    ? [{
        icon: 'i-lucide-book-open',
        type: '热门指南',
        title: guide.title,
        to: guide.detailPath
      }]
    : []),
  ...(team
    ? [{
        icon: 'i-lucide-users',
        type: '正在组队',
        title: team.title,
        to: team.detailPath
      }]
    : [])
]
</script>

<template>
  <div>
    <p class="flex items-center gap-1.5 text-sm font-semibold text-highlighted">
      <UIcon
        name="i-lucide-sparkles"
        class="size-4 text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      为你推荐
    </p>
    <ul class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.to"
      >
        <RouterLink
          :to="item.to"
          class="group flex items-center gap-3 py-1"
        >
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="item.icon"
              class="size-4 text-primary-600 dark:text-primary-400"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span
              class="block truncate text-sm text-highlighted transition-colors group-hover:text-primary-600"
            >
              {{ item.title }}
            </span>
            <span class="block text-xs text-muted">
              {{ item.type }}
            </span>
          </span>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 shrink-0 text-muted transition-colors group-hover:text-primary-600"
            aria-hidden="true"
          />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
