<script setup lang="ts">
import { computed } from 'vue'

import { recruitTeams } from '@/mocks/fixtures/homepage'
import { formatCompactDate } from '@/shared/lib/date'
import {
  teamPostTypeIcon
} from '@/shared/lib/domain-labels'
import type { TeamRecruitmentSummary } from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「正在组队」区块（FE-011）。
 *
 * 设计来源：
 * - FrontendDesign.md §22：结构化社区帖子而非社交流；展示标题、关联竞赛、
 *   当前/目标人数、需要岗位、发布时间；主操作「查看详情」；
 * - 不展示点赞 / 关注 / 热度等虚构指标（§22、database-design §28）；
 * - §45 / §20：紧凑列表，单条底边分隔。
 */
const props = withDefaults(
  defineProps<{ items?: TeamRecruitmentSummary[] }>(),
  { items: () => recruitTeams }
)

/** 按当前/目标人数派生招募状态（已满员 / 招募中）。 */
function teamStatus(item: TeamRecruitmentSummary) {
  return item.baseMemberCount >= item.targetMemberCount ? 'FULL' : 'RECRUITING'
}

const statusMeta = computed(() => ({
  RECRUITING: { label: '招募中', color: 'success' as const },
  FULL: { label: '已满员', color: 'warning' as const }
}))
</script>

<template>
  <section>
    <SectionHeader
      title="正在组队"
      to="/teams"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50"
            aria-hidden="true"
          >
            <UIcon
              :name="teamPostTypeIcon[item.postType]"
              class="size-[18px] text-primary-600"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-start justify-between gap-2">
              <span
                class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600"
              >
                {{ item.title }}
              </span>
              <span class="shrink-0 text-xs tabular-nums text-muted">
                {{ item.baseMemberCount }}/{{ item.targetMemberCount }} 人
              </span>
            </span>
            <span class="mt-0.5 block line-clamp-1 text-xs text-muted">
              {{ item.competitionName }}
            </span>
            <span class="mt-1 flex items-center gap-1.5">
              <span class="truncate text-xs text-muted">
                {{ item.roles.join(' · ') }}
              </span>
              <UBadge
                size="sm"
                variant="soft"
                :color="statusMeta[teamStatus(item)].color"
                class="shrink-0"
              >
                {{ statusMeta[teamStatus(item)].label }}
              </UBadge>
              <span class="ml-auto shrink-0 text-xs tabular-nums text-muted">
                {{ formatCompactDate(item.createdAt) }}
              </span>
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
