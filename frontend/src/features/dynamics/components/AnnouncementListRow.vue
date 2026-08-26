<script setup lang="ts">
import { formatCompactDate } from '@/shared/lib/date'

import {
  announcementLinkedKindIcon,
  announcementLinkedKindLabel,
  publisherScopeIcon,
  publisherScopeLabel
} from '../lib/dynamicsLabels'
import type { DynamicsAnnouncement } from '../types'

/**
 * 校园动态-公告列表行（FE-050 tab=announcements / tab=all 最新公告）。
 *
 * 展示：来源（学院/学校/平台）、发布日期、关联对象、站外链接标识。
 *
 * 设计来源：
 * - FE-050：公告列表 来源筛选、发布日期、关联对象、外链标识；
 * - §20 / §45：紧凑列表行，单条底边分隔；
 * - §43：标题直接陈述事实。
 */
defineProps<{ announcement: DynamicsAnnouncement }>()
</script>

<template>
  <RouterLink
    :to="announcement.detailPath"
    class="group flex gap-3 py-3"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
      aria-hidden="true"
    >
      <UIcon
        :name="publisherScopeIcon[announcement.publisherScope]"
        class="size-[18px] text-primary-600 dark:text-primary-400"
      />
    </span>
    <span class="min-w-0 flex-1">
      <span
        class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600"
      >
        {{ announcement.title }}
      </span>
      <span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
        <span class="inline-flex items-center gap-1">
          {{ publisherScopeLabel[announcement.publisherScope] }}
        </span>
        <span class="tabular-nums">
          {{ formatCompactDate(announcement.publishedAt) }}
        </span>
        <span
          v-if="announcement.linkedObject"
          class="inline-flex items-center gap-1"
        >
          ·
          <UIcon
            :name="announcementLinkedKindIcon[announcement.linkedObject.kind]"
            class="size-3.5"
            aria-hidden="true"
          />
          {{ announcementLinkedKindLabel[announcement.linkedObject.kind] }}
        </span>
        <span
          v-if="announcement.externalUrl"
          class="inline-flex items-center gap-1"
        >
          ·
          <UIcon
            name="i-lucide-external-link"
            class="size-3.5"
            aria-hidden="true"
          />
          原文
        </span>
      </span>
    </span>
  </RouterLink>
</template>
