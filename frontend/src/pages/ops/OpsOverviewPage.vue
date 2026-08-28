<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { getRecentDrafts, getWorkbenchStats, type RecentDrafts, type WorkbenchStats } from '@/features/ops/api/opsOverviewApi'
import { formatCompactDate } from '@/shared/lib/date'

const stats = ref<WorkbenchStats | null>(null)
const recent = ref<RecentDrafts | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const [s, r] = await Promise.all([getWorkbenchStats(), getRecentDrafts()])
    stats.value = s
    recent.value = r
  } catch {
    // 保持空状态
  } finally {
    loading.value = false
  }
})

const pendingItems = computed(() => {
  if (!stats.value) return []
  return [
    { label: '待审核申请', value: stats.value.pending.applications, icon: 'i-lucide-file-check', color: 'bg-red-50 text-red-600 dark:bg-red-950' },
    { label: '待回复咨询', value: stats.value.pending.consultations, icon: 'i-lucide-message-square', color: 'bg-orange-50 text-orange-600 dark:bg-orange-950' },
    { label: '内容待发布', value: stats.value.pending.pending_publish, icon: 'i-lucide-send', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950' },
    { label: '内容待完善', value: stats.value.health.missing_cover + stats.value.health.missing_official_url, icon: 'i-lucide-shield-alert', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950' }
  ]
})

const overviewItems = computed(() => {
  if (!stats.value) return []
  return [
    { label: '总内容数', value: stats.value.overview.total, icon: 'i-lucide-files' },
    { label: '已发布', value: stats.value.overview.published, icon: 'i-lucide-check-circle', color: 'text-success-600' },
    { label: '草稿中', value: stats.value.overview.draft, icon: 'i-lucide-pen-line', color: 'text-warning-600' },
    { label: '已归档', value: stats.value.overview.archived, icon: 'i-lucide-archive', color: 'text-muted' }
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">运营工作台 👋</h2>
        <p class="mt-1 text-sm text-muted">统一管理平台内容，提升运营效率与内容质量</p>
      </div>
      <span class="hidden text-xs text-muted sm:block">数据更新于 {{ formatCompactDate(new Date().toISOString()) }}</span>
    </div>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <USkeleton class="h-36 rounded-lg" />
      <USkeleton class="h-36 rounded-lg" />
      <USkeleton class="h-36 rounded-lg" />
    </div>

    <template v-else>
      <!-- 上排三列 -->
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- 待办事项 -->
        <div class="rounded-lg border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-highlighted">待办事项</h3>
            <RouterLink to="/ops/questions" class="text-xs text-primary-600 hover:underline">查看全部待办 →</RouterLink>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in pendingItems"
              :key="item.label"
              class="rounded-lg border border-default bg-muted/50 p-3"
            >
              <div class="flex items-center gap-2">
                <span class="grid size-7 place-items-center rounded-md" :class="item.color">
                  <UIcon :name="item.icon" class="size-4" />
                </span>
              </div>
              <p class="mt-2 text-xl font-bold tabular-nums text-highlighted">{{ item.value }}</p>
              <p class="text-xs text-muted">{{ item.label }}</p>
            </div>
          </div>
        </div>

        <!-- 内容概览 -->
        <div class="rounded-lg border border-default bg-default p-4">
          <h3 class="mb-3 text-sm font-semibold text-highlighted">内容概览</h3>
          <div class="grid grid-cols-4 gap-2">
            <div v-for="item in overviewItems" :key="item.label" class="text-center">
              <span class="mx-auto grid size-8 place-items-center rounded-full bg-muted">
                <UIcon :name="item.icon" class="size-4 text-muted" :class="item.color" />
              </span>
              <p class="mt-2 text-lg font-bold tabular-nums text-highlighted">{{ item.value }}</p>
              <p class="text-xs text-muted">{{ item.label }}</p>
            </div>
          </div>
        </div>

        <!-- 快捷数据占位（无 PV/UV 时展示健康） -->
        <div class="rounded-lg border border-default bg-default p-4">
          <h3 class="mb-3 text-sm font-semibold text-highlighted">内容健康</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-md bg-muted p-3">
              <p class="text-xs text-muted">缺封面</p>
              <p class="mt-1 text-lg font-bold text-highlighted">{{ stats?.health.missing_cover ?? 0 }}</p>
            </div>
            <div class="rounded-md bg-muted p-3">
              <p class="text-xs text-muted">缺官网</p>
              <p class="mt-1 text-lg font-bold text-highlighted">{{ stats?.health.missing_official_url ?? 0 }}</p>
            </div>
            <div class="rounded-md bg-muted p-3">
              <p class="text-xs text-muted">7天内截止</p>
              <p class="mt-1 text-lg font-bold text-warning-600">{{ stats?.health.near_deadline ?? 0 }}</p>
            </div>
            <div class="rounded-md bg-muted p-3">
              <p class="text-xs text-muted">待发布</p>
              <p class="mt-1 text-lg font-bold text-highlighted">{{ stats?.pending.pending_publish ?? 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 中排 -->
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-highlighted">最近发布</h3>
            <RouterLink to="/ops/competitions" class="text-xs text-primary-600 hover:underline">查看全部 →</RouterLink>
          </div>
          <ul class="space-y-2">
            <li
              v-for="item in recent?.recent ?? []"
              :key="item.id"
              class="flex items-center justify-between rounded-md border border-default px-3 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm text-highlighted">{{ item.title }}</p>
                <p class="text-xs text-muted">{{ item.type }} · {{ formatCompactDate(item.updated_at) }}</p>
              </div>
              <UBadge size="xs" color="success" variant="soft">已发布</UBadge>
            </li>
            <li v-if="!recent?.recent.length" class="py-6 text-center text-sm text-muted">暂无发布记录</li>
          </ul>
        </div>

        <div class="rounded-lg border border-default bg-default p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-highlighted">草稿箱</h3>
            <RouterLink to="/ops/competitions" class="text-xs text-primary-600 hover:underline">查看全部 →</RouterLink>
          </div>
          <ul class="space-y-2">
            <li
              v-for="item in recent?.drafts ?? []"
              :key="item.id"
              class="flex items-center justify-between rounded-md border border-default px-3 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm text-highlighted">{{ item.title }}</p>
                <p class="text-xs text-muted">{{ item.type }} · {{ formatCompactDate(item.updated_at) }}</p>
              </div>
              <UButton size="xs" color="neutral" variant="soft">继续编辑</UButton>
            </li>
            <li v-if="!recent?.drafts.length" class="py-6 text-center text-sm text-muted">草稿箱为空</li>
          </ul>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="rounded-lg border border-default bg-default p-4">
        <h3 class="mb-3 text-sm font-semibold text-highlighted">快捷入口</h3>
        <div class="grid grid-cols-5 gap-2 sm:grid-cols-10">
          <RouterLink
            v-for="entry in [
              { label: '新建竞赛', icon: 'i-lucide-trophy', to: '/ops/competitions' },
              { label: '新建活动', icon: 'i-lucide-calendar-plus', to: '/ops/activities' },
              { label: '发布动态', icon: 'i-lucide-send', to: '/ops/activities' },
              { label: '创建公告', icon: 'i-lucide-megaphone', to: '/ops/activities' },
              { label: '添加指南', icon: 'i-lucide-book-open', to: '/ops/guides' },
              { label: '首页编辑', icon: 'i-lucide-home', to: '/ops/competitions' },
              { label: '轮播管理', icon: 'i-lucide-images', to: '/ops/competitions' },
              { label: '审核申请', icon: 'i-lucide-user-check', to: '/ops/questions' },
              { label: '标签管理', icon: 'i-lucide-tag', to: '/ops/guides' },
              { label: '素材库', icon: 'i-lucide-folder', to: '/ops/competitions' }
            ]"
            :key="entry.label"
            :to="entry.to"
            class="flex flex-col items-center gap-1 rounded-md border border-default bg-muted/30 px-2 py-3 hover:bg-muted"
          >
            <UIcon :name="entry.icon" class="size-5 text-primary-600" />
            <span class="text-xs text-highlighted">{{ entry.label }}</span>
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>
