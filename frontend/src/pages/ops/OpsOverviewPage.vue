<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { listCompetitions } from '@/features/ops/api/opsCompetitionApi'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listConsultations } from '@/features/ops/api/opsConsultationApi'
import { recruitmentDetails } from '@/mocks/fixtures/organizations'
import { deriveRegistrationState } from '@/shared/lib/date'

/** 平台运营工作台（FE-090 /ops），分类计数来自运营 API。 */
const now = computed(() => new Date())

const competitions = ref<Array<{ registrationStartAt: string | null; registrationEndAt: string | null }>>([])
const activities = ref<Array<{ startAt: string; endAt: string | null }>>([])
const questions = ref<Array<{ status: string }>>([])

onMounted(async () => {
  try {
    competitions.value = (await listCompetitions({})).items
  } catch {
    competitions.value = []
  }
  try {
    activities.value = (await listActivities({})).items
  } catch {
    activities.value = []
  }
  try {
    questions.value = (await listConsultations({})).items
  } catch {
    questions.value = []
  }
})

const registeringCompetitions = computed(
  () =>
    competitions.value.filter(
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
  activities.value.filter(activity => {
    const start = new Date(activity.startAt).getTime()
    const end = activity.endAt ? new Date(activity.endAt).getTime() : start
    const t = now.value.getTime()
    return t >= start && t <= end
  }).length
)

const pendingQuestions = computed(
  () => questions.value.filter(post => post.status === 'PENDING').length
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
