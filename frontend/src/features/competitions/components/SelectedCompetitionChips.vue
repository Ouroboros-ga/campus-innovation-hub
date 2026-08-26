<script setup lang="ts">
import { computed } from 'vue'

import {
  competitionCategoryLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'

import {
  competitionStatusOptions,
  type CompetitionQuery
} from '../lib/competitionFilters'

/**
 * 竞赛「已选条件」chips（FE-020 竞赛页，参考图）。
 *
 * - 仅当存在生效筛选时渲染；每条可单独移除（×），并有「清空全部」；
 * - 移除单条通过把对应 key 置空字符串实现（URL-backed，updateQuery 会移除该参数）；
 * - §9：chips 允许 pill 形状；§43：条件文案陈述事实。
 */
const props = defineProps<{ query: CompetitionQuery }>()
const emit = defineEmits<{
  change: [patch: Partial<CompetitionQuery>]
  reset: []
}>()

function statusLabel(value: string): string {
  return (
    competitionStatusOptions.find(option => option.value === value)?.label ??
    value
  )
}

const chips = computed(() => {
  const result: Array<{ key: string; label: string }> = []
  if (props.query.q) result.push({ key: 'q', label: `关键词：${props.query.q}` })
  if (props.query.status) {
    result.push({ key: 'status', label: statusLabel(props.query.status) })
  }
  if (props.query.category) {
    result.push({
      key: 'category',
      label: competitionCategoryLabel[props.query.category as keyof typeof competitionCategoryLabel] ?? props.query.category
    })
  }
  if (props.query.format) {
    result.push({
      key: 'format',
      label: participationModeLabel[props.query.format as keyof typeof participationModeLabel] ?? props.query.format
    })
  }
  return result
})

function clearChip(key: string) {
  emit('change', { [key]: '' })
}
</script>

<template>
  <div
    v-if="chips.length"
    class="flex flex-wrap items-center gap-2"
  >
    <span class="text-sm text-muted">
      已选条件：
    </span>
    <button
      v-for="chip in chips"
      :key="chip.key"
      type="button"
      class="inline-flex items-center gap-1 rounded-full border border-default bg-surface px-2.5 py-1 text-xs text-highlighted transition-colors hover:border-primary-300"
      :aria-label="`移除条件：${chip.label}`"
      @click="clearChip(chip.key)"
    >
      {{ chip.label }}
      <UIcon
        name="i-lucide-x"
        class="size-3.5 text-muted"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="inline-flex min-h-7 items-center text-sm text-muted transition-colors hover:text-primary-600"
      @click="emit('reset')"
    >
      清空全部
    </button>
  </div>
</template>
