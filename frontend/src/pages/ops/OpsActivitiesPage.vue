<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ActivityEditorModal from '@/features/ops/components/ActivityEditorModal.vue'
import AnnouncementEditorModal from '@/features/ops/components/AnnouncementEditorModal.vue'
import PublishDynamicsModal from '@/features/ops/components/PublishDynamicsModal.vue'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listAnnouncements } from '@/features/ops/api/opsAnnouncementApi'
import { getDynamicsStats } from '@/features/ops/api/opsOverviewApi'
import type { DynamicsStats } from '@/features/ops/api/opsOverviewApi'
import type { DynamicsActivity, DynamicsAnnouncement } from '@/features/dynamics/types'
import { formatCompactDate } from '@/shared/lib/date'

const route = useRoute()
const router = useRouter()

const rawTab = route.query.tab as string | undefined
const tab = ref<'all' | 'activities' | 'announcements'>(rawTab === 'activities' || rawTab === 'announcements' ? rawTab : 'all')
const stats = ref<DynamicsStats | null>(null)

const activities = ref<DynamicsActivity[]>([])
const announcements = ref<DynamicsAnnouncement[]>([])
const loading = ref(false)
const error = ref('')
const totalActivities = ref(0)
const totalAnnouncements = ref(0)
const activityPage = ref(Number(route.query.activity_page ?? 1) || 1)
const announcementPage = ref(Number(route.query.announcement_page ?? 1) || 1)
const pageSize = 20

const query = ref((route.query.q as string) ?? '')
const activityType = ref((route.query.activity_type as string) ?? 'ALL')
const activityStatus = ref((route.query.activity_status as string) ?? 'ALL')
const announcementScope = ref((route.query.publisher_scope as string) ?? 'ALL')
const announcementStatus = ref((route.query.announcement_status as string) ?? 'ALL')

const publishOpen = ref(false)
const activityEditorOpen = ref(false)
const editingActivity = ref<DynamicsActivity | null>(null)
const syncAnnouncement = ref(false)
const announcementEditorOpen = ref(false)
const editingAnnouncement = ref<DynamicsAnnouncement | null>(null)

function syncFromRoute() {
  const t = route.query.tab as string | undefined
  tab.value = t === 'activities' || t === 'announcements' ? t : 'all'
  query.value = (route.query.q as string) ?? ''
  activityType.value = (route.query.activity_type as string) ?? 'ALL'
  activityStatus.value = (route.query.activity_status as string) ?? 'ALL'
  announcementScope.value = (route.query.publisher_scope as string) ?? 'ALL'
  announcementStatus.value = (route.query.announcement_status as string) ?? 'ALL'
  activityPage.value = Number(route.query.activity_page ?? 1) || 1
  announcementPage.value = Number(route.query.announcement_page ?? 1) || 1
}

