<script setup lang="ts">
import { computed } from 'vue'

import {
  teamPostTypeOptions,
  teamStatusOptions,
  type SelectOption
} from '../lib/teamFilters'
import type { TeamQuery } from '../types'
import TeamFilterGroup from './TeamFilterGroup.vue'

/**
 * 组队广场筛选（FE-030）。
 *
 * 设计来源：
 * - FrontendDesign.md §34.5：桌面为下拉 + 分段按钮；手机为紧凑分段；筛选值 URL 承载；
 * - §24 / §43：选项用语义状态与简短分类的简体中文；
 * - §10：筛选控件不用 pill 装饰堆叠。
 *
 * 「全部赛事」使用哨兵值 `ALL` 承载（Nuxt UI SelectItem 不接受空字符串 value）。
 */
const props = defineProps<{
  query: TeamQuery
  competitionOptions: SelectOption[]
}>()
const emit = defineEmits<{
  change: [patch: Partial<TeamQuery>]
  reset: []
}>()

const competitionItems = computed<SelectOption[]>(() => [
  { label: '全部赛事', value: 'ALL' },
  ...props.competitionOptions
])

function onCompetitionChange(value: string) {
  emit('change', { competition: value === 'ALL' ? undefined : value })
}
</script>

<template>
  <div>
    <!-- 桌面 / 平板：横向筛选栏 -->
    <div class="hidden flex-wrap items-end gap-x-6 gap-y-3 md:flex">
      <div>
        <p class="mb-1 text-xs text-muted">
          关联竞赛
        </p>
        <USelect
          :model-value="props.query.competition ?? 'ALL'"
          :items="competitionItems"
          class="w-64"
          @update:model-value="onCompetitionChange"
        />
      </div>

      <TeamFilterGroup
        label="信息类型"
        :model-value="props.query.postType ?? 'ALL'"
        :options="teamPostTypeOptions"
        @update:model-value="v => emit('change', { postType: v === 'ALL' ? undefined : v })"
      />

      <TeamFilterGroup
        label="状态"
        :model-value="props.query.status ?? 'ALL'"
        :options="teamStatusOptions"
        @update:model-value="v => emit('change', { status: v === 'ALL' ? undefined : v })"
      />

      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-rotate-ccw"
        @click="emit('reset')"
      >
        重置
      </UButton>
    </div>

    <!-- 手机：紧凑筛选（关联竞赛下拉 + 分段按钮） -->
    <div class="space-y-3 md:hidden">
      <USelect
        :model-value="props.query.competition ?? 'ALL'"
        :items="competitionItems"
        icon="i-lucide-trophy"
        aria-label="关联竞赛"
        class="w-full"
        @update:model-value="onCompetitionChange"
      />

      <TeamFilterGroup
        label="信息类型"
        :model-value="props.query.postType ?? 'ALL'"
        :options="teamPostTypeOptions"
        @update:model-value="v => emit('change', { postType: v === 'ALL' ? undefined : v })"
      />

      <TeamFilterGroup
        label="状态"
        :model-value="props.query.status ?? 'ALL'"
        :options="teamStatusOptions"
        @update:model-value="v => emit('change', { status: v === 'ALL' ? undefined : v })"
      />
    </div>
  </div>
</template>
