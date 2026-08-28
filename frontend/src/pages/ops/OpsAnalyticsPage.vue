<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import { getAnalyticsTrends, getCompetitionHealth, getDynamicsStats, getOrganizationStats, getWorkbenchStats } from '@/features/ops/api/opsOverviewApi'
import type { AnalyticsTrends, CompetitionHealth, DynamicsStats, OrganizationStats, WorkbenchStats } from '@/features/ops/api/opsOverviewApi'

const workbench = ref<WorkbenchStats | null>(null)
const compHealth = ref<CompetitionHealth | null>(null)
const dynamics = ref<DynamicsStats | null>(null)
const orgStats = ref<OrganizationStats | null>(null)
const trends = ref<AnalyticsTrends | null>(null)
const loading = ref(false)
const trendsLoading = ref(false)
const error = ref('')
const trendsError = ref('')
const days = ref<7 | 14 | 30>(7)

const chartCanvas = ref(null as unknown as HTMLCanvasElement | null) // eslint-disable-line no-undef
let chartInstance: { destroy: () => void } | null = null

async function load() {
  loading.value = true
  error.value = ''
  try {
    const results = await Promise.allSettled([getWorkbenchStats(), getCompetitionHealth(), getDynamicsStats(), getOrganizationStats()])
    if (results[0].status === 'fulfilled') workbench.value = results[0].value
    if (results[1].status === 'fulfilled') compHealth.value = results[1].value
    if (results[2].status === 'fulfilled') dynamics.value = results[2].value
    if (results[3].status === 'fulfilled') orgStats.value = results[3].value
  } catch {
    error.value = '数据加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

async function loadTrends(opts?: { nocache?: boolean }) {
  trendsLoading.value = true
  trendsError.value = ''
  try {
    trends.value = await getAnalyticsTrends(days.value, opts)
    await nextTick()
    await renderChart()
  } catch {
    trendsError.value = '趋势数据加载失败。'
  } finally {
    trendsLoading.value = false
  }
}

async function renderChart() {
  if (!trends.value || !chartCanvas.value) return
  if (chartInstance) {
    try { chartInstance.destroy() } catch { /* ignore */ }
    chartInstance = null
  }
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)
  const labels = trends.value.series.competitions?.map(p => p.date.slice(5)) ?? []
  const palette: Record<string, string> = {
    competitions: '#1677ff',
    activities: '#12a36d',
    announcements: '#f08a24',
    team_posts: '#1677ff',
    recruitments: '#e5484d',
    recruitment_applications: '#8b5cf6',
    team_applications: '#06b6d4',
    consultations: '#6b7280',
    users: '#f59e0b'
  }
  const datasets = Object.entries(trends.value.series).map(([key, points]) => ({
    label: key,
    data: points.map(p => p.count),
    borderColor: palette[key] ?? '#6b7280',
    backgroundColor: (palette[key] ?? '#6b7280') + '22',
    tension: 0.35,
    fill: false,
    pointRadius: 2
  }))
  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: prefersReduced ? false : { duration: 240 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.15)' } }
      }
    }
  }) as unknown as { destroy: () => void }
}

watch(days, () => loadTrends())

