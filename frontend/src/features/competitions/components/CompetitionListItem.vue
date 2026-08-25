<script setup lang="ts">
import { computed } from 'vue'

import {
  deriveRegistrationState,
  formatCompactDate
} from '@/shared/lib/date'
import {
  competitionCategoryIcon,
  competitionLevelLabel,
  participationModeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type {
  CompetitionSummary,
  RegistrationState
} from '@/shared/types/homepage'

/**
 * 竞赛紧凑列表行（FE-020，手机端 §34.4）。
 *
 * 结构：缩略图 + 名称 + 级别/形式 + 状态 + 报名截止。
 * 使用单条底边分隔，不做卡片墙；状态与截止时间文字可读、不截断。
 */
const props = defineProps<{ item: CompetitionSummary }>()

const state = computed(() =>
  deriveRegistrationState({
    required: true,
    startAt: props.item.registrationStartAt,
    endAt: props.item.registrationEndAt,
    now: new Date()
  })
)

const deadlineText = computed(() => formatCompactDate(props.item.registrationEndAt))

function statusClass(state: RegistrationState): string {
  if (state === 'OPEN') return 'text-success-600 dark:text-success-400'
  if (state === 'UPCOMING') return 'text-warning-600 dark:text-warning-400'
  return 'text-muted'
}
</script>

<template>
  <RouterLink
    :to="item.detailPath"
    class="group flex items-center gap-3 py-3"
  >
    <span
      class="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-card bg-primary-900"
      aria-hidden="true"
    >
      <span
        class="absolute inset-0 opacity-[0.08]"
        style="background-image: repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)"
      />
      <UIcon
        :name="competitionCategoryIcon[item.category]"
        class="relative size-5 text-white/80"
      />
    </span>

    <span class="min-w-0 flex-1">
      <span
        class="block line-clamp-1 text-sm font-semibold text-highlighted transition-colors group-hover:text-primary-600"
      >
        {{ item.name }}
      </span>
      <span class="mt-1 flex flex-wrap items-center gap-1.5">
        <UBadge
          size="sm"
          variant="soft"
          color="neutral"
        >
          {{ competitionLevelLabel[item.level] }}
        </UBadge>
        <UBadge
          size="sm"
          variant="soft"
          color="neutral"
        >
          {{ participationModeLabel[item.participationMode] }}
        </UBadge>
      </span>
    </span>

    <span class="shrink-0 text-right">
      <span
        class="block text-xs font-medium"
        :class="statusClass(state)"
      >
        {{ registrationStateLabel[state] }}
      </span>
      <span class="mt-0.5 block text-xs tabular-nums text-muted">
        {{ deadlineText }} 截止
      </span>
    </span>
  </RouterLink>
</template>
