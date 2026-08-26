<script setup lang="ts">
import { computed } from 'vue'

import {
  formatCompactDate,
  formatDateTimeCompact
} from '@/shared/lib/date'
import { participationModeLabel } from '@/shared/lib/domain-labels'
import type { CompetitionDetail } from '../types'

/**
 * 竞赛基本信息（FE-021）。
 *
 * 用定义列表呈现，避免卡片套壳（§34.6）。仅展示有值的字段。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

interface InfoRow {
  label: string
  value: string
}

function formatRange(start: string | null, end: string | null): string {
  if (!start) return ''
  if (!end) return formatCompactDate(start)
  return `${formatCompactDate(start)} - ${formatCompactDate(end)}`
}

const rows = computed<InfoRow[]>(() => {
  const d = props.detail
  const list: InfoRow[] = [
    { label: '参赛形式', value: participationModeLabel[d.participationMode] }
  ]

  if (d.suitableGrades) list.push({ label: '适合年级', value: d.suitableGrades })
  if (d.direction) list.push({ label: '主要方向', value: d.direction })
  if (d.schoolOrganized != null) {
    list.push({ label: '学院组织', value: d.schoolOrganized ? '是' : '否' })
  }
  if (d.campusContact) list.push({ label: '校内联系人', value: d.campusContact })

  if (d.registrationStartAt) {
    list.push({ label: '报名开始', value: formatDateTimeCompact(d.registrationStartAt) })
  }
  if (d.registrationEndAt) {
    list.push({ label: '报名截止', value: formatDateTimeCompact(d.registrationEndAt) })
  }

  if (d.eventStartAt || d.eventEndAt) {
    list.push({
      label: '比赛时间',
      value: formatRange(d.eventStartAt, d.eventEndAt)
    })
  }

  if (d.officialUrl) list.push({ label: '官网', value: d.officialUrl })

  return list
})
</script>

<template>
  <dl class="divide-y divide-default">
    <div
      v-for="row in rows"
      :key="row.label"
      class="grid grid-cols-[7rem_1fr] gap-3 py-3 sm:grid-cols-[8rem_1fr]"
    >
      <dt class="text-sm text-muted">
        {{ row.label }}
      </dt>
      <dd
        class="min-w-0 text-sm text-highlighted"
        :class="row.label === '官网' ? 'break-all text-primary-600 dark:text-primary-400' : ''"
      >
        <a
          v-if="row.label === '官网'"
          :href="row.value"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 hover:underline"
        >
          {{ row.value }}
          <UIcon
            name="i-lucide-external-link"
            class="size-3.5"
            aria-hidden="true"
          />
        </a>
        <template v-else>
          {{ row.value }}
        </template>
      </dd>
    </div>
  </dl>
</template>
