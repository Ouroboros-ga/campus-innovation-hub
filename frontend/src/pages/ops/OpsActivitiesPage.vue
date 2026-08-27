<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import PublishDynamicsModal from '@/features/ops/components/PublishDynamicsModal.vue'
import ActivityEditorModal from '@/features/ops/components/ActivityEditorModal.vue'
import AnnouncementEditorModal from '@/features/ops/components/AnnouncementEditorModal.vue'
import { listActivities } from '@/features/ops/api/opsActivityApi'
import { listAnnouncements } from '@/features/ops/api/opsAnnouncementApi'
import {
  activityStatusOptions,
  activityTypeOptions,
  announcementScopeOptions,
  deriveActivityRegistrationState,
  filterActivities,
  filterAnnouncements,
  type ActivityStatusFilter,
  type ActivityTypeFilter,
  type AnnouncementScopeFilter
} from '@/features/dynamics/lib/dynamicsFilters'
import {
  announcementLinkedKindLabel,
  publisherScopeLabel
} from '@/features/dynamics/lib/dynamicsLabels'
import { activityTypeLabel } from '@/shared/lib/domain-labels'
import type { DynamicsActivity, DynamicsAnnouncement } from '@/features/dynamics/types'
import { formatDateTimeCompact } from '@/shared/lib/date'

/** 校园动态管理（FE-090 /ops/activities）。
 *  活动与公告保留独立表 / 字段；「发布动态」明确选择 活动/公告/同步发布。 */
const toast = useToast()

const tab = ref<'activities' | 'announcements'>('activities')
const activityStatus = ref('ALL')
const activityType = ref('ALL')
const announcementScope = ref('ALL')

const now = computed(() => new Date())

const publishOpen = ref(false)
const activityEditorOpen = ref(false)
const editingActivity = ref<DynamicsActivity | null>(null)
const syncAnnouncement = ref(false)
const announcementEditorOpen = ref(false)
const editingAnnouncement = ref<DynamicsAnnouncement | null>(null)

const activities = ref<DynamicsActivity[]>([])
const activitiesLoading = ref(false)
const activitiesError = ref('')
const announcements = ref<DynamicsAnnouncement[]>([])
const announcementsLoading = ref(false)
const announcementsError = ref('')

async function loadActivities() {
  activitiesLoading.value = true
  activitiesError.value = ''
  try {
    const result = await listActivities({
      status: activityStatus.value === 'ALL' ? undefined : activityStatus.value,
      activityType: activityType.value === 'ALL' ? undefined : activityType.value
    })
    activities.value = result.items
  } catch {
    activitiesError.value = '活动列表加载失败，请稍后重试。'
  } finally {
    activitiesLoading.value = false
  }
}

async function loadAnnouncements() {
  announcementsLoading.value = true
  announcementsError.value = ''
  try {
    const result = await listAnnouncements({
      publisherScope: announcementScope.value === 'ALL' ? undefined : announcementScope.value
    })
    announcements.value = result.items
  } catch {
    announcementsError.value = '公告列表加载失败，请稍后重试。'
  } finally {
    announcementsLoading.value = false
  }
}

onMounted(() => {
  loadActivities()
  loadAnnouncements()
})

const activityRows = computed(() =>
  filterActivities(
    activities.value,
    { status: activityStatus.value as ActivityStatusFilter, type: activityType.value as ActivityTypeFilter },
    now.value
  )
)
const announcementRows = computed(() =>
  filterAnnouncements(announcements.value, { scope: announcementScope.value as AnnouncementScopeFilter })
)

const registerBadge: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  OPEN: 'success',
  UPCOMING: 'info',
  CLOSED: 'neutral',
  NOT_REQUIRED: 'neutral',
  FULL: 'warning',
  NOT_AVAILABLE: 'neutral'
}

