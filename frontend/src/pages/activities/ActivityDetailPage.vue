<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate, formatDateTimeCompact } from '@/shared/lib/date'
import {
  activityTypeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'

import ActivityEditorModal from '@/features/ops/components/ActivityEditorModal.vue'
import DynamicsDetailSection from '@/features/dynamics/components/DynamicsDetailSection.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getActivity,
  listAnnouncements
} from '@/features/dynamics/api/dynamicsApi'
import {
  deriveActivityRegistrationState
} from '@/features/dynamics/lib/dynamicsFilters'
import type {
  DynamicsActivity,
  DynamicsAnnouncement
} from '@/features/dynamics/types'
import RichContent from '@/shared/components/reader/RichContent.vue'

/**
 * 活动详情（FE-051 / FE-104 API 驱动）— /activities/:activityId
 *
 * 展示：类型、报名状态、日期时间、地点、主办组织、主讲人（如有）、
 * 容量（仅在有真实数据时）、正文、相关公告；报名为 inline mock（可报名/取消，LOGIN 冻结）。
 * Phone 使用 Detail Shell，仅在「可报名」时显示安全区兼容的 Sticky Mobile Action。
 */
const route = useRoute()
const auth = useAuthStore()

const id = computed(() => String(route.params.activityId ?? ''))
const activity = ref<DynamicsActivity | null>(null)
const loading = ref(true)
const error = ref(false)
const announcements = ref<DynamicsAnnouncement[]>([])
const now = computed(() => new Date())

/** 仅具备平台内容管理权限（operator / superadmin）时显示编辑入口（UX 判断，后端为权威）。 */
const canEdit = computed(() => auth.isOperator)
const editorOpen = ref(false)

