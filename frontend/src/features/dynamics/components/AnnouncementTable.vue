<script setup lang="ts">
import { formatCompactDate } from '@/shared/lib/date'

import { announcementExcerpt } from '../lib/dynamicsFormat'
import {
  announcementLinkedKindLabel,
  publisherScopeIcon,
  publisherScopeLabel
} from '../lib/dynamicsLabels'
import type { DynamicsAnnouncement } from '../types'

/**
 * 校园动态-公告表格（桌面「最新公告」及公告 tab）。
 *
 * 参考设计稿：来源 / 公告标题 / 摘要 / 发布日期 / 关联标签 五列。
 * 以「带表头的网格行」呈现（源于 §20 公告属于列表域，但按参考图提供表格观感）；
 * 每一整行链接到公告详情。关联标签只展示真实存在的关联对象与站外原文标记。
 */
defineProps<{ announcements: DynamicsAnnouncement[] }>()

const columns = [
  { label: '来源', className: 'w-28' },
  { label: '公告标题', className: '' },
  { label: '摘要', className: '' },
  { label: '发布日期', className: 'w-28' },
  { label: '关联标签', className: 'w-40' }
] as const
</script>

<template>
  <div class="overflow-x-auto">
    <div class="min-w-[720px]">
      <!-- 表头 -->
      <div class="flex items-center gap-4 border-b border-default pb-2 text-xs font-medium text-muted">
        <span
          v-for="column in columns"
          :key="column.label"
          class="shrink-0"
          :class="column.className"
        >
          {{ column.label }}
        </span>
      </div>

      <!-- 行 -->
      <ul class="divide-y divide-default">
        <li
          v-for="announcement in announcements"
          :key="announcement.id"
        >
          <RouterLink
            :to="announcement.detailPath"
            class="group flex items-center gap-4 py-3.5 transition-colors hover:bg-elevated"
          >
            <span class="flex w-28 shrink-0 items-center gap-1.5 text-sm text-muted">
              <UIcon
                :name="publisherScopeIcon[announcement.publisherScope]"
                class="size-4 shrink-0"
                aria-hidden="true"
              />
              {{ publisherScopeLabel[announcement.publisherScope] }}
            </span>

            <span class="min-w-0 flex-1 text-sm font-medium text-highlighted transition-colors group-hover:text-primary-600">
              {{ announcement.title }}
            </span>

            <span class="min-w-0 flex-1 truncate text-sm text-toned">
              {{ announcementExcerpt(announcement) }}
            </span>

            <span class="w-28 shrink-0 text-sm tabular-nums text-muted">
              {{ formatCompactDate(announcement.publishedAt) }}
            </span>

            <span class="flex w-40 shrink-0 flex-wrap items-center gap-1.5">
              <UBadge
                v-if="announcement.linkedObject"
                size="sm"
                variant="soft"
                color="neutral"
              >
                {{ announcementLinkedKindLabel[announcement.linkedObject.kind] }}
              </UBadge>
              <UBadge
                v-if="announcement.externalUrl"
                size="sm"
                variant="outline"
                color="neutral"
                icon="i-lucide-external-link"
              >
                原文
              </UBadge>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
