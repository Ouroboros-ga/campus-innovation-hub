<script setup lang="ts">
import { announcementList } from '@/mocks/fixtures/homepage'
import { formatCompactDate } from '@/shared/lib/date'
import type { AnnouncementSummary } from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「通知公告」区块（FE-010）。
 *
 * 设计来源：
 * - §18.1：右侧栏包含 Announcements；
 * - §20：公告用列表而非卡片；
 * - §45：单条底边分隔，用空白与排版营造层级，避免「盒中盒」；
 * - §43：公告标题直接陈述事实。
 */
const props = withDefaults(
  defineProps<{ items?: AnnouncementSummary[] }>(),
  { items: () => announcementList }
)
</script>

<template>
  <section>
    <SectionHeader
      title="通知公告"
      to="/activities?tab=announcements"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex items-center justify-between gap-3 py-3"
        >
          <span class="min-w-0 flex-1">
            <span class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600">
              {{ item.title }}
            </span>
          </span>
          <span class="shrink-0 text-xs tabular-nums text-muted">
            {{ formatCompactDate(item.publishedAt) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
