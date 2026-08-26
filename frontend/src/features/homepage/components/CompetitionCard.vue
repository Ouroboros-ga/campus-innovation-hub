<script setup lang="ts">
import { computed, ref } from 'vue'

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
 * 竞赛卡片（FE-009 首页 / FE-020 竞赛列表共用的第一张卡）。
 *
 * 设计来源：
 * - FrontendDesign.md §21：封面 / 名称 / 级别 / 个人团队 / 状态 / 截止 / 官网或详情；
 *   最多 3 个徽标，2 秒可扫读，不堆 6+ 标签；可选 slogan 置于封面；
 * - §24：仅用语义状态/简短分类做徽标；§39：无官方图用受控默认封面（低调几何）；
 * - §38：预留图片、`object-fit: cover`、懒加载；§43：状态与截止陈述事实。
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

/** 关注（mock：无后端，仅本地切换，不展示虚假计数 §28）。 */
const followed = ref(false)

/** 报名状态 → 文字语义色（§7.3，状态文字不只靠颜色表达时仍可读）。 */
function stateTextClass(state: RegistrationState): string {
  if (state === 'OPEN') return 'text-success-600 dark:text-success-400'
  if (state === 'UPCOMING' || state === 'FULL') {
    return 'text-warning-600 dark:text-warning-400'
  }
  return 'text-muted'
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
          <div>
            <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {{ item.name }}
            </h3>
            <p
              v-if="item.slogan"
              class="mt-0.5 line-clamp-1 text-xs text-white/75"
            >
              {{ item.slogan }}
            </p>
          </div>
        </div>
      </div>
    </RouterLink>

    <div class="flex flex-1 flex-col p-3 sm:p-4">
      <div class="flex flex-wrap gap-1.5">
        <UBadge
          size="sm"
          variant="outline"
          color="neutral"
        >
          {{ competitionLevelLabel[item.level] }}
        </UBadge>
        <UBadge
          size="sm"
          variant="outline"
          color="neutral"
        >
          {{ participationModeLabel[item.participationMode] }}
        </UBadge>
        <UBadge
          v-if="item.crossSchool"
          size="sm"
          variant="outline"
          color="neutral"
        >
          支持跨校组队
        </UBadge>
      </div>

      <p class="mt-3 text-xs">
        <span
          class="font-medium"
          :class="stateTextClass(registrationState)"
        >
          {{ registrationStateLabel[registrationState] }}
        </span>
        <span class="text-muted"> · 截止：</span>
        <span class="font-medium text-muted">
          {{ deadlineText }}
        </span>
      </p>

      <div class="mt-auto flex items-center gap-2 pt-3">
        <UButton
          :to="item.detailPath"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-arrow-right"
          trailing
        >
          查看详情
        </UButton>
        <a
          v-if="item.officialUrl"
          :href="item.officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-9 items-center gap-1 px-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          官网
          <UIcon
            name="i-lucide-external-link"
            class="size-3.5"
            aria-hidden="true"
          />
        </a>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-heart"
          :class="{ 'text-danger-600 dark:text-danger-400': followed }"
          :aria-pressed="followed"
          @click="followed = !followed"
        >
          {{ followed ? '已关注' : '关注' }}
        </UButton>
      </div>
    </div>
  </article>
</template>
