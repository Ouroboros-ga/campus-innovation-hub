<script setup lang="ts">
import { deadlineItems } from '@/mocks/fixtures/homepage'
import type { DeadlineItem as DeadlineItemType } from '@/shared/types/homepage'
import DeadlineItem from './DeadlineItem.vue'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「即将截止」区块（FE-008）。
 *
 * 设计来源：
 * - §18.1：Desktop 主栏包含 Deadline；
 * - §34：移动端保持截止信息可见，单列堆叠；
 * - §44：不截断截止日期与核心状态。
 */
const props = withDefaults(
  defineProps<{ items?: DeadlineItemType[] }>(),
  { items: () => deadlineItems }
)
</script>

<template>
  <section>
    <SectionHeader
      title="即将截止"
      to="/competitions"
    />
    <ul class="mt-4 grid gap-3 sm:gap-4 md:grid-cols-3">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <DeadlineItem :item="item" />
      </li>
    </ul>
  </section>
</template>