function registrationLabel(state: ReturnType<typeof deriveActivityRegistrationState>) {
  const map: Record<string, string> = {
    OPEN: '报名中',
    UPCOMING: '即将开始',
    CLOSED: '报名已结束',
    NOT_REQUIRED: '无需报名',
    FULL: '已满',
    NOT_AVAILABLE: '不可报名'
  }
  return map[state] ?? '未知'
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

function editActivity(activity: DynamicsActivity) {
  editingActivity.value = activity
  syncAnnouncement.value = false
  activityEditorOpen.value = true
}

function editAnnouncement(announcement: DynamicsAnnouncement) {
  editingAnnouncement.value = announcement
  announcementEditorOpen.value = true
}

function notify(title: string) {
  toast.add({
    title,
    description: '演示环境（mock）。',
    color: 'neutral',
    icon: 'i-lucide-info'
  })
}

const tabs = [
  { value: 'activities', label: '活动' },
  { value: 'announcements', label: '公告' }
] as const
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="动态类型"
        class="flex gap-2"
      >
        <UButton
          v-for="item in tabs"
          :key="item.value"
          size="sm"
          color="neutral"
          :variant="tab === item.value ? 'solid' : 'outline'"
          :aria-pressed="tab === item.value"
          @click="tab = item.value"
        >
          {{ item.label }}
        </UButton>
      </div>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="publishOpen = true"
      >
        发布动态
      </UButton>
    </div>

    <!-- 活动 tab -->
    <template v-if="tab === 'activities'">
      <div class="flex flex-wrap gap-2">
        <USelect
          v-model="activityStatus"
          :items="activityStatusOptions"
          placeholder="全部状态"
          class="w-40"
        />
        <USelect
          v-model="activityType"
          :items="activityTypeOptions"
          placeholder="全部类型"
          class="w-44"
        />
      </div>

      <p
        v-if="activitiesLoading"
        class="text-sm text-muted"
      >
        正在加载活动…
      </p>
      <p
        v-else-if="activitiesError"
        class="text-sm text-danger-600 dark:text-danger-400"
      >
        {{ activitiesError }}
      </p>
      <ul
        v-else-if="activityRows.length"
        class="space-y-3"
      >
        <li
          v-for="activity in activityRows"
          :key="activity.id"
          class="rounded-surface border border-default bg-default p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-highlighted">
                {{ activity.title }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ activityTypeLabel[activity.activityType] }} ·
                {{ formatDateTimeCompact(activity.startAt) }} · {{ activity.location }}
              </p>
            </div>
            <UBadge
              size="sm"
              variant="soft"
              :color="registerBadge[deriveActivityRegistrationState(activity, now)]"
            >
              {{ registrationLabel(deriveActivityRegistrationState(activity, now)) }}
            </UBadge>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              :to="activity.detailPath"
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
              @click="editActivity(activity)"
            >
              编辑
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-check"
              @click="notify('结束活动')"
            >
              结束
            </UButton>
          </div>
        </li>
      </ul>
      <p
        v-else
        class="text-sm text-muted"
      >
        暂无符合条件的活动。
      </p>
    </template>

    <!-- 公告 tab -->
    <template v-else>
      <div class="flex flex-wrap gap-2">
        <USelect
          v-model="announcementScope"
          :items="announcementScopeOptions"
          placeholder="全部来源"
          class="w-40"
        />
      </div>

      <p
        v-if="announcementsLoading"
        class="text-sm text-muted"
      >
        正在加载公告…
      </p>
      <p
        v-else-if="announcementsError"
        class="text-sm text-danger-600 dark:text-danger-400"
      >
        {{ announcementsError }}
      </p>
      <ul
        v-else-if="announcementRows.length"
        class="space-y-3"
      >
        <li
          v-for="announcement in announcementRows"
          :key="announcement.id"
          class="rounded-surface border border-default bg-default p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-highlighted">
                {{ announcement.title }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ publisherScopeLabel[announcement.publisherScope] }}
                <template v-if="announcement.linkedObject">
                  · 关联 {{ announcementLinkedKindLabel[announcement.linkedObject.kind] }}
                </template>
                <template v-if="announcement.externalUrl">
                  · 站外原文
                </template>
                · {{ formatDateTimeCompact(announcement.publishedAt) }}
              </p>
            </div>
            <UBadge
              v-if="announcement.externalUrl"
              size="sm"
              variant="soft"
              color="info"
              icon="i-lucide-external-link"
            >
              有原文
            </UBadge>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              :to="announcement.detailPath"
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
              @click="editAnnouncement(announcement)"
            >
              编辑
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              @click="notify('归档公告')"
            >
              归档
            </UButton>
          </div>
        </li>
      </ul>
      <p
        v-else
        class="text-sm text-muted"
      >
        暂无符合条件的公告。
      </p>
    </template>

    <PublishDynamicsModal
      :open="publishOpen"
      @update:open="publishOpen = $event"
      @select="onPublishSelect"
    />
    <ActivityEditorModal
      :open="activityEditorOpen"
      :activity="editingActivity"
      :sync-announcement="syncAnnouncement"
      @update:open="activityEditorOpen = $event"
      @saved="loadActivities"
    />
    <AnnouncementEditorModal
      :open="announcementEditorOpen"
      :announcement="editingAnnouncement"
      @update:open="announcementEditorOpen = $event"
      @saved="loadAnnouncements"
    />
  </div>
</template>
