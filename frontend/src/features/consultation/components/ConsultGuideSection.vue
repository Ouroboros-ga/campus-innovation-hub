<script setup lang="ts">
import { formatCompactDate } from '@/shared/lib/date'
import {
  guideCategoryIcon,
  guideCategoryLabel
} from '@/shared/lib/domain-labels'
import type { GuideSummary } from '@/shared/types/homepage'

import ConsultSectionHeader from './ConsultSectionHeader.vue'

/**
 * 指南区块（FE-050）。
 * 每条：彩色类型图标 + 标题 + 摘要 + 类型标签 + 更新日期 + 查看详情。
 */
const props = withDefaults(
  defineProps<{
    items: GuideSummary[]
    viewAllTo?: string
    viewAllLabel?: string
  }>(),
  { viewAllTo: '', viewAllLabel: '查看全部指南' }
)
</script>

<template>
  <section>
    <ConsultSectionHeader
      icon="i-lucide-book-open"
      title="指南"
      :action-to="props.viewAllTo"
      action-label="查看全部"
    />

    <ul class="mt-3 space-y-3">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex gap-3 rounded-surface border border-default bg-default p-3"
        >
          <span
            class="grid size-12 shrink-0 place-items-center rounded-surface bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
            aria-hidden="true"
          >
            <UIcon
              :name="guideCategoryIcon[item.category]"
              class="size-5"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600">
              {{ item.title }}
            </span>
            <span class="mt-1 line-clamp-2 block text-xs leading-5 text-muted">
              {{ item.summary }}
            </span>
            <span class="mt-2 flex items-center justify-between gap-2 text-xs">
              <span class="text-muted">
                {{ guideCategoryLabel[item.category] }} ·
                更新于 {{ formatCompactDate(item.publishedAt) }}
              </span>
              <span class="inline-flex shrink-0 items-center gap-0.5 text-primary-600 dark:text-primary-400">
                查看详情
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3"
                  aria-hidden="true"
                />
              </span>
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>

    <UButton
      v-if="props.viewAllTo"
      :to="props.viewAllTo"
      color="neutral"
      variant="outline"
      size="sm"
      class="mt-4 w-full"
      icon="i-lucide-arrow-right"
    >
      {{ props.viewAllLabel }}
    </UButton>
  </section>
</template>
