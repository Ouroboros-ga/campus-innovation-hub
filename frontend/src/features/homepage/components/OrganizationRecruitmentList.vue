<script setup lang="ts">
import { computed } from 'vue'

import { recruitingOrganizations } from '@/mocks/fixtures/homepage'
import {
  deriveRegistrationState,
  formatCompactDate
} from '@/shared/lib/date'
import {
  organizationTypeIcon,
  organizationTypeLabel
} from '@/shared/lib/domain-labels'
import type {
  OrganizationRecruitmentSummary,
  RegistrationState
} from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「正在招新的组织」区块（FE-011）。
 *
 * 设计来源：
 * - FrontendDesign.md §23：组织列表展示名称、类型、招新状态、岗位概览；
 * - PageMap 首页-正在招新的组织：组织名称、组织类型、招新状态、岗位概览、截止时间；
 * - 招新状态由报名时段派生（UPCOMING / OPEN / CLOSED）；
 * - §45 / §20：紧凑列表，单条底边分隔。
 */
const props = withDefaults(
  defineProps<{ items?: OrganizationRecruitmentSummary[] }>(),
  { items: () => recruitingOrganizations }
)

const nowDate = computed(() => new Date())

/** 招新状态标签映射（文字可读，不只靠颜色）。 */
const recruitmentStateLabel: Record<string, string> = {
  UPCOMING: '未开始',
  OPEN: '招新中',
  CLOSED: '已结束'
}

function stateColor(state: RegistrationState): 'success' | 'warning' | 'neutral' {
  if (state === 'OPEN') return 'success'
  if (state === 'UPCOMING') return 'warning'
  return 'neutral'
}

function derivedState(item: OrganizationRecruitmentSummary): RegistrationState {
  return deriveRegistrationState({
    required: true,
    startAt: item.applyStartAt,
    endAt: item.applyEndAt,
    now: nowDate.value
  })
}
</script>

<template>
  <section>
    <SectionHeader
      title="正在招新的组织"
      to="/organizations"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.recruitmentPath"
          class="group flex gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="organizationTypeIcon[item.organizationType]"
              class="size-[18px] text-primary-600 dark:text-primary-400"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <span
                class="line-clamp-1 text-sm font-semibold text-highlighted transition-colors group-hover:text-primary-600"
              >
                {{ item.organizationName }}
              </span>
              <UBadge
                size="sm"
                variant="soft"
                :color="stateColor(derivedState(item))"
                class="shrink-0"
              >
                {{ recruitmentStateLabel[derivedState(item)] }}
              </UBadge>
            </span>
            <span class="mt-0.5 block line-clamp-1 text-xs text-muted">
              {{ organizationTypeLabel[item.organizationType] }} ·
              {{ item.positions.map(p => p.name).join('、') }}
            </span>
            <span
              v-if="item.applyEndAt"
              class="mt-0.5 block text-xs tabular-nums text-muted"
            >
              报名截止 {{ formatCompactDate(item.applyEndAt) }}
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
