<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  deriveRegistrationState,
  formatCompactDate,
  getDeadlineInfo
} from '@/shared/lib/date'
import {
  competitionLevelLabel,
  participationModeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import type { RegistrationState } from '@/shared/types/homepage'
import type { CompetitionDetail } from '../types'

/**
 * 竞赛详情页顶部信息（FE-021）。
 *
 * 设计来源：PageMap 竞赛详情（名称 / 级别 / 个人团队 / 状态 / 报名截止 / 剩余时间），
 * FrontendDesign §34.7 / §16.3（详情壳 Back Header + 主任务明显）。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

const nowDate = computed(() => new Date())
const state = computed(() =>
  deriveRegistrationState({
    required: true,
    startAt: props.detail.registrationStartAt,
    endAt: props.detail.registrationEndAt,
    now: nowDate.value
  })
)

const deadlineText = computed(() => formatCompactDate(props.detail.registrationEndAt))
const deadlineInfo = computed(() => getDeadlineInfo(props.detail.registrationEndAt, nowDate.value))

const followed = ref(false)

function statusClass(state: RegistrationState): string {
  if (state === 'OPEN') return 'text-success-600 dark:text-success-400'
  if (state === 'UPCOMING') return 'text-warning-600 dark:text-warning-400'
  return 'text-muted'
}

/** 主任务：团队赛优先「查看组队」，其次官网，最后报名方式。 */
const primaryAction = computed(() => {
  if (props.detail.participationMode === 'TEAM') {
    return { label: '查看组队', to: '/teams', icon: 'i-lucide-users' }
  }
  if (props.detail.officialUrl) {
    return {
      label: '查看官网',
      href: props.detail.officialUrl,
      icon: 'i-lucide-external-link'
    }
  }
  return { label: '查看报名方式', to: '/qa', icon: 'i-lucide-arrow-right' }
})
</script>

<template>
  <header>
    <RouterLink
      to="/competitions"
      class="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary-600"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4"
        aria-hidden="true"
      />
      返回竞赛列表
    </RouterLink>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <span
        class="text-sm font-medium"
        :class="statusClass(state)"
      >
        {{ registrationStateLabel[state] }}
      </span>
      <UBadge
        size="sm"
        variant="soft"
        color="neutral"
      >
        {{ competitionLevelLabel[detail.level] }}
      </UBadge>
      <UBadge
        size="sm"
        variant="soft"
        color="neutral"
      >
        {{ participationModeLabel[detail.participationMode] }}
      </UBadge>
    </div>

    <h1 class="mt-2 text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
      {{ detail.name }}
    </h1>
    <p class="mt-1 text-sm text-muted">{{ detail.edition }} 年度赛事</p>

    <div class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
      <p class="text-muted">
        报名截止
        <span class="font-medium text-highlighted">{{ deadlineText }}</span>
        <span
          v-if="deadlineInfo.label"
          class="ml-2"
          :class="statusClass(state)"
        >
          {{ deadlineInfo.label }}
        </span>
      </p>
      <p
        v-if="detail.participationMode === 'TEAM'"
        class="text-muted"
      >
        参赛形式
        <span class="font-medium text-highlighted">团队赛（需组队）</span>
      </p>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <UButton
        :to="primaryAction.to"
        :href="primaryAction.href"
        :target="primaryAction.href ? '_blank' : undefined"
        :rel="primaryAction.href ? 'noopener noreferrer' : undefined"
        color="primary"
        variant="solid"
        size="md"
        :icon="primaryAction.icon"
      >
        {{ primaryAction.label }}
      </UButton>

      <UButton
        v-if="detail.officialUrl"
        :href="detail.officialUrl"
        target="_blank"
        rel="noopener noreferrer"
        color="neutral"
        variant="ghost"
        icon="i-lucide-external-link"
      >
        官方网站
      </UButton>

      <UButton
        v-if="detail.participationMode === 'TEAM'"
        to="/teams"
        color="neutral"
        variant="ghost"
        icon="i-lucide-user-plus"
      >
        发布组队
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        :icon="followed ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
        @click="followed = !followed"
      >
        {{ followed ? '已关注' : '关注' }}
      </UButton>
    </div>
  </header>
</template>
