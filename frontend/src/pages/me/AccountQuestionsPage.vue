<script setup lang="ts">
import AccountSubPage from '@/features/account/components/AccountSubPage.vue'
import {
  questionStateLabel,
  questionVisibilityLabel,
  questions
} from '@/features/account/lib/account'
import { formatCompactDate } from '@/shared/lib/date'

/** 我的咨询（FE-070 /me/questions）。 */
</script>

<template>
  <AccountSubPage>
    <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
      我的咨询
    </h1>
    <p class="mt-1 text-sm text-muted">
      我发起的提问与公开问答。
    </p>

    <ul
      v-if="questions.length"
      class="mt-6 space-y-3"
    >
      <li
        v-for="question in questions"
        :key="question.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <RouterLink
              :to="question.detailPath"
              class="text-sm font-semibold text-highlighted hover:text-primary-600"
            >
              {{ question.title }}
            </RouterLink>
            <p class="mt-1 text-xs text-muted">
              {{ questionVisibilityLabel[question.visibility] }} ·
              更新于 {{ formatCompactDate(question.updatedAt) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="question.state === 'ANSWERED' ? 'success' : 'warning'"
          >
            {{ questionStateLabel[question.state] }}
          </UBadge>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="mt-6 text-sm text-muted"
    >
      你还没有发起任何咨询。
    </p>
  </AccountSubPage>
</template>
