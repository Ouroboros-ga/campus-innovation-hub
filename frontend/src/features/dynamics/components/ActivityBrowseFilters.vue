<script setup lang="ts">
import type {
  ActivityStatusFilter,
  ActivityTypeFilter
} from '../lib/dynamicsFilters'
import {
  activityStatusOptions,
  activityTypeOptions
} from '../lib/dynamicsFilters'

/**
 * 校园动态-活动筛选（FE-050 tab=activities）。
 *
 * - 状态 / 类型两个维度，UR 承载（由页面写入 `?tab=activities&status=&type=`）；
 * - 使用 Nuxt UI `USelect`，`placeholder` 表达「全部」；不创建手机独立筛选状态。
 */
const props = defineProps<{
  status: ActivityStatusFilter
  type: ActivityTypeFilter
}>()
const emit = defineEmits<{
  change: [patch: { status?: string; type?: string }]
  reset: []
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <USelect
      :model-value="props.status === 'ALL' ? undefined : props.status"
      :items="activityStatusOptions"
      placeholder="全部状态"
      aria-label="活动状态"
      class="w-40"
      @update:model-value="
        v => emit('change', { status: v || undefined })
      "
    />
    <USelect
      :model-value="props.type === 'ALL' ? undefined : props.type"
      :items="activityTypeOptions"
      placeholder="全部类型"
      aria-label="活动类型"
      class="w-40"
      @update:model-value="
        v => emit('change', { type: v || undefined })
      "
    />
    <UButton
      v-if="props.status !== 'ALL' || props.type !== 'ALL'"
      variant="ghost"
      color="neutral"
      icon="i-lucide-rotate-ccw"
      @click="emit('reset')"
    >
      清除筛选
    </UButton>
  </div>
</template>
