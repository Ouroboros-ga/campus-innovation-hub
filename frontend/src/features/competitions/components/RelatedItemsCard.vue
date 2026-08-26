<script setup lang="ts">
import { formatCompactDate } from '@/shared/lib/date'
import CompetitionSectionCard from './CompetitionSectionCard.vue'

/**
 * 相关通知 / 相关指南卡片（按参考设计稿）。
 * 列表行：圆点 + 标题（左）+ 日期（右），头部可带「查看全部」。
 */
interface RelatedItem {
  id: string
  title: string
  publishedAt: string
  detailPath: string
}

const props = defineProps<{
  icon: string
  title: string
  items: RelatedItem[]
  emptyText: string
  actionTo?: string
  actionLabel?: string
}>()
</script>

<template>
  <CompetitionSectionCard
    :icon="props.icon"
    :title="props.title"
    :action-to="props.actionTo"
    :action-label="props.actionLabel"
  >
    <ul
      v-if="props.items.length"
      class="space-y-3"
    >
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex items-center justify-between gap-3"
        >
          <span class="flex min-w-0 items-center gap-2.5">
            <UIcon
              name="i-lucide-circle"
              class="size-1.5 shrink-0 text-primary-400"
              aria-hidden="true"
            />
            <span class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600">
              {{ item.title }}
            </span>
          </span>
          <span class="shrink-0 text-xs tabular-nums text-muted">
            {{ formatCompactDate(item.publishedAt) }}
          </span>
        </RouterLink>
      </li>
    </ul>
    <p
      v-else
      class="text-sm text-muted"
    >
      {{ props.emptyText }}
    </p>
  </CompetitionSectionCard>
</template>
