<script setup lang="ts">
import { hotCompetitions } from '@/mocks/fixtures/homepage'
import type { CompetitionSummary } from '@/shared/types/homepage'
import CompetitionCard from './CompetitionCard.vue'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「热门竞赛」区块（FE-009）。
 *
 * 设计来源：
 * - §18.1：Desktop 主栏包含 Competition；
 * - §34：移动端单列堆叠，表格等宽卡片在窄屏降为两列 / 一列；
 * - §21：卡片信息完整，最多 3 个徽标。
 */
const props = withDefaults(
  defineProps<{ items?: CompetitionSummary[] }>(),
  { items: () => hotCompetitions }
)
</script>

<template>
  <section>
    <SectionHeader
      title="热门竞赛"
      to="/competitions"
    />
    <ul class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      <li
        v-for="item in props.items"
        :key="item.id"
        class="min-w-0"
      >
        <CompetitionCard :item="item" />
      </li>
    </ul>
  </section>
</template>
