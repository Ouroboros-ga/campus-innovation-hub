<script setup lang="ts">
import { computed } from 'vue'

import type { CompetitionDetail } from '../types'

/**
 * 关键时间线（按参考设计稿）。
 * 左侧圆点 + 连接线，右侧标题 + 日期；高亮当前关注节点（如「报名截止」）。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

const items = computed(() => props.detail.timeline)
const hasItems = computed(() => items.value.length > 0)

/** 格式化：首日全日期，后续同日仅时间，避免 2026.08.01 00:00 冗余 */
function formatNode(value: string, index: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const curDay = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  const prev = index > 0 ? items.value[index - 1] : null
  const prevDay = prev ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(prev.date)) : null
  const isSameDay = prevDay === curDay
  if (isSameDay) {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  }
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date).replace('周', '')
  const datePart = curDay.replace(/\//g, '.')
  const timePart = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
  return `${datePart} ${weekday} ${timePart}`
}
</script>

<template>
  <p
    v-if="!hasItems"
    class="text-sm text-muted"
  >
    暂无时间安排，以官方通知为准。
  </p>

  <ol
    v-else
    class="relative space-y-0"
  >
    <li
      v-for="(node, index) in items"
      :key="node.title + node.date"
      class="relative flex items-start gap-3"
    >
      <span class="relative flex h-[1.625rem] flex-col items-center">
        <span
          class="mt-1.5 size-2.5 rounded-full"
          :class="node.highlighted ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'"
        />
        <span
          v-if="index < items.length - 1"
          class="w-px flex-1 bg-border"
        />
      </span>

      <div class="flex min-w-0 flex-1 flex-col gap-1 pb-4 last:pb-0">
        <div class="flex items-baseline justify-between gap-3">
          <span
            class="truncate text-sm"
            :class="node.highlighted ? 'font-medium text-highlighted' : 'text-highlighted'"
          >
            {{ node.title }}
          </span>
          <span class="shrink-0 text-xs tabular-nums text-muted">
            {{ formatNode(node.date, index) }}
          </span>
        </div>
        <p
          v-if="node.description"
          class="line-clamp-3 text-xs leading-5 text-muted"
        >
          {{ node.description }}
        </p>
      </div>
    </li>
  </ol>
</template>
