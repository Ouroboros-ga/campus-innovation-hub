<script setup lang="ts">
import { useToast } from '@nuxt/ui/composables'

import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import { follows, unfollowCompetition } from '@/features/account/lib/account'
import { formatCompactDate } from '@/shared/lib/date'

/** 我的关注（FE-070 /me/follows）。 */
const toast = useToast()

function unfollow(id: string) {
  unfollowCompetition(id)
  toast.add({
    title: '已取消关注',
    description: '该竞赛已从关注中移除。',
    color: 'neutral',
    icon: 'i-lucide-heart-off'
  })
}
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      我的关注
    </h1>
    <p class="mt-1 text-sm text-muted">
      你关注的竞赛。
    </p>

    <ul
      v-if="follows.length"
      class="mt-6 space-y-3"
    >
      <li
        v-for="item in follows"
        :key="item.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ item.name }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ item.edition }} · 截止 {{ formatCompactDate(item.deadlineAt) }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <UButton
              :to="item.detailPath"
              size="sm"
              color="neutral"
              variant="soft"
            >
              查看
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-heart-off"
              @click="unfollow(item.id)"
            >
              取消关注
            </UButton>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="mt-6 text-sm text-muted"
    >
      你还没有关注任何竞赛。
    </p>
  </AccountSubPage>
</template>