onMounted(async () => {
  await load()
  await loadTrends()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          数据分析
        </h2>
        <p class="text-sm text-muted">
          只读聚合（真实数据库统计，Chart.js 按需加载，无假 KPI）
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-refresh-cw"
        :loading="loading || trendsLoading"
        @click="() => { load(); loadTrends({ nocache: true }) }"
      >
        刷新
      </UButton>
    </div>

    <div
      v-if="loading"
      class="py-10 text-center text-sm text-muted"
    >
      正在加载…
    </div>
    <p
      v-else-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-4">
        <div class="rounded-lg border border-default bg-default p-3">
          <p class="text-xs text-muted">
            全部竞赛
          </p>
          <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">
            {{ compHealth?.total ?? workbench?.overview.total ?? '-' }}
          </p>
          <p class="text-xs text-muted">
            已发布 {{ workbench?.overview.published ?? '-' }} · 草稿 {{ workbench?.overview.draft ?? '-' }}
          </p>
        </div>
        <div class="rounded-lg border border-default bg-default p-3">
          <p class="text-xs text-muted">
            活动/公告
          </p>
          <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">
            {{ dynamics?.total ?? '-' }}
          </p>
          <p class="text-xs text-muted">
            已发布 {{ dynamics?.published ?? '-' }} · 草稿 {{ dynamics?.draft ?? '-' }}
          </p>
        </div>
        <div class="rounded-lg border border-default bg-default p-3">
          <p class="text-xs text-muted">
            组织
          </p>
          <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">
            {{ orgStats?.total ?? '-' }}
          </p>
          <p class="text-xs text-muted">
            招新中 {{ orgStats?.recruiting ?? '-' }}
          </p>
        </div>
        <div class="rounded-lg border border-default bg-default p-3">
          <p class="text-xs text-muted">
            待处理
          </p>
          <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">
            {{ workbench?.pending.pending_publish ?? '-' }}
          </p>
          <p class="text-xs text-muted">
            待发布 {{ workbench?.pending.pending_publish ?? '-' }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-default bg-default p-4">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-highlighted">
              7 日趋势
            </h3>
            <div class="flex items-center gap-1">
              <UButton
                v-for="d in [7,14,30] as const"
                :key="d"
                size="xs"
                :variant="days===d ? 'solid' : 'ghost'"
                color="neutral"
                @click="days=d"
              >
                {{ d }}日
              </UButton>
            </div>
          </div>
          <p class="mt-1 text-xs text-muted">
            按 `created_at::date` `TruncDate` 聚合（Asia/Shanghai），300s 服务端缓存，`import('chart.js')` 交互时按需加载。
          </p>
          <div
            v-if="trendsLoading"
            class="mt-4 flex h-40 items-center justify-center rounded bg-muted text-xs text-muted"
          >
            正在加载趋势…
          </div>
          <p
            v-else-if="trendsError"
            class="mt-4 text-xs text-danger-600 dark:text-danger-400"
          >
            {{ trendsError }}
          </p>
          <div
            v-else
            class="mt-4 h-40"
          >
            <canvas
              ref="chartCanvas"
              aria-label="7 日创建趋势图"
              role="img"
              class="h-full w-full"
            />
          </div>
          <p
            v-if="trends"
            class="mt-2 text-xs text-muted"
          >
            {{ trends.start_date }} 至 {{ trends.end_date }} · 合计 竞赛 {{ trends.totals.competitions ?? 0 }} / 活动 {{ trends.totals.activities ?? 0 }} / 公告 {{ trends.totals.announcements ?? 0 }} / 组队 {{ trends.totals.team_posts ?? 0 }} / 招新申请 {{ trends.totals.recruitment_applications ?? 0 }} / 组队申请 {{ trends.totals.team_applications ?? 0 }} / 用户 {{ trends.totals.users ?? 0 }}
          </p>
        </div>
        <div class="rounded-lg border border-default bg-default p-4">
          <h3 class="text-sm font-semibold text-highlighted">
            健康度
          </h3>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between">
              <span class="text-muted">缺少封面</span><span class="font-medium">{{ compHealth?.missing_cover ?? '-' }}</span>
            </li>
            <li class="flex justify-between">
              <span class="text-muted">缺少官网</span><span class="font-medium">{{ compHealth?.missing_official_url ?? '-' }}</span>
            </li>
            <li class="flex justify-between">
              <span class="text-muted">近 7 天截止</span><span class="font-medium">{{ compHealth?.near_deadline ?? '-' }}</span>
            </li>
            <li class="flex justify-between">
              <span class="text-muted">完整度</span><span class="font-medium">{{ compHealth?.complete ?? '-' }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
