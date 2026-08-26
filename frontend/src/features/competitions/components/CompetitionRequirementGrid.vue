<script setup lang="ts">
import { computed } from 'vue'

import type { CompetitionDetail } from '../types'

/**
 * 参赛要求 / 基本信息（2 列网格，按参考设计稿）。
 * 图标使用 Lucide 家族；官网 / 咨询邮箱为可点击链接。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

const requirement = computed(() => props.detail.requirement)
const officialUrl = computed(() => props.detail.officialUrl)
</script>

<template>
  <dl class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-users"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        参赛对象
      </dt>
      <dd class="text-sm text-highlighted">
        {{ requirement.audience }}
      </dd>
    </div>

    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-user-plus"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        组队要求
      </dt>
      <dd class="text-sm text-highlighted">
        {{ requirement.teamRequirement }}
      </dd>
    </div>

    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-layers"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        参赛领域
      </dt>
      <dd class="text-sm text-highlighted">
        {{ requirement.domains }}
      </dd>
    </div>

    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-building-2"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        主办单位
      </dt>
      <dd class="text-sm text-highlighted">
        {{ requirement.organizer }}
      </dd>
    </div>

    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-globe"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        官网
      </dt>
      <dd class="min-w-0 text-sm">
        <a
          v-if="officialUrl"
          :href="officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="break-all text-primary-600 hover:underline dark:text-primary-400"
        >
          {{ officialUrl.replace(/^https?:\/\//, '') }}
        </a>
        <span
          v-else
          class="text-muted"
        >
          详见赛事信息
        </span>
      </dd>
    </div>

    <div class="grid grid-cols-[2rem_auto_1fr] items-start gap-3">
      <span class="mt-0.5 grid size-8 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
        <UIcon
          name="i-lucide-mail"
          class="size-4"
          aria-hidden="true"
        />
      </span>
      <dt class="whitespace-nowrap text-xs text-muted">
        咨询邮箱
      </dt>
      <dd class="min-w-0 text-sm">
        <a
          v-if="requirement.contactEmail"
          :href="`mailto:${requirement.contactEmail}`"
          class="break-all text-primary-600 hover:underline dark:text-primary-400"
        >
          {{ requirement.contactEmail }}
        </a>
        <span
          v-else
          class="text-muted"
        >
          详见赛事信息
        </span>
      </dd>
    </div>
  </dl>
</template>
