<script setup lang="ts">
import type { SelectOption } from '../lib/organizationFilters'

/**
 * 组织筛选分段按钮组（FE-040）。
 *
 * - 一行骨架按钮，含「全部」+ 各选项；选中态可见（主色文字 + 边框），不只靠颜色；
 * - 键盘可达（原生 button 可 focus，Space/Enter 触发）；
 * - URL 承载（由页面写入 query），不建独立手机筛选状态。
 */
const props = defineProps<{
  label: string
  modelValue: string
  options: SelectOption[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const displayOptions = [
  { label: '全部', value: 'ALL' },
  ...(props.options as Array<{ label: string; value: string }>)
]
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap items-center gap-2"
  >
    <span class="shrink-0 text-sm text-muted">
      {{ label }}：
    </span>
    <button
      v-for="option in displayOptions"
      :key="option.value"
      type="button"
      class="inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors"
      :class="
        modelValue === option.value
          ? 'border-primary text-primary'
          : 'border-default text-muted hover:text-highlighted'
      "
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
