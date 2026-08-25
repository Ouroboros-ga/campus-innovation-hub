<script setup lang="ts">
import { computed } from 'vue'

import { formatCompactDate, getDeadlineInfo } from '@/shared/lib/date'
import type { DeadlineLike } from '@/shared/lib/date'

/**
 * 截止时间展示文本（FE-008）。
 *
 * 设计来源：
 * - FrontendDesign.md §43：剩余时间陈述事实（「还有 3 天截止」「已截止」）；
 * - §7.3：紧急状态使用语义色（danger），同时保留文字，不只靠颜色；
 * - §24：状态必须文字可读，颜色只是辅助。
 */
const props = withDefaults(
  defineProps<{
    deadlineAt: DeadlineLike
    /** 测试用「当前时间」，默认取运行时 now。 */
    now?: Date
  }>(),
  { now: () => new Date() }
)

const nowDate = computed(() => props.now ?? new Date())
const info = computed(() => getDeadlineInfo(props.deadlineAt, nowDate.value))
const dateText = computed(() => formatCompactDate(props.deadlineAt))

const urgencyTextClass = computed(() => {
  if (info.value.urgency === 'EXPIRED') return 'text-muted'
  if (info.value.urgency === 'URGENT') return 'text-danger-600 dark:text-danger-500'
  return 'text-muted'
})

const alive = computed(() => info.value.remainingDays != null)
</script>

<template>
  <div class="leading-tight">
    <p
      v-if="alive"
      class="text-sm font-medium"
      :class="urgencyTextClass"
    >
      {{ info.label }}
    </p>
    <p class="mt-1 text-xs text-muted">
      {{ dateText }} 截止
    </p>
  </div>
</template>