function pushRoute(overrides: Record<string, string | undefined> = {}, resetPage = false) {
  const next: Record<string, string> = {}
  const t = overrides.tab !== undefined ? overrides.tab : tab.value
  const q = overrides.q !== undefined ? overrides.q : query.value
  const at = overrides.activity_type !== undefined ? overrides.activity_type : activityType.value
  const as = overrides.activity_status !== undefined ? overrides.activity_status : activityStatus.value
  const ps = overrides.publisher_scope !== undefined ? overrides.publisher_scope : announcementScope.value
  const ans = overrides.announcement_status !== undefined ? overrides.announcement_status : announcementStatus.value
  const ap = resetPage ? 1 : (overrides.activity_page !== undefined ? Number(overrides.activity_page) : activityPage.value)
  const anp = resetPage ? 1 : (overrides.announcement_page !== undefined ? Number(overrides.announcement_page) : announcementPage.value)
  if (t && t !== 'all') next.tab = t
  if (q) next.q = q
  if (at && at !== 'ALL') next.activity_type = at
  if (as && as !== 'ALL') next.activity_status = as
  if (ps && ps !== 'ALL') next.publisher_scope = ps
  if (ans && ans !== 'ALL') next.announcement_status = ans
  if (ap > 1) next.activity_page = String(ap)
  if (anp > 1) next.announcement_page = String(anp)
  router.replace({ query: next })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const results = await Promise.allSettled([
      getDynamicsStats(),
      (tab.value === 'all' || tab.value === 'activities')
        ? listActivities({
            q: query.value || undefined,
            status: activityStatus.value === 'ALL' ? undefined : activityStatus.value,
            activityType: activityType.value === 'ALL' ? undefined : activityType.value,
            page: activityPage.value,
            pageSize
          })
        : Promise.resolve({ items: [] as DynamicsActivity[], total: 0, page: 1 }),
      (tab.value === 'all' || tab.value === 'announcements')
        ? listAnnouncements({
            q: query.value || undefined,
            status: announcementStatus.value === 'ALL' ? undefined : announcementStatus.value,
            publisherScope: announcementScope.value === 'ALL' ? undefined : announcementScope.value,
            page: announcementPage.value,
            pageSize
          })
        : Promise.resolve({ items: [] as DynamicsAnnouncement[], total: 0, page: 1 })
    ])
    const sRes = results[0]
    const aRes = results[1]
    const bRes = results[2]
    if (sRes.status === 'fulfilled') stats.value = sRes.value
    if (aRes.status === 'fulfilled') { activities.value = aRes.value.items; totalActivities.value = aRes.value.total }
    else if (tab.value !== 'announcements') throw aRes.reason
    if (bRes.status === 'fulfilled') { announcements.value = bRes.value.items; totalAnnouncements.value = bRes.value.total }
    else if (tab.value !== 'activities') throw bRes.reason
    if (results.some(r => r.status === 'rejected' && (r === sRes ? true : false))) {
      // stats 失败不阻断列表，但若列表失败已 throw
    }
  } catch {
    error.value = '校园动态加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

watch(() => route.query, () => { syncFromRoute(); load() })
onMounted(() => { syncFromRoute(); load() })

function onTabChange(v: 'all'|'activities'|'announcements') { tab.value = v; pushRoute({ tab: v }, true) }
function onSearch() { pushRoute({}, true) }
function onFilterChange() { pushRoute({}, true) }
function onReset() {
  query.value=''; activityType.value='ALL'; activityStatus.value='ALL'; announcementScope.value='ALL'; announcementStatus.value='ALL'
  activityPage.value=1; announcementPage.value=1
  router.replace({ query: tab.value !== 'all' ? { tab: tab.value } : {} })
}

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

const activityTypeOptions = [
  { label: '全部类型', value: 'ALL' },
  { label: '竞赛宣讲', value: 'COMPETITION_BRIEFING' },
  { label: '技术分享', value: 'TECH_SHARING' },
  { label: '科研讲座', value: 'RESEARCH_LECTURE' },
  { label: '培训', value: 'TRAINING' },
  { label: '其他', value: 'OTHER' }
]
const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已归档', value: 'ARCHIVED' }
]
const scopeOptions = [
  { label: '全部来源', value: 'ALL' },
  { label: '学院公告', value: 'ACADEMY' },
  { label: '学校公告', value: 'UNIVERSITY' },
  { label: '平台公告', value: 'PLATFORM' }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          校园动态管理
        </h2>
        <p class="text-sm text-muted">
          统一管理平台的活动与公告内容，支持发布、编辑与状态管理
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="publishOpen = true"
      >
        新建内容
      </UButton>
    </div>

    <!-- 顶部 tabs -->
    <div class="flex gap-2 border-b border-default">
      <button
        v-for="t in [{v:'all',l:'全部内容'},{v:'activities',l:'活动'},{v:'announcements',l:'公告'}] as const"
        :key="t.v"
        class="px-3 py-2 text-sm"
        :class="tab===t.v ? 'border-b-2 border-primary-600 font-medium text-primary-600' : 'text-muted'"
        @click="onTabChange(t.v)"
      >
        {{ t.l }}
      </button>
    </div>

    <!-- 搜索 + 筛选 -->
    <div class="flex flex-wrap gap-2">
      <UInput
        v-model="query"
        placeholder="搜索标题或关键词"
        icon="i-lucide-search"
        size="sm"
        class="w-64"
        @keyup.enter="onSearch"
      />
      <template v-if="tab==='all' || tab==='activities'">
        <USelect
          v-model="activityType"
          :items="activityTypeOptions"
          size="sm"
          class="w-32"
          @update:model-value="onFilterChange"
        />
        <USelect
          v-model="activityStatus"
          :items="statusOptions"
          size="sm"
          class="w-32"
          @update:model-value="onFilterChange"
        />
      </template>
      <template v-if="tab==='all' || tab==='announcements'">
        <USelect
          v-model="announcementScope"
          :items="scopeOptions"
          size="sm"
          class="w-32"
          @update:model-value="onFilterChange"
        />
        <USelect
          v-model="announcementStatus"
          :items="statusOptions"
          size="sm"
          class="w-32"
          @update:model-value="onFilterChange"
        />
      </template>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-rotate-ccw"
        @click="onReset"
      >
        重置
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-download"
      >
        导出
      </UButton>
    </div>

    <!-- 统计 5 块 -->
    <div class="grid gap-3 sm:grid-cols-5">
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">
          全部内容
        </p>
        <p class="mt-1 text-xl font-bold text-highlighted">
          {{ stats?.total ?? '-' }}<span class="text-xs font-normal"> 篇</span>
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">
          已发布
        </p>
        <p class="mt-1 text-xl font-bold text-highlighted">
          {{ stats?.published ?? '-' }}<span class="text-xs font-normal"> 篇</span>
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">
          草稿中
        </p>
        <p class="mt-1 text-xl font-bold text-highlighted">
          {{ stats?.draft ?? '-' }}<span class="text-xs font-normal"> 篇</span>
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">
          审核中
        </p>
        <p class="mt-1 text-xl font-bold text-highlighted">
          —
        </p>
      </div>
      <div class="rounded-lg border border-default bg-default p-3">
        <p class="text-xs text-muted">
          已下线
        </p>
        <p class="mt-1 text-xl font-bold text-highlighted">
          {{ stats?.archived ?? 0 }}<span class="text-xs font-normal"> 篇</span>
        </p>
      </div>
    </div>

    <p
      v-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>

    <div
      v-if="loading"
      class="py-10 text-center text-sm text-muted"
    >
      正在加载…
    </div>
    <template v-else>
      <!-- 活动或全部时显示活动 -->
      <div
        v-if="tab==='all' || tab==='activities'"
        class="rounded-lg border border-default bg-default"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted">
              <tr>
                <th class="px-3 py-2 text-left font-normal">
                  <UCheckbox />
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  标题
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  类型
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  分类
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  发布状态
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  发布时间
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="a in activities"
                :key="a.id"
                class="hover:bg-muted/30"
              >
                <td class="px-3 py-2">
                  <UCheckbox />
                </td>
                <td class="px-3 py-2">
                  <div class="flex gap-2">
                    <img
                      v-if="a.cover?.src"
                      :src="a.cover.src"
                      class="size-10 rounded object-cover"
                      alt=""
                    >
                    <div
                      v-else
                      class="grid size-10 place-items-center rounded bg-muted text-xs"
                    >
                      无图
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-highlighted">
                        {{ a.title }}
                      </p>
                      <p class="truncate text-xs text-muted">
                        {{ a.location }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <UBadge
                    size="xs"
                    color="success"
                    variant="soft"
                  >
                    活动
                  </UBadge>
                </td>
                <td class="px-3 py-2 text-xs text-muted">
                  {{ a.activityType }}
                </td>
                <td class="px-3 py-2">
                  <UBadge
                    size="xs"
                    :color="a.publicationState==='PUBLISHED'?'success':a.publicationState==='DRAFT'?'warning':'neutral'"
                    variant="soft"
                  >
                    {{ a.publicationState==='PUBLISHED'?'已发布':a.publicationState==='DRAFT'?'草稿':'已归档' }}
                  </UBadge>
                </td>
                <td class="px-3 py-2 text-xs text-muted">
                  {{ formatCompactDate(a.startAt) }}
                </td>
                <td class="px-3 py-2">
                  <div class="flex gap-1">
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="editActivity(a)"
                    >
                      编辑
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      :to="a.detailPath"
                    >
                      预览
                    </UButton>
                  </div>
                </td>
              </tr>
              <tr v-if="!activities.length">
                <td
                  colspan="7"
                  class="py-8 text-center text-sm text-muted"
                >
                  暂无活动
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="totalActivities > pageSize"
          class="flex justify-center border-t border-default p-3"
        >
          <UPagination
            :page="activityPage"
            :total="totalActivities"
            :items-per-page="pageSize"
            @update:page="(p:number)=>{ activityPage=p; pushRoute({ activity_page: String(p) }) }"
          />
        </div>
      </div>

      <!-- 公告 -->
      <div
        v-if="tab==='all' || tab==='announcements'"
        class="rounded-lg border border-default bg-default"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 text-xs text-muted">
              <tr>
                <th class="px-3 py-2 text-left font-normal">
                  <UCheckbox />
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  标题
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  类型
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  发布状态
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  发布时间
                </th>
                <th class="px-3 py-2 text-left font-normal">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="a in announcements"
                :key="a.id"
                class="hover:bg-muted/30"
              >
                <td class="px-3 py-2">
                  <UCheckbox />
                </td>
                <td class="px-3 py-2">
                  <div class="flex gap-2">
                    <div class="grid size-10 place-items-center rounded bg-muted">
                      <UIcon
                        name="i-lucide-megaphone"
                        class="size-5 text-muted"
                      />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-highlighted">
                        {{ a.title }}
                      </p>
                      <p class="truncate text-xs text-muted">
                        {{ a.publisherScope }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <UBadge
                    size="xs"
                    color="info"
                    variant="soft"
                  >
                    公告
                  </UBadge>
                </td>
                <td class="px-3 py-2">
                  <UBadge
                    size="xs"
                    :color="a.publicationState==='PUBLISHED'?'success':a.publicationState==='DRAFT'?'warning':'neutral'"
                    variant="soft"
                  >
                    {{ a.publicationState==='PUBLISHED'?'已发布':a.publicationState==='DRAFT'?'草稿':'已归档' }}
                  </UBadge>
                </td>
                <td class="px-3 py-2 text-xs text-muted">
                  {{ formatCompactDate(a.publishedAt) }}
                </td>
                <td class="px-3 py-2">
                  <div class="flex gap-1">
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="editAnnouncement(a)"
                    >
                      编辑
                    </UButton>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      :to="a.detailPath"
                    >
                      预览
                    </UButton>
                  </div>
                </td>
              </tr>
              <tr v-if="!announcements.length">
                <td
                  colspan="6"
                  class="py-8 text-center text-sm text-muted"
                >
                  暂无公告
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="totalAnnouncements > pageSize"
          class="flex justify-center border-t border-default p-3"
        >
          <UPagination
            :page="announcementPage"
            :total="totalAnnouncements"
            :items-per-page="pageSize"
            @update:page="(p:number)=>{ announcementPage=p; pushRoute({ announcement_page: String(p) }) }"
          />
        </div>
      </div>
    </template>

    <PublishDynamicsModal
      :open="publishOpen"
      @update:open="publishOpen=$event"
      @select="onPublishSelect"
    />
    <ActivityEditorModal
      :open="activityEditorOpen"
      :activity="editingActivity"
      :sync-announcement="syncAnnouncement"
      @update:open="activityEditorOpen=$event"
      @saved="load"
    />
    <AnnouncementEditorModal
      :open="announcementEditorOpen"
      :announcement="editingAnnouncement"
      @update:open="announcementEditorOpen=$event"
      @saved="load"
    />
  </div>
</template>
