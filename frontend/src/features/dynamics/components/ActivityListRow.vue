<script setup lang="ts">
import { computed } from 'vue'

import {
  activityTypeIcon,
  activityTypeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import { formatDateTimeCompact } from '@/shared/lib/date'
import type { RegistrationState } from '@/shared/types/homepage'

import { deriveActivityRegistrationState } from '../lib/dynamicsFilters'
import type { DynamicsActivity } from '../types'

/**
 * 校园动态-活动列表行（FE-050 tab=activities / tab=all 近期活动）。
 *
 * 设计来源：
 * - FE-050：活动列表展示 日期 / 地点 / 报名状态；
 * - §20 / §45：紧凑列表行，单条底边分隔；
 * - §43：时间、地点、报名状态直接陈述事实；报名状态文字可读，不只靠颜色。
 */
const props = defineProps<{ activity: DynamicsActivity }>()

const now = computed(() => new Date())
const state = computed<RegistrationState>(() =>
  deriveActivityRegistrationState(props.activity, now.value)
)

function stateColor(state: RegistrationState): 'success' | 'warning' | 'neutral' {
  if (state === 'OPEN' || state === 'NOT_REQUIRED') return 'success'
  if (state === 'UPCOMING') return 'warning'
  return 'neutral'
}
</script>

<template>
  <RouterLink
    :to="props.activity.detailPath"
    class="group flex gap-3 py-3"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
      aria-hidden="true"
    >
      <UIcon
        :name="activityTypeIcon[props.activity.activityType]"
        class="size-[18px] text-primary-600 dark:text-primary-400"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex items-start justify-between gap-2">
        <span
          class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600"
        >
          {{ props.activity.title }}
        </span>
        <UBadge
          size="sm"
          variant="soft"
          :color="stateColor(state)"
          class="shrink-0"
        >
          {{ registrationStateLabel[state] }}
        </UBadge>
      </span>
      <span class="mt-0.5 block text-xs tabular-nums text-muted">
        {{ activityTypeLabel[props.activity.activityType] }} ·
        {{ formatDateTimeCompact(props.activity.startAt) }}
      </span>
      <span class="mt-0.5 block line-clamp-1 text-xs text-muted">
        {{ props.activity.location }}
      </span>
    </span>
  </RouterLink>
</template>