async function load() {
  loading.value = true
  error.value = false
  activity.value = null
  announcements.value = []
  try {
    const [act, anns] = await Promise.all([
      getActivity(id.value),
      listAnnouncements({ page: 1, pageSize: 100 })
    ])
    activity.value = act
    announcements.value = anns.items
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

const state = computed(() =>
  activity.value
    ? deriveActivityRegistrationState(activity.value, now.value)
    : null
)

/** 可报名（含主操作）。 */
const registerable = computed(
  () =>
    Boolean(activity.value?.registrationRequired) && state.value === 'OPEN'
)

const registered = ref(false)
function toggleRegistration() {
  if (!registerable.value) return
  registered.value = !registered.value
}

const relatedAnnouncements = computed(() =>
  announcements.value
    .filter(
      item =>
        item.linkedObject?.kind === 'ACTIVITY' &&
        item.linkedObject.to === `/activities/${id.value}`
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
)
</script>

<template>
  <section
    class="pt-4 pb-10 sm:pt-6 sm:pb-14"
    :class="{ 'pb-28 md:pb-14': registerable }"
  >
    <PageContainer class="max-w-3xl">
      <template v-if="loading">
        <div class="space-y-5">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-40 w-full rounded-card" />
          <USkeleton class="h-28 w-full rounded-card" />
        </div>
      </template>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该活动，或加载失败。
        </p>
        <RouterLink
          to="/activities?tab=activities"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回校园动态
        </RouterLink>
      </div>

      <template v-else-if="activity">
        <!-- 桌面/平板面包屑：手机端由居中返回头承担返回（§16.5） -->
        <nav
          class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
          aria-label="面包屑"
        >
          <RouterLink
            to="/activities?tab=activities"
            class="transition-colors hover:text-primary-600"
          >
            校园动态
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <span class="text-highlighted">
            活动
          </span>
        </nav>

        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ activityTypeLabel[activity.activityType] }}
          </UBadge>
          <UBadge
            v-if="state"
            size="sm"
            variant="soft"
            :color="state === 'OPEN' ? 'success' : state === 'UPCOMING' ? 'warning' : 'neutral'"
          >
            {{ registrationStateLabel[state] }}
          </UBadge>

          <UButton
            v-if="canEdit"
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-pencil"
            class="ml-auto"
            @click="editorOpen = true"
          >
            编辑
          </UButton>
        </div>

        <h1 class="mt-3 text-2xl font-semibold leading-snug text-highlighted">
          {{ activity.title }}
        </h1>
        <p
          v-if="activity.summary"
          class="mt-2 text-sm text-muted"
        >
          {{ activity.summary }}
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-surface border border-default p-3">
            <p class="text-xs text-muted">
              时间
            </p>
            <p class="mt-1 text-sm font-medium text-highlighted">
              {{ formatDateTimeCompact(activity.startAt) }}
            </p>
          </div>
          <div class="rounded-surface border border-default p-3">
            <p class="text-xs text-muted">
              地点
            </p>
            <p class="mt-1 text-sm font-medium text-highlighted">
              {{ activity.location }}
            </p>
          </div>
          <div
            v-if="activity.organizerName"
            class="rounded-surface border border-default p-3"
          >
            <p class="text-xs text-muted">
              主办
            </p>
            <p class="mt-1 text-sm font-medium text-highlighted">
              {{ activity.organizerName }}
            </p>
          </div>
          <div
            v-if="activity.speaker"
            class="rounded-surface border border-default p-3"
          >
            <p class="text-xs text-muted">
              主讲人 / 嘉宾
            </p>
            <p class="mt-1 text-sm font-medium text-highlighted">
              {{ activity.speaker }}
            </p>
          </div>
          <div
            v-if="activity.registrationStartAt"
            class="rounded-surface border border-default p-3"
          >
            <p class="text-xs text-muted">
              报名开始
            </p>
            <p class="mt-1 text-sm font-medium tabular-nums text-highlighted">
              {{ formatCompactDate(activity.registrationStartAt) }}
            </p>
          </div>
          <div
            v-if="activity.registrationEndAt"
            class="rounded-surface border border-default p-3"
          >
            <p class="text-xs text-muted">
              报名截止
            </p>
            <p class="mt-1 text-sm font-medium tabular-nums text-highlighted">
              {{ formatCompactDate(activity.registrationEndAt) }}
            </p>
          </div>
          <div
            v-if="activity.capacity != null"
            class="rounded-surface border border-default p-3"
          >
            <p class="text-xs text-muted">
              名额
            </p>
            <p class="mt-1 text-sm font-medium tabular-nums text-highlighted">
              {{ activity.capacity }} 人
            </p>
          </div>
        </div>

        <!-- 桌面/平板：行动区 -->
        <div class="mt-6 hidden md:flex md:items-center md:justify-between">
          <p
            v-if="registerable"
            class="text-sm text-muted"
          >
            报名已开放，点击下方按钮参加
          </p>
          <UButton
            v-if="registerable"
            :color="registered ? 'neutral' : 'primary'"
            :variant="registered ? 'soft' : 'solid'"
            :icon="registered ? 'i-lucide-user-minus' : 'i-lucide-user-plus'"
            @click="toggleRegistration"
          >
            {{ registered ? '取消报名' : '报名参加' }}
          </UButton>
        </div>

        <div class="mt-8 space-y-8">
          <DynamicsDetailSection title="活动简介">
            <RichContent
              v-if="activity.descriptionMd"
              :content="activity.descriptionMd"
            />
            <p
              v-else
              class="text-sm text-muted"
            >
              暂无活动介绍。
            </p>
          </DynamicsDetailSection>

          <DynamicsDetailSection title="相关公告">
            <ul
              v-if="relatedAnnouncements.length"
              class="divide-y divide-default"
            >
              <li
                v-for="item in relatedAnnouncements"
                :key="item.id"
              >
                <RouterLink
                  :to="item.detailPath"
                  class="group flex items-center justify-between gap-3 py-3"
                >
                  <span
                    class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600"
                  >
                    {{ item.title }}
                  </span>
                  <span class="shrink-0 text-xs tabular-nums text-muted">
                    {{ formatCompactDate(item.publishedAt) }}
                  </span>
                </RouterLink>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-muted"
            >
              暂无相关公告。
            </p>
          </DynamicsDetailSection>
        </div>
      </template>
    </PageContainer>

    <!-- Phone Sticky Mobile Action（仅可报名时显示，安全区兼容） -->
    <div
      v-if="activity && registerable"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <p class="min-w-0 flex-1 text-sm text-muted">
          {{ registered ? '已报名' : '报名已开放' }}
        </p>
        <UButton
          :color="registered ? 'neutral' : 'primary'"
          :variant="registered ? 'soft' : 'solid'"
          class="shrink-0"
          @click="toggleRegistration"
        >
          {{ registered ? '取消报名' : '报名参加' }}
        </UButton>
      </div>
    </div>

    <ActivityEditorModal
      :open="editorOpen"
      :activity="activity"
      @update:open="editorOpen = $event"
      @saved="load"
    />
  </section>
</template>
