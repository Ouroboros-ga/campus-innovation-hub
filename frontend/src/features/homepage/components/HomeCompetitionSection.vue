<script setup lang="ts">
import CompetitionListItem from '@/features/competitions/components/CompetitionListItem.vue'
import { hotCompetitions } from '@/mocks/fixtures/homepage'
import type { CompetitionSummary } from '@/shared/types/homepage'
import CompetitionCard from './CompetitionCard.vue'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「热门竞赛」区块（FE-009）。
 *
 * 设计来源：
 * - §18.1：Desktop 主栏包含 Competition；
 * - §34.4：手机端用紧凑内容行（一条底边分隔），不做整宽大卡墙；≥md 才用卡格。
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
    <ul class="mt-3 divide-y divide-default md:hidden">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <CompetitionListItem :item="item" />
      </li>
    </ul>
    <ul class="mt-4 hidden grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 md:grid">
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
