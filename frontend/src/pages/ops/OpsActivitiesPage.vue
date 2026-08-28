<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import ActivityEditorModal from '@/features/ops/components/ActivityEditorModal.vue'
import AnnouncementEditorModal from '@/features/ops/components/AnnouncementEditorModal.vue'
import PublishDynamicsModal from '@/features/ops/components/PublishDynamicsModal.vue'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listAnnouncements } from '@/features/ops/api/opsAnnouncementApi'
import { getDynamicsStats } from '@/features/ops/api/opsOverviewApi'
import type { DynamicsStats } from '@/features/ops/api/opsOverviewApi'
import type { DynamicsActivity, DynamicsAnnouncement } from '@/features/dynamics/types'
import { formatCompactDate } from '@/shared/lib/date'

const tab = ref<'all' | 'activities' | 'announcements'>('all')
const stats = ref<DynamicsStats | null>(null)

const activities = ref<DynamicsActivity[]>([])
const announcements = ref<DynamicsAnnouncement[]>([])
const loading = ref(true)

const query = ref('')
const publishOpen = ref(false)
const activityEditorOpen = ref(false)
const editingActivity = ref<DynamicsActivity | null>(null)
const syncAnnouncement = ref(false)
const announcementEditorOpen = ref(false)
const editingAnnouncement = ref<DynamicsAnnouncement | null>(null)

