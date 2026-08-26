<script setup lang="ts">
import { computed } from 'vue'

import { opsActivities, opsCompetitions, opsQuestions } from '@/features/ops/lib/opsStore'
import { recruitmentDetails } from '@/mocks/fixtures/organizations'
import { deriveRegistrationState } from '@/shared/lib/date'

/** 平台运营工作台（FE-090 /ops），只显示真实数据计数。 */
const now = computed(() => new Date())

const registeringCompetitions = computed(() =>
  opsCompetitions.filter(
    item =>
      deriveRegistrationState({
        required: true,
        startAt: item.registrationStartAt,
        endAt: item.registrationEndAt,
        now: now.value
      }) === 'OPEN'
  ).length
)

const ongoingActivities = computed(() =>
  opsActivities.filter(activity => {
    const start = new Date(activity.startAt).getTime()
    const end = activity.endAt ? new Date(activity.endAt).getTime() : start
    const t = now.value.getTime()
    return t >= start && t <= end
  }).length
)

const pendingQuestions = computed(
  () => opsQuestions.filter(post => post.status === 'PENDING').length
)

const recruitingCount = computed(
  () =>
    recruitmentDetails.filter(item => item.publicationState === 'PUBLISHED').length
)

const stats = computed(() => [
  { label: '报名中的竞赛', value: registeringCompetitions.value, to: { name: 'ops-competitions' }, icon: 'i-lucide-trophy' },
  { label: '进行中的活动', value: ongoingActivities.value, to: { name: 'ops-activities' }, icon: 'i-lucide-calendar-days' },
  { label: '待回复咨询', value: pendingQuestions.value, to: { name: 'ops-questions' }, icon: 'i-lucide-message-square' },
  { label: '当前招新', value: recruitingCount.value, to: { name: 'ops-activities' }, icon: 'i-lucide-megaphone' }
])
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <RouterLink
      v-for="stat in stats"
      :key="stat.label"
      :to="stat.to"
      class="rounded-card border border-default bg-default p-4"
    >
      <div class="flex items-center gap-2">
        <UIcon
          :name="stat.icon"
          class="size-4 text-muted"
          aria-hidden="true"
        />
        <span class="text-sm text-muted">
          {{ stat.label }}
        </span>
      </div>
      <p class="mt-2 text-3xl font-bold tabular-nums text-highlighted">
        {{ stat.value }}
      </p>
    </RouterLink>
  </div>
</template>
