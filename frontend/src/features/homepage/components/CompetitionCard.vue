<script setup lang="ts">
import { computed } from 'vue'

import {
  formatCompactDate,
  deriveRegistrationState
} from '@/shared/lib/date'
import {
  competitionCategoryIcon,
  competitionCategoryLabel,
  competitionLevelLabel,
  participationModeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type {
  CompetitionSummary,
  RegistrationState
} from '@/shared/types/homepage'

/**
 * 首页竞赛卡片（FE-009）。
 *
 * 设计来源：
 * - FrontendDesign.md §21：封面 / 名称 / 级别 / 个人团队 / 状态 / 截止 / 官网或详情；
 * - §24：最多 3 个徽标（级别 + 参赛形式 + 状态），避免堆叠徽标行；
 * - §39：无官方图时使用受控系统默认封面（名称 + 分类处理 + 低调几何），不生成随机 AI 图；
 * - §38：预留图片空间、`object-fit: cover`、懒加载；
 * - §43：状态与截止陈述事实。
 */
const props = defineProps<{
  item: CompetitionSummary
}>()

const nowDate = computed(() => new Date())

const registrationState = computed(() =>
  deriveRegistrationState({
    startAt: props.item.registrationStartAt,
    endAt: props.item.registrationEndAt,
    now: nowDate.value
  })
)

const deadlineText = computed(() =>
  formatCompactDate(props.item.registrationEndAt)
)

/** 报名状态 → 语义色（仅用于状态徽标，符合 §7.3 / §24）。 */
function stateColor(state: RegistrationState): 'success' | 'warning' | 'neutral' | 'error' {
  switch (state) {
    case 'OPEN':
      return 'success'
    case 'FULL':
    case 'UPCOMING':
      return 'warning'
    case 'CLOSED':
      return 'neutral'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-card border border-default bg-default transition-colors hover:border-primary-300"
  >
    <RouterLink
      :to="item.detailPath"
      class="block"
      :aria-label="`查看${item.name}详情`"
    >
      <div class="relative aspect-video overflow-hidden bg-primary-900">
        <div
          v-if="item.cover.src"
          class="absolute inset-0"
        >
          <img
            :src="item.cover.src"
            :alt="item.cover.alt"
            class="size-full object-cover"
            :style="{ objectPosition: item.cover.position ?? 'center' }"
            loading="lazy"
          >
        </div>

        <template v-else>
          <div
            class="absolute inset-0 opacity-[0.08]"
            aria-hidden="true"
            style="background-image: repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)"
          />
        </template>

        <div class="relative flex h-full flex-col justify-between p-3 sm:p-4">
          <div class="flex items-start justify-between gap-2">
            <span class="rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-medium text-white/90">
              {{ competitionCategoryLabel[item.category] }}
            </span>
            <UIcon
              :name="competitionCategoryIcon[item.category]"
              class="size-8 text-white/25"
              aria-hidden="true"
            />
          </div>
          <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {{ item.name }}
          </h3>
        </div>
      </div>
    </RouterLink>

    <div class="flex flex-1 flex-col p-3 sm:p-4">
      <div class="flex flex-wrap gap-1.5">
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
        <UBadge
          size="sm"
          variant="soft"
          :color="stateColor(registrationState)"
        >
          {{ registrationStateLabel[registrationState] }}
        </UBadge>
      </div>

      <p class="mt-3 text-xs text-muted">
        报名截止
        <span class="font-medium text-muted">{{ deadlineText }}</span>
      </p>

      <div class="mt-auto flex items-center justify-between gap-2 pt-3">
        <a
          v-if="item.officialUrl"
          :href="item.officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          官网
          <UIcon
            name="i-lucide-external-link"
            class="size-3.5"
            aria-hidden="true"
          />
        </a>
        <RouterLink
          :to="item.detailPath"
          class="inline-flex min-h-9 items-center gap-0.5 text-sm font-medium text-muted transition-colors hover:text-primary-600"
        >
          查看详情
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </div>
  </article>
</template>