async function load() {
  loading.value = true
  try {
    const [s, a, b] = await Promise.all([getDynamicsStats(), listActivities({}), listAnnouncements({})])
    stats.value = s
    activities.value = a.items
    announcements.value = b.items
  } catch {
    // empty
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filteredActivities = computed(() => {
  if (!query.value) return activities.value
  return activities.value.filter(i => i.title.includes(query.value))
})
const filteredAnnouncements = computed(() => {
  if (!query.value) return announcements.value
  return announcements.value.filter(i => i.title.includes(query.value))
})

function onPublishSelect(type: 'ACTIVITY' | 'ANNOUNCEMENT' | 'BOTH') {
  if (type === 'ANNOUNCEMENT') {
    editingAnnouncement.value = null
    announcementEditorOpen.value = true
  } else {
    editingActivity.value = null
    syncAnnouncement.value = type === 'BOTH'
    activityEditorOpen.value = true
  }
}
function editActivity(a: DynamicsActivity) { editingActivity.value = a; syncAnnouncement.value = false; activityEditorOpen.value = true }
function editAnnouncement(a: DynamicsAnnouncement) { editingAnnouncement.value = a; announcementEditorOpen.value = true }
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">校园动态管理</h2>
        <p class="text-sm text-muted">统一管理平台的活动与公告内容，支持发布、编辑与状态管理</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="publishOpen = true">新建内容</UButton>
    </div>

    <!-- 顶部 tabs -->
    <div class="flex gap-2 border-b border-default">
      <button v-for="t in [{v:'all',l:'全部内容'},{v:'activities',l:'活动'},{v:'announcements',l:'公告'}]" :key="t.v" class="px-3 py-2 text-sm" :class="tab===t.v ? 'border-b-2 border-primary-600 font-medium text-primary-600' : 'text-muted'" @click="tab=t.v as any">{{ t.l }}</button>
    </div>

    <!-- 搜索 + 筛选 -->
    <div class="flex flex-wrap gap-2">
      <UInput v-model="query" placeholder="搜索标题或关键词" icon="i-lucide-search" size="sm" class="w-64" />
      <USelect :items="[{label:'全部类型',value:'all'}]" model-value="all" size="sm" class="w-28" />
      <USelect :items="[{label:'全部状态',value:'all'}]" model-value="all" size="sm" class="w-28" />
      <USelect :items="[{label:'全部分类',value:'all'}]" model-value="all" size="sm" class="w-28" />
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-rotate-ccw" @click="load">重置</UButton>
      <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-download">导出</UButton>
    </div>

    <!-- 统计 5 块 -->
    <div class="grid gap-3 sm:grid-cols-5">
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">全部内容</p>
        <p class="mt-1 text-xl font-bold text-highlighted">{{ stats?.total ?? '-' }}<span class="text-xs font-normal"> 篇</span></p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">已发布</p>
        <p class="mt-1 text-xl font-bold text-highlighted">{{ stats?.published ?? '-' }}<span class="text-xs font-normal"> 篇</span></p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">草稿中</p>
        <p class="mt-1 text-xl font-bold text-highlighted">{{ stats?.draft ?? '-' }}<span class="text-xs font-normal"> 篇</span></p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">审核中</p>
        <p class="mt-1 text-xl font-bold text-highlighted">—</p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">已下线</p>
        <p class="mt-1 text-xl font-bold text-highlighted">{{ stats?.archived ?? 0 }}<span class="text-xs font-normal"> 篇</span></p>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center text-sm text-muted">正在加载…</div>
    <template v-else>
      <!-- 活动或全部时显示活动 -->
      <div v-if="tab==='all' || tab==='activities'" class="rounded-lg border border-default bg-default">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted">
              <tr>
                <th class="px-3 py-2 text-left font-normal"><UCheckbox /></th>
                <th class="px-3 py-2 text-left font-normal">标题</th>
                <th class="px-3 py-2 text-left font-normal">类型</th>
                <th class="px-3 py-2 text-left font-normal">分类</th>
                <th class="px-3 py-2 text-left font-normal">发布状态</th>
                <th class="px-3 py-2 text-left font-normal">发布时间</th>
                <th class="px-3 py-2 text-left font-normal">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="a in filteredActivities" :key="a.id" class="hover:bg-muted/30">
                <td class="px-3 py-2"><UCheckbox /></td>
                <td class="px-3 py-2">
                  <div class="flex gap-2">
                    <img v-if="a.cover?.src" :src="a.cover.src" class="size-10 rounded object-cover" alt="" />
                    <div v-else class="grid size-10 place-items-center rounded bg-muted text-xs">无图</div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-highlighted">{{ a.title }}</p>
                      <p class="truncate text-xs text-muted">{{ a.location }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2"><UBadge size="xs" color="success" variant="soft">活动</UBadge></td>
                <td class="px-3 py-2 text-xs text-muted">{{ a.activityType }}</td>
                <td class="px-3 py-2"><UBadge size="xs" color="success" variant="soft">已发布</UBadge></td>
                <td class="px-3 py-2 text-xs text-muted">{{ formatCompactDate(a.startAt) }}</td>
                <td class="px-3 py-2">
                  <div class="flex gap-1">
                    <UButton size="xs" variant="ghost" color="neutral" @click="editActivity(a)">编辑</UButton>
                    <UButton size="xs" variant="ghost" color="neutral" :to="a.detailPath">预览</UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 公告 -->
      <div v-if="tab==='all' || tab==='announcements'" class="rounded-lg border border-default bg-default">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted">
              <tr>
                <th class="px-3 py-2 text-left font-normal"><UCheckbox /></th>
                <th class="px-3 py-2 text-left font-normal">标题</th>
                <th class="px-3 py-2 text-left font-normal">类型</th>
                <th class="px-3 py-2 text-left font-normal">发布状态</th>
                <th class="px-3 py-2 text-left font-normal">发布时间</th>
                <th class="px-3 py-2 text-left font-normal">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="a in filteredAnnouncements" :key="a.id" class="hover:bg-muted/30">
                <td class="px-3 py-2"><UCheckbox /></td>
                <td class="px-3 py-2">
                  <div class="flex gap-2">
                    <div class="grid size-10 place-items-center rounded bg-muted"><UIcon name="i-lucide-megaphone" class="size-5 text-muted" /></div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-highlighted">{{ a.title }}</p>
                      <p class="truncate text-xs text-muted">{{ a.publisherScope }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2"><UBadge size="xs" color="info" variant="soft">公告</UBadge></td>
                <td class="px-3 py-2"><UBadge size="xs" color="warning" variant="soft">草稿</UBadge></td>
                <td class="px-3 py-2 text-xs text-muted">{{ formatCompactDate(a.publishedAt) }}</td>
                <td class="px-3 py-2">
                  <div class="flex gap-1">
                    <UButton size="xs" variant="ghost" color="neutral" @click="editAnnouncement(a)">编辑</UButton>
                    <UButton size="xs" variant="ghost" color="neutral" :to="a.detailPath">预览</UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <PublishDynamicsModal :open="publishOpen" @update:open="publishOpen=$event" @select="onPublishSelect" />
    <ActivityEditorModal :open="activityEditorOpen" :activity="editingActivity" :sync-announcement="syncAnnouncement" @update:open="activityEditorOpen=$event" @saved="load" />
    <AnnouncementEditorModal :open="announcementEditorOpen" :announcement="editingAnnouncement" @update:open="announcementEditorOpen=$event" @saved="load" />
  </div>
</template>
