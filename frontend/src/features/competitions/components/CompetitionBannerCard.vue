<script setup lang="ts">
import { computed } from 'vue'

import { deriveRegistrationState, formatDateTimeCompact } from '@/shared/lib/date'
import {
  competitionLevelLabel,
  participationModeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type {
  CompetitionSummary,
  RegistrationState
} from '@/shared/types/homepage'

/**
 * 竞赛整宽横幅卡（竞赛中心手机端，按设计稿）。
 *
 * 结构：整宽封面（名称 + slogan 叠加）→ 完整标题 → 徽标行（级别 / 形式 / 状态）
 * + 报名截止（右侧）→ 主操作（查看详情 / 官网 两枚按钮）。
 *
 * 状态与截止由日期运行时派生（§12.1）；截止展示为紧凑日期时间。
 */
const props = defineProps<{ item: CompetitionSummary }>()

const nowDate = computed(() => new Date())

const registrationState = computed(() =>
  deriveRegistrationState({
    required: true,
    startAt: props.item.registrationStartAt,
    endAt: props.item.registrationEndAt,
    now: nowDate.value
  })
)

const deadlineText = computed(() =>
  formatDateTimeCompact(props.item.registrationEndAt)
)

const fullTitle = computed(() =>
  props.item.edition
    ? `${props.item.name} · ${props.item.edition}`
    : props.item.name
)

/** 报名状态 → 语义色（仅用于状态徽标，§7.3 / §24）。 */
function stateColor(
  state: RegistrationState
): 'success' | 'warning' | 'neutral' | 'error' {
  switch (state) {
    case 'OPEN':
      return 'success'
    case 'FULL':
    case 'UPCOMING':
      return 'warning'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <article class="overflow-hidden rounded-card border border-default bg-default">
    <RouterLink
      :to="item.detailPath"
      class="relative block aspect-[16/7] overflow-hidden bg-primary-900"
      :aria-label="`查看${item.name}详情`"
    >
      <img
        v-if="item.cover.src"
        :src="item.cover.src"
        :alt="item.cover.alt"
        class="size-full object-cover"
        :style="{ objectPosition: item.cover.position ?? 'center' }"
        loading="lazy"
      >
      <div
        v-else
        class="absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style="background-image: repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)"
      />

      <div class="relative flex h-full flex-col justify-end p-4 sm:p-5">
        <h3 class="line-clamp-2 text-xl font-bold leading-snug text-white">
          {{ item.name }}
        </h3>
        <p
          v-if="item.slogan"
          class="mt-1 line-clamp-1 text-sm text-white/85"
        >
          {{ item.slogan }}
        </p>
      </div>
    </RouterLink>

    <div class="p-4 sm:p-5">
      <p class="line-clamp-2 text-base font-semibold text-highlighted">
        {{ fullTitle }}
      </p>

      <div class="mt-3 flex items-center justify-between gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
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
        <span class="shrink-0 text-xs tabular-nums text-muted">
          报名截止: {{ deadlineText }}
        </span>
      </div>

      <div class="mt-4 flex gap-2">
        <UButton
          :to="item.detailPath"
          variant="outline"
          color="primary"
          class="flex-1"
        >
          查看详情
        </UButton>
        <UButton
          v-if="item.officialUrl"
          :href="item.officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          color="primary"
          icon="i-lucide-globe"
          class="flex-1"
        >
          官网
        </UButton>
      </div>
    </div>
  </article>
</template>
