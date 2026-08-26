<script setup lang="ts">
import { computed, ref } from 'vue'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import {
  teamPosts,
  teamPositionLabel
} from '@/features/account/lib/account'
import type { AccountTeamPost } from '@/features/account/types'
import { formatCompactDate } from '@/shared/lib/date'

/** 我的组队（FE-070 /me/teams）：我发布的 / 我加入的。 */
const tab = ref<'PUBLISHED' | 'JOINED'>('PUBLISHED')

const rows = computed(() =>
  teamPosts.filter(post => post.position === tab.value)
)

const statusColor: Record<AccountTeamPost['status'], 'success' | 'warning' | 'neutral'> = {
  RECRUITING: 'success',
  FULL: 'warning',
  CLOSED: 'neutral'
}
const statusLabel: Record<AccountTeamPost['status'], string> = {
  RECRUITING: '招募中',
  FULL: '已满',
  CLOSED: '已关闭'
}

const tabs = [
  { value: 'PUBLISHED', label: '我发布的' },
  { value: 'JOINED', label: '我加入的' }
] as const
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      我的组队
    </h1>
    <p class="mt-1 text-sm text-muted">
      我发布与加入的组队信息。
    </p>

    <div
      role="group"
      aria-label="组队标签筛选"
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
        v-for="post in rows"
        :key="post.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <RouterLink
              :to="post.detailPath"
              class="text-sm font-semibold text-highlighted hover:text-primary-600"
            >
              {{ post.title }}
            </RouterLink>
            <p class="mt-1 text-xs text-muted">
              {{ post.competitionName }} · {{ post.memberCount }}/{{ post.targetMemberCount }} 人
            </p>
            <p class="mt-1 text-xs text-muted">
              发布于 {{ formatCompactDate(post.publishedAt) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="statusColor[post.status]"
          >
            {{ statusLabel[post.status] }}
          </UBadge>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="mt-6 text-sm text-muted"
    >
      暂无{{ teamPositionLabel[tab] }}的组队信息。
    </p>
  </AccountSubPage>
</template>
