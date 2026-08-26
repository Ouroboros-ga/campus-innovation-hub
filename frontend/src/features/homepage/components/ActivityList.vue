<script setup lang="ts">
import { computed } from 'vue'

import { recentActivities } from '@/mocks/fixtures/homepage'
import {
  deriveRegistrationState,
  formatDateTimeCompact
} from '@/shared/lib/date'
import {
  activityTypeIcon,
  activityTypeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type {
  ActivitySummary,
  RegistrationState
} from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「近期活动」区块（FE-011）。
 *
 * 设计来源：
 * - FrontendDesign.md §20：活动是独立对象，可用紧凑列表；
 * - PageMap 首页-近期活动：活动名称、时间、地点、报名状态；
 * - 报名状态由报名时段派生（无报名要求 / 报名中 / 报名已结束）；
 * - §45：紧凑列表，单条底边分隔；不隐藏报名状态与时间。
 */
const props = withDefaults(
  defineProps<{ items?: ActivitySummary[] }>(),
  { items: () => recentActivities }
)

const nowDate = computed(() => new Date())

function stateColor(state: RegistrationState): 'success' | 'warning' | 'neutral' {
  if (state === 'OPEN') return 'success'
  if (state === 'UPCOMING') return 'warning'
  return 'neutral'
}

function derivedState(item: ActivitySummary): RegistrationState {
  return deriveRegistrationState({
    required: item.registrationRequired,
    startAt: null,
    endAt: item.registrationEndAt,
    now: nowDate.value
  })
}
</script>

<template>
  <section>
    <SectionHeader
      title="近期活动"
      to="/activities?tab=activities"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="activityTypeIcon[item.activityType]"
              class="size-[18px] text-primary-600 dark:text-primary-400"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-start justify-between gap-2">
              <span
                class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600"
              >
                {{ item.title }}
              </span>
              <UBadge
                size="sm"
                variant="soft"
                :color="stateColor(derivedState(item))"
                class="shrink-0"
              >
                {{ registrationStateLabel[derivedState(item)] }}
              </UBadge>
            </span>
            <span class="mt-0.5 block text-xs tabular-nums text-muted">
              {{ activityTypeLabel[item.activityType] }} ·
              {{ formatDateTimeCompact(item.startAt) }}
            </span>
            <span class="mt-0.5 block line-clamp-1 text-xs text-muted">
              {{ item.location }}
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
