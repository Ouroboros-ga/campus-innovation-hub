<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import {
  applicationStateLabel,
  applications,
  withdrawApplication
} from '@/features/account/lib/account'
import { formatCompactDate } from '@/shared/lib/date'

/** 我的申请（FE-070 /me/applications）：全部 / 组队申请 / 组织申请。 */
const toast = useToast()
const tab = ref<'ALL' | 'TEAM' | 'ORG'>('ALL')

const stateColor = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral'
} as const

const tabs = [
  { value: 'ALL', label: '全部' },
  { value: 'TEAM', label: '组队申请' },
  { value: 'ORG', label: '组织申请' }
] as const

const rows = computed(() =>
  tab.value === 'ALL'
    ? applications
    : applications.filter(application => application.targetType === tab.value)
)

function withdraw(id: string) {
  withdrawApplication(id)
  toast.add({
    title: '已撤回',
    description: '该申请已撤回。',
    color: 'neutral',
    icon: 'i-lucide-undo'
  })
}
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      我的申请
    </h1>
    <p class="mt-1 text-sm text-muted">
      组队与组织的申请进度。
    </p>

    <div
      role="group"
      aria-label="申请类型筛选"
      class="mt-4 flex gap-2"
    >
      <UButton
        v-for="item in tabs"
        :key="item.value"
        size="sm"
        color="neutral"
        :variant="tab === item.value ? 'solid' : 'outline'"
        :aria-pressed="tab === item.value"
        @click="tab = item.value"
      >
        {{ item.label }}
      </UButton>
    </div>

    <ul
      v-if="rows.length"
      class="mt-6 space-y-3"
    >
      <li
        v-for="application in rows"
        :key="application.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ application.targetName }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ application.targetType === 'TEAM' ? '组队申请' : '组织申请' }}
              <span v-if="application.positionName"> · {{ application.positionName }}</span>
              · 提交于 {{ formatCompactDate(application.submittedAt) }}
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

        <div
          v-if="application.state === 'PENDING'"
          class="mt-3"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-undo"
            @click="withdraw(application.id)"
          >
            撤回申请
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="mt-6 text-sm text-muted"
    >
      暂无相关申请。
    </p>
  </AccountSubPage>
</template>
