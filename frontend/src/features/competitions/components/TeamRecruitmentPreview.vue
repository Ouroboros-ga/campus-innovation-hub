<script setup lang="ts">
import type { RecruitingTeam } from '../types'
import CompetitionSectionCard from './CompetitionSectionCard.vue'

/**
 * 组队信息（按参考设计稿）。
 * 队伍卡片（图标 + 标题 + 人数 + 岗位 + 队长 + 申请加入）与「发布组队」卡片。
 */
withDefaults(
  defineProps<{
    teams: RecruitingTeam[]
    actionTo?: string
    actionLabel?: string
  }>(),
  { actionTo: '/teams', actionLabel: '查看更多组队' }
)
</script>

<template>
  <CompetitionSectionCard
    icon="i-lucide-users"
    title="组队信息"
    :action-to="actionTo"
    :action-label="actionLabel"
  >
    <div
      v-if="teams.length"
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        v-for="team in teams"
        :key="team.id"
        class="flex flex-col rounded-surface border border-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2.5">
            <span class="grid size-10 shrink-0 place-items-center rounded-surface bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <UIcon
                name="i-lucide-users"
                class="size-5"
                aria-hidden="true"
              />
            </span>
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-highlighted">
                {{ team.title }}
              </h3>
              <p class="mt-0.5 text-xs text-muted">
                {{ team.baseMemberCount }}/{{ team.targetMemberCount }} 人
              </p>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <UBadge
            v-for="role in team.roles"
            :key="role"
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ role }}
          </UBadge>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <p class="min-w-0 truncate text-xs text-muted">
            队长：<span class="text-highlighted">{{ team.leaderName }}</span>
            <span v-if="team.leaderNote">（{{ team.leaderNote }}）</span>
          </p>
          <UButton
            :to="team.detailPath"
            size="sm"
            color="primary"
            variant="outline"
          >
            申请加入
          </UButton>
        </div>
      </article>

      <article class="flex flex-col items-start justify-between rounded-surface border border-dashed border-border-strong p-4 sm:items-center sm:text-center">
        <div>
          <span class="grid size-10 place-items-center rounded-surface bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <UIcon
              name="i-lucide-user-plus"
              class="size-5"
              aria-hidden="true"
            />
          </span>
          <p class="mt-3 text-sm font-medium text-highlighted">
            还没有找到合适的队伍？
          </p>
          <p class="mt-1 text-xs text-muted">
            发布组队信息，寻找队友
          </p>
        </div>
        <UButton
          to="/teams"
          size="sm"
          color="primary"
          variant="outline"
          class="mt-4 w-full sm:w-auto"
        >
          发布组队
        </UButton>
      </article>
    </div>

    <div
      v-else
      class="rounded-surface border border-dashed border-border-strong p-6 text-center"
    >
      <span class="mx-auto grid size-10 place-items-center rounded-surface bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <UIcon
          name="i-lucide-user-plus"
          class="size-5"
          aria-hidden="true"
        />
      </span>
      <p class="mt-3 text-sm font-medium text-highlighted">
        还没有正在组队的队伍
      </p>
      <p class="mt-1 text-xs text-muted">
        发布组队信息，寻找合适的队友
      </p>
      <UButton
        to="/teams"
        size="sm"
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="mt-4"
      >
        发布组队
      </UButton>
    </div>
  </CompetitionSectionCard>
</template>
