<script setup lang="ts">
import { computed } from 'vue'

import {
  formatCompactDate
} from '@/shared/lib/date'
import {
  organizationTypeIcon,
  organizationTypeLabel
} from '@/shared/lib/domain-labels'

import {
  deriveRecruitmentState
} from '../lib/organizationFilters'
import {
  orgRecruitmentStateDotClass,
  orgRecruitmentStateLabel,
  orgRecruitmentStateTextClass
} from '../lib/organizationLabels'
import type { OrganizationSummary } from '../types'

/**
 * 组织卡（FE-040 / §23 / PageMap §组织卡）。
 *
 * 展示：Logo、名称、类型、一句简介、招新状态；操作：查看组织 + 查看招新（如有）。
 * Logo 占位阶段用类型图标 + 统一色块（§39 受控默认身份图），不生成随机 AI 图。
 * 设计来源：§24（仅语义状态/简短分类徽标）、§43（状态陈述事实）、§45（避免盒中盒）。
 */
const props = defineProps<{ org: OrganizationSummary }>()

const now = computed(() => new Date())
const state = computed(() => deriveRecruitmentState(props.org, now.value))
const upComingAt = computed(() =>
  props.org.recruitment?.applyStartAt
    ? formatCompactDate(props.org.recruitment.applyStartAt)
    : ''
)
/** 已暂停 / 不招新时不提供「查看招新」入口。 */
const canViewRecruitment = computed(
  () =>
    Boolean(props.org.recruitmentPath) &&
    state.value !== 'PAUSED' &&
    state.value !== 'NOT_RECRUITING'
)
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-card border border-default bg-default p-4"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-surface bg-primary-50 dark:bg-primary-950/40"
        aria-hidden="true"
      >
        <UIcon
          :name="organizationTypeIcon[props.org.type]"
          class="size-6 text-primary-600 dark:text-primary-400"
        />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ props.org.name }}
          </h3>
          <UBadge
            size="sm"
            variant="outline"
            color="neutral"
          >
            {{ organizationTypeLabel[props.org.type] }}
          </UBadge>
        </div>
        <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted">
          {{ props.org.description }}
        </p>
      </div>
    </div>

    <p class="mt-3 flex items-center gap-1.5 text-xs">
      <span
        class="inline-block size-2 rounded-full"
        :class="orgRecruitmentStateDotClass(state)"
        aria-hidden="true"
      />
      <span
        class="font-medium"
        :class="orgRecruitmentStateTextClass(state)"
      >
        {{ orgRecruitmentStateLabel[state] }}
      </span>
      <span
        v-if="state === 'UPCOMING' && upComingAt"
        class="text-muted"
      >
        （{{ upComingAt }} 起）
      </span>
    </p>

    <div class="mt-3 flex flex-wrap gap-2 border-t border-default pt-3">
      <UButton
        :to="props.org.detailPath"
        color="neutral"
        variant="soft"
        size="sm"
      >
        查看组织
      </UButton>
      <UButton
        v-if="canViewRecruitment"
        :to="props.org.recruitmentPath!"
        color="neutral"
        variant="outline"
        size="sm"
      >
        查看招新
      </UButton>
    </div>
  </article>
</template>
