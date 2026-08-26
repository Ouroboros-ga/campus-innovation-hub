<script setup lang="ts">
import { computed } from 'vue'

import {
  activityTypeIcon,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type { RegistrationState } from '@/shared/types/homepage'

import { deriveActivityRegistrationState } from '../lib/dynamicsFilters'
import { formatActivityRange } from '../lib/dynamicsFormat'
import type { DynamicsActivity } from '../types'

/**
 * 校园动态-活动浏览卡（桌面「近期活动」卡片 / 活动 tab 网格）。
 *
 * 参考设计稿（FE 双端建设）：封面 + 报名状态徽标 + 标题 + 摘要 + 日程 +
 * 地点 + 主办 + 名额；整卡链接到活动详情。
 *
 * 设计来源：FrontendDesign.md §23（organization card 画布）、§43（陈述事实）、
 * §45（避免卡片嵌套）；封面占位用类型图标 + 统一色块（§17.3 / §39），不生成随机 AI 图。
 */
const props = defineProps<{ activity: DynamicsActivity }>()

const now = computed(() => new Date())
const state = computed<RegistrationState>(() =>
  deriveActivityRegistrationState(props.activity, now.value)
)
const rangeText = computed(() =>
  formatActivityRange(props.activity.startAt, props.activity.endAt)
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
    class="group flex h-full flex-col overflow-hidden rounded-card border border-default bg-default transition-shadow hover:shadow-sm"
  >
    <!-- 封面 / 占位 -->
    <div class="relative aspect-[16/9] overflow-hidden">
      <img
        v-if="props.activity.cover.src"
        :src="props.activity.cover.src"
        :alt="props.activity.cover.alt"
        class="absolute inset-0 size-full object-cover"
        :style="{ objectPosition: props.activity.cover.position ?? 'center' }"
      >
      <span
        v-else
        class="absolute inset-0 flex items-center justify-center bg-primary-50 dark:bg-primary-950/40"
        aria-hidden="true"
      >
        <UIcon
          :name="activityTypeIcon[props.activity.activityType]"
          class="size-10 text-primary-600 dark:text-primary-400"
        />
      </span>
      <UBadge
        size="sm"
        variant="soft"
        :color="stateColor(state)"
        class="absolute left-3 top-3"
      >
        {{ registrationStateLabel[state] }}
      </UBadge>
    </div>

    <!-- 信息 -->
    <div class="flex flex-1 flex-col p-4">
      <h3 class="line-clamp-2 text-base font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600">
        {{ props.activity.title }}
      </h3>
      <p
        v-if="props.activity.summary"
        class="mt-1 line-clamp-1 text-sm text-muted"
      >
        {{ props.activity.summary }}
      </p>

      <dl class="mt-3 space-y-1.5 text-xs text-toned">
        <div
          v-if="rangeText"
          class="flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-clock"
            class="size-3.5 shrink-0 text-muted"
            aria-hidden="true"
          />
          <span class="tabular-nums">{{ rangeText }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UIcon
            name="i-lucide-map-pin"
            class="size-3.5 shrink-0 text-muted"
            aria-hidden="true"
          />
          <span class="line-clamp-1">{{ props.activity.location }}</span>
        </div>
        <div
          v-if="props.activity.organizerName"
          class="flex items-center gap-1.5"
        >
          <UIcon
            name="i-lucide-building-2"
            class="size-3.5 shrink-0 text-muted"
            aria-hidden="true"
          />
          <span class="line-clamp-1">{{ props.activity.organizerName }}</span>
        </div>
      </dl>

      <div class="mt-3 flex items-center justify-between border-t border-default pt-3">
        <span
          v-if="props.activity.capacity != null"
          class="flex items-center gap-1 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-users"
            class="size-3.5"
            aria-hidden="true"
          />
          {{ props.activity.capacity }} 人
        </span>
        <span
          v-else
          class="text-xs text-muted"
        >
          不限名额
        </span>
        <span
          class="text-xs font-medium"
          :class="state === 'OPEN' ? 'text-success-600 dark:text-success-400' : state === 'UPCOMING' ? 'text-warning-600 dark:text-warning-400' : 'text-muted'"
        >
          {{ registrationStateLabel[state] }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
