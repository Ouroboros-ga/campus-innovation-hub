<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { formatCompactDate } from '@/shared/lib/date'

import {
  applicationStateLabel,
  managedApplications,
  type ManagedApplication
} from '@/features/organizations/lib/orgManagement'
import type { RecruitmentApplicationState } from '@/features/organizations/types'

/** 申请管理（FE-080 / PageMap §招新申请管理）。 */
const route = useRoute()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')

const apps = ref<ManagedApplication[]>(managedApplications(orgId))
const filter = ref<'ALL' | RecruitmentApplicationState>('ALL')

const stateColor: Record<RecruitmentApplicationState, 'neutral' | 'success' | 'warning' | 'info'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral'
}

const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'ACCEPTED', label: '已接受' },
  { value: 'REJECTED', label: '已拒绝' }
] as const

const filtered = computed(() =>
  filter.value === 'ALL'
    ? apps.value
    : apps.value.filter(application => application.state === filter.value)
)

function decide(id: string, state: RecruitmentApplicationState) {
  const application = apps.value.find(item => item.id === id)
  if (application) application.state = state
  toast.add({
    title: state === 'ACCEPTED' ? '已接受' : '已拒绝',
    description: '操作完成（mock）。',
    color: state === 'ACCEPTED' ? 'success' : 'neutral',
    icon: state === 'ACCEPTED' ? 'i-lucide-check-circle' : 'i-lucide-x-circle'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-highlighted">
        申请管理
      </h2>
    </div>

    <div
      role="group"
      aria-label="申请状态筛选"
      class="flex flex-wrap gap-2"
    >
      <UButton
        v-for="item in filters"
        :key="item.value"
        size="sm"
        color="neutral"
        :variant="filter === item.value ? 'solid' : 'outline'"
        :aria-pressed="filter === item.value"
        @click="filter = item.value"
      >
        {{ item.label }}
      </UButton>
    </div>

    <ul
      v-if="filtered.length"
      class="space-y-3"
    >
      <li
        v-for="application in filtered"
        :key="application.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ application.applicantName }}
              <span class="font-normal text-muted">申请 {{ application.positionName }}</span>
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ application.grade }} · {{ application.major }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="stateColor[application.state]"
          >
            {{ applicationStateLabel[application.state] }}
          </UBadge>
        </div>

        <p class="mt-2 text-xs leading-5 text-toned">
          技能：{{ application.skills }} · 简介：{{ application.selfIntro }}
        </p>
        <p class="mt-1 text-xs text-muted">
          提交于 {{ formatCompactDate(application.submittedAt) }}
        </p>

        <div
          v-if="application.state === 'PENDING'"
          class="mt-3 flex gap-2"
        >
          <UButton
            size="sm"
            color="success"
            variant="solid"
            icon="i-lucide-check"
            @click="decide(application.id, 'ACCEPTED')"
          >
            接受
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-x"
            @click="decide(application.id, 'REJECTED')"
          >
            拒绝
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无符合条件的申请。
    </p>
  </div>
</template>
