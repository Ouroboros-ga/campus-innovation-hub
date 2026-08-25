<script setup lang="ts">
import { guideList } from '@/mocks/fixtures/homepage'
import { formatCompactDate } from '@/shared/lib/date'
import {
  guideCategoryIcon,
  guideCategoryLabel
} from '@/shared/lib/domain-labels'
import type { GuideSummary } from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「热门指南」区块（FE-010）。
 *
 * 设计来源：
 * - §18.1：右侧栏包含 Guides；
 * - §20：指南用列表而非卡片；
 * - §45：单条底边分隔；
 * - §45 / §43：不显示虚假浏览量（PageMap「浏览信息（仅真实数据）」，
 *   database-design §28 禁止虚构统计），此处只展示标题、类型与更新日期。
 */
const props = withDefaults(
  defineProps<{ items?: GuideSummary[] }>(),
  { items: () => guideList }
)
</script>

<template>
  <section>
    <SectionHeader
      title="热门指南"
      to="/qa/guides"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex items-center gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="guideCategoryIcon[item.category]"
              class="size-[18px] text-primary-600 dark:text-primary-400"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600">
              {{ item.title }}
            </span>
            <span class="mt-0.5 block text-xs text-muted">
              {{ guideCategoryLabel[item.category] }}
            </span>
          </span>
          <span class="shrink-0 text-xs tabular-nums text-muted">
            {{ formatCompactDate(item.publishedAt) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
