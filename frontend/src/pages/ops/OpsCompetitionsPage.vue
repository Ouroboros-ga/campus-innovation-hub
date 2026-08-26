<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import CompetitionEditorModal from '@/features/ops/components/CompetitionEditorModal.vue'
import { opsCompetitions } from '@/features/ops/lib/opsStore'
import { competitionLevelLabel } from '@/shared/lib/domain-labels'
import { deriveRegistrationState, formatDateTimeCompact } from '@/shared/lib/date'
import type { CompetitionSummary, RegistrationState } from '@/shared/types/homepage'

/** 竞赛管理（FE-090 /ops/competitions）。 */
const toast = useToast()

type Filter = 'ALL' | RegistrationState

const now = computed(() => new Date())
const filter = ref<Filter>('ALL')

const statusOf = (item: CompetitionSummary) =>
  deriveRegistrationState({
    required: true,
    startAt: item.registrationStartAt,
    endAt: item.registrationEndAt,
    now: now.value
  })

const rows = computed(() =>
  filter.value === 'ALL'
    ? opsCompetitions
    : opsCompetitions.filter(item => statusOf(item) === filter.value)
)

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'OPEN', label: '报名中' },
  { value: 'UPCOMING', label: '即将开始' },
  { value: 'CLOSED', label: '报名已结束' }
]

const badgeColor: Record<RegistrationState, 'success' | 'info' | 'warning' | 'neutral'> = {
  OPEN: 'success',
  UPCOMING: 'info',
  CLOSED: 'neutral',
  FULL: 'warning',
  NOT_AVAILABLE: 'neutral',
  NOT_REQUIRED: 'neutral'
}

const badgeLabel: Record<RegistrationState, string> = {
  OPEN: '报名中',
  UPCOMING: '即将开始',
  CLOSED: '报名已结束',
  FULL: '已满',
  NOT_AVAILABLE: '不可报名',
  NOT_REQUIRED: '无需报名'
}

const editorOpen = ref(false)
const editing = ref<CompetitionSummary | null>(null)

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(item: CompetitionSummary) {
  editing.value = item
  editorOpen.value = true
}

function notify(title: string) {
  toast.add({
    title,
    description: '演示环境（mock）。',
    color: 'neutral',
    icon: 'i-lucide-info'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div
        role="group"
        aria-label="状态筛选"
        class="flex flex-wrap gap-2"
      >
        <UButton
          v-for="item in filters"
          :key="item.value"
          size="sm"
          color="neutral"
          :variant="filter === item.value ? 'solid' : 'outline'"
          :aria-pressed="filter === item.value"
          @click="filter = item.value"
        >
          {{ item.label }}
        </UButton>
      </div>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        新建竞赛
      </UButton>
    </div>

    <ul
      v-if="rows.length"
      class="space-y-3"
    >
      <li
        v-for="item in rows"
        :key="item.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ item.name }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ competitionLevelLabel[item.level] }} ·
              截止 {{ formatDateTimeCompact(item.registrationEndAt) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="badgeColor[statusOf(item)]"
          >
            {{ badgeLabel[statusOf(item)] }}
          </UBadge>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            :to="item.detailPath"
            size="sm"
            color="neutral"
            variant="soft"
          >
            查看
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-pencil"
            @click="openEdit(item)"
          >
            编辑
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-star"
            @click="notify('切换推荐')"
          >
            推荐
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无符合条件的竞赛。
    </p>

    <CompetitionEditorModal
      :open="editorOpen"
      :competition="editing"
      @update:open="editorOpen = $event"
    />
  </div>
</template>
