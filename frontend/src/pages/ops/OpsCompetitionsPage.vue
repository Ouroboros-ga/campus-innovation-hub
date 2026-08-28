<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import CompetitionEditorModal from '@/features/ops/components/CompetitionEditorModal.vue'
import { listCompetitions, type OpsCompetition } from '@/features/ops/api/opsCompetitionApi'
import { getCompetitionHealth, getRecentDrafts } from '@/features/ops/api/opsOverviewApi'
import type { CompetitionHealth } from '@/features/ops/api/opsOverviewApi'
import { competitionLevelLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'

const competitions = ref<OpsCompetition[]>([])
const health = ref<CompetitionHealth | null>(null)
const loading = ref(true)
const query = ref('')
const status = ref('ALL')
const category = ref('ALL')
const level = ref('ALL')
const featured = ref('ALL')

const editorOpen = ref(false)
const editing = ref<OpsCompetition | null>(null)
const recent = ref<{ drafts: Array<{ title: string; updated_at: string }>; recent: Array<{ title: string; updated_at: string }> } | null>(null)

async function load() {
  loading.value = true
  try {
    const [list, h, r] = await Promise.all([
      listCompetitions({ q: query.value || undefined }),
      getCompetitionHealth(),
      getRecentDrafts()
    ])
    competitions.value = list.items
    health.value = h
    recent.value = r
  } catch {
    // 忽略
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() => {
  return competitions.value.filter(c => {
    if (status.value !== 'ALL' && c.publicationState !== status.value) return false
    if (category.value !== 'ALL' && c.category !== category.value) return false
    if (level.value !== 'ALL' && c.level !== level.value) return false
    if (featured.value !== 'ALL') {
      const want = featured.value === 'FEATURED'
      if (want !== c.isFeatured) return false
    }
    return true
  })
})

function openCreate() {
  editing.value = null
  editorOpen.value = true
}
function openEdit(item: OpsCompetition) {
  editing.value = item
  editorOpen.value = true
}
</script>

<template>
  <div class="space-y-4">
    <!-- 标题 -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">竞赛内容库管理</h2>
        <p class="text-sm text-muted">统一管理竞赛内容、发布状态与首页推荐</p>
      </div>
      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-upload">导入数据</UButton>
        <UButton color="primary" icon="i-lucide-plus" @click="openCreate">新建竞赛</UButton>
      </div>
    </div>

    <!-- 顶部统计 5 块 -->
    <div class="grid gap-3 sm:grid-cols-5">
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-7 place-items-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950"><UIcon name="i-lucide-layout-grid" class="size-4" /></span>
          <span class="text-xs text-muted">全部竞赛</span>
        </div>
        <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">{{ health?.total ?? '-' }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-7 place-items-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950"><UIcon name="i-lucide-file-edit" class="size-4" /></span>
          <span class="text-xs text-muted">草稿</span>
        </div>
        <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">{{ competitions.filter(c=>c.publicationState==='DRAFT').length }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-7 place-items-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950"><UIcon name="i-lucide-send" class="size-4" /></span>
          <span class="text-xs text-muted">已发布</span>
        </div>
        <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">{{ competitions.filter(c=>c.publicationState==='PUBLISHED').length }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-7 place-items-center rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950"><UIcon name="i-lucide-alert-triangle" class="size-4" /></span>
          <span class="text-xs text-muted">待完善</span>
        </div>
        <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">{{ health?.missing_cover ?? 0 }}</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-7 place-items-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950"><UIcon name="i-lucide-star" class="size-4" /></span>
          <span class="text-xs text-muted">首页推荐</span>
        </div>
        <p class="mt-1 text-xl font-bold tabular-nums text-highlighted">{{ health?.featured ?? 0 }} / {{ health?.featured_limit ?? 15 }}</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_260px]">
      <!-- 左视图 -->
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs font-semibold text-muted">内容视图</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li class="flex items-center justify-between rounded-md bg-primary-50 px-2 py-1.5 font-medium text-primary-700 dark:bg-primary-950"><span>全部内容</span><span class="text-xs">{{ competitions.length }}</span></li>
          <li class="flex justify-between px-2 py-1.5 text-muted"><span>我的草稿</span><span>{{ competitions.filter(c=>c.publicationState==='DRAFT').length }}</span></li>
          <li class="flex justify-between px-2 py-1.5 text-muted"><span>待发布</span><span>{{ competitions.filter(c=>c.publicationState==='DRAFT').length }}</span></li>
          <li class="flex justify-between px-2 py-1.5 text-muted"><span>已推荐</span><span>{{ health?.featured ?? 0 }}</span></li>
          <li class="flex justify-between px-2 py-1.5 text-muted"><span>已归档</span><span>{{ competitions.filter(c=>c.publicationState==='ARCHIVED').length }}</span></li>
        </ul>
        <UButton color="neutral" variant="ghost" size="xs" class="mt-3 w-full" icon="i-lucide-plus">创建视图</UButton>
      </div>

      <!-- 中表 -->
      <div class="min-w-0 rounded-lg border border-default bg-default p-3">
        <div class="mb-3 flex flex-wrap gap-2">
          <UInput v-model="query" placeholder="搜索竞赛名称、关键词" icon="i-lucide-search" size="sm" class="w-48" @keyup.enter="load" />
          <USelect v-model="status" :items="[{label:'全部状态',value:'ALL'},{label:'草稿',value:'DRAFT'},{label:'已发布',value:'PUBLISHED'},{label:'已归档',value:'ARCHIVED'}]" size="sm" class="w-28" />
          <USelect v-model="category" :items="[{label:'全部分类',value:'ALL'},{label:'AI',value:'AI'},{label:'编程',value:'PROGRAMMING'},{label:'创新',value:'INNOVATION'}]" size="sm" class="w-28" />
          <USelect v-model="level" :items="[{label:'全部级别',value:'ALL'},{label:'校级',value:'SCHOOL'},{label:'省级',value:'PROVINCIAL'},{label:'国家级',value:'NATIONAL'}]" size="sm" class="w-28" />
          <USelect v-model="featured" :items="[{label:'推荐状态',value:'ALL'},{label:'已推荐',value:'FEATURED'},{label:'未推荐',value:'NOT'}]" size="sm" class="w-28" />
          <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-rotate-ccw" @click="query='';status='ALL';category='ALL';level='ALL';featured='ALL';load()">重置</UButton>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-muted">正在加载…</div>
        <ul v-else class="divide-y divide-default">
          <li v-for="item in filtered" :key="item.id" class="flex gap-3 py-3">
            <img v-if="item.cover?.src" :src="item.cover.src" :alt="item.name" class="size-12 shrink-0 rounded-md object-cover" />
            <div v-else class="grid size-12 place-items-center rounded-md bg-muted text-xs text-muted">无封面</div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-highlighted">{{ item.name }}</p>
              <p class="truncate text-xs text-muted">{{ item.edition }} · {{ competitionLevelLabel[item.level] }} · {{ item.category }}</p>
            </div>
            <div class="hidden shrink-0 flex-col items-end gap-1 sm:flex">
              <UBadge :color="item.publicationState==='PUBLISHED'?'success':item.publicationState==='DRAFT'?'warning':'neutral'" variant="soft" size="xs">{{ item.publicationState==='PUBLISHED'?'已发布':item.publicationState==='DRAFT'?'草稿':'已归档' }}</UBadge>
              <span class="text-xs text-muted">{{ formatCompactDate(item.registrationEndAt) }}</span>
            </div>
            <div class="flex shrink-0 gap-1">
              <UButton size="xs" color="neutral" variant="soft" @click="openEdit(item)">编辑</UButton>
              <UButton size="xs" color="neutral" variant="outline" :to="item.detailPath">预览</UButton>
            </div>
          </li>
          <li v-if="!filtered.length" class="py-10 text-center text-sm text-muted">暂无符合条件的竞赛</li>
        </ul>
      </div>

      <!-- 右健康 -->
      <div class="space-y-4">
        <div class="rounded-lg border border-default bg-default p-3">
          <h4 class="text-sm font-semibold text-highlighted">内容健康状态</h4>
          <ul class="mt-2 space-y-2 text-sm">
            <li class="flex justify-between"><span class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-image-off" class="size-3.5" />缺少封面</span><span class="font-medium">{{ health?.missing_cover ?? 0 }} 个</span></li>
            <li class="flex justify-between"><span class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-link-2-off" class="size-3.5" />缺少官网链接</span><span class="font-medium">{{ health?.missing_official_url ?? 0 }} 个</span></li>
            <li class="flex justify-between"><span class="flex items-center gap-1.5 text-muted"><UIcon name="i-lucide-clock" class="size-3.5" />截止期临近(7天内)</span><span class="font-medium">{{ health?.near_deadline ?? 0 }} 个</span></li>
            <li class="flex justify-between"><span class="text-muted">内容完整度良好</span><span class="font-medium">{{ health?.complete ?? 0 }} 个</span></li>
          </ul>
        </div>
        <div class="rounded-lg border border-default bg-default p-3">
          <h4 class="text-sm font-semibold text-highlighted">最近操作</h4>
          <ul class="mt-2 space-y-2">
            <li v-for="d in (recent?.drafts ?? []).slice(0,5)" :key="d.title" class="text-xs text-muted">{{ d.title }} · {{ formatCompactDate(d.updated_at) }}</li>
            <li v-if="!recent?.drafts?.length" class="text-xs text-muted">暂无</li>
          </ul>
        </div>
      </div>
    </div>

    <CompetitionEditorModal :open="editorOpen" :competition="editing" @update:open="editorOpen=$event" @saved="load" />
  </div>
</template>
