<script setup lang="ts">
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import {
  activities,
  cancelActivityRegistration
} from '@/features/account/lib/account'
import { registrationStateLabel } from '@/shared/lib/domain-labels'
import { formatDateTimeCompact } from '@/shared/lib/date'

/** 我的活动（FE-070 /me/activities）。 */
const toast = useToast()

function cancel(id: string) {
  cancelActivityRegistration(id)
  toast.add({
    title: '已取消报名',
    description: '该活动报名已取消。',
    color: 'neutral',
    icon: 'i-lucide-x-circle'
  })
}
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      我的活动
    </h1>
    <p class="mt-1 text-sm text-muted">
      我报名的活动。
    </p>

    <ul
      v-if="activities.length"
      class="mt-6 space-y-3"
    >
      <li
        v-for="activity in activities"
        :key="activity.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <RouterLink
              :to="activity.detailPath"
              class="text-sm font-semibold text-highlighted hover:text-primary-600"
            >
              {{ activity.title }}
            </RouterLink>
            <p class="mt-1 text-xs text-muted">
              {{ formatDateTimeCompact(activity.startAt) }} · {{ activity.location }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="activity.registrationState === 'OPEN' ? 'success' : 'neutral'"
          >
            {{ registrationStateLabel[activity.registrationState] }}
          </UBadge>
        </div>

        <div
          v-if="activity.registrationState === 'OPEN'"
          class="mt-3"
        >
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x-circle"
            @click="cancel(activity.id)"
          >
            取消报名
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="mt-6 text-sm text-muted"
    >
      你还没有报名任何活动。
    </p>
  </AccountSubPage>
</template>
