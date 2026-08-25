<script setup lang="ts">
import { computed } from 'vue'

import { formatFullDate } from '@/shared/lib/date'
import type { CompetitionDetail } from '../types'

/**
 * 竞赛时间线（FE-021）。
 * 设计来源：PageMap 竞赛详情（日期 / 标题 / 说明），适用时使用 UTimeline。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

const items = computed(() =>
  props.detail.timeline.map(node => ({
    title: node.title,
    description: `${formatFullDate(node.date)}${node.description ? ` · ${node.description}` : ''}`
  }))
)
</script>

<template>
  <p
    v-if="items.length === 0"
    class="text-sm text-muted"
  >
    暂无时间安排，以官方通知为准。
  </p>
  <UTimeline
    v-else
    :items="items"
    class="mt-2"
  />
</template>
