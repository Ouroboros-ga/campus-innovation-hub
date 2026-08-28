<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import NotificationItem from '@/features/notifications/components/NotificationItem.vue'
import NotificationTabs from '@/features/notifications/components/NotificationTabs.vue'
import type { NotificationTabKey } from '@/features/notifications/types'
import { MENTION_TYPES } from '@/features/notifications/types'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const active = ref<NotificationTabKey>('all')

onMounted(() => {
  if (!store.initialized) void store.fetchList()
})

watch(
  () => store.initialized,
  v => {
    if (!v) void store.fetchList()
  }
)

const counts = computed<Record<NotificationTabKey, number>>(() => {
  const all = store.items.length
  const unread = store.items.filter(n => n.read_at === null).length
  const mention = store.items.filter(n => MENTION_TYPES.includes(n.notification_type)).length
  const system = store.items.filter(n => n.notification_type === 'SYSTEM').length
  return { all, unread, mention, system }
})

const filtered = computed(() => {
  switch (active.value) {
    case 'unread':
      return store.items.filter(n => n.read_at === null)
    case 'mention':
      return store.items.filter(n => MENTION_TYPES.includes(n.notification_type))
    case 'system':
      return store.items.filter(n => n.notification_type === 'SYSTEM')
    default:
      return store.items
  }
})

async function handleMarkAll(): Promise<void> {
  await store.markAllRead()
}
</script>

<template>
  <section class="pb-10">
    <!-- 桌面标题栏（手机端由 AppHeader 的 MobilePageHeader 承载，避免重复标题） -->
    <div class="hidden border-b border-default bg-default md:block">
      <PageContainer class="max-w-3xl">
        <div class="flex h-[56px] items-center justify-between">
          <h1 class="text-[18px] font-semibold text-highlighted">
            通知中心
          </h1>
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="store.unreadCount === 0"
              @click="handleMarkAll"
            >
              全部已读
            </UButton>
            <UButton
              icon="i-lucide-settings"
              variant="ghost"
              color="neutral"
              aria-label="通知设置"
              to="/me/settings"
            />
          </div>
        </div>
      </PageContainer>
    </div>

    <PageContainer class="max-w-3xl">
      <!-- 分类 -->
      <div class="mt-2 bg-default md:mt-4 md:rounded-xl md:border md:border-default md:shadow-sm">
        <div class="px-2 md:px-4">
          <NotificationTabs
            v-model:active="active"
            :counts="counts"
          />
        </div>

        <!-- 列表 -->
        <div class="px-2 py-2">
          <div
            v-if="store.loading"
            class="space-y-2 p-3"
          >
            <USkeleton class="h-16 w-full" />
            <USkeleton class="h-16 w-full" />
            <USkeleton class="h-16 w-full" />
          </div>
          <div
            v-else-if="filtered.length === 0"
            class="py-16 text-center"
          >
            <UIcon
              name="i-lucide-bell-off"
              class="mx-auto size-8 text-muted"
              aria-hidden="true"
            />
            <p class="mt-3 text-sm text-muted">
              暂无通知
            </p>
          </div>
          <div
            v-else
            class="divide-y divide-default/60"
          >
            <NotificationItem
              v-for="item in filtered"
              :key="item.id"
              :item="item"
            />
          </div>
          <p
            v-if="!store.loading && filtered.length > 0"
            class="py-4 text-center text-xs text-muted"
          >
            没有更多通知了
          </p>
        </div>
      </div>

      <!-- 移动端底部固定操作（模拟设计稿底部按钮，兼容 safe-area） -->
      <div
        class="fixed inset-x-0 bottom-0 z-30 border-t border-default bg-default p-3 md:hidden"
        style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
      >
        <UButton
          block
          variant="outline"
          color="primary"
          icon="i-lucide-check-check"
          :disabled="store.unreadCount === 0"
          @click="handleMarkAll"
        >
          全部已读
        </UButton>
      </div>

      <!-- 为固定底部预留空间（仅手机端） -->
      <div
        class="h-[calc(56px+env(safe-area-inset-bottom))] md:hidden"
        aria-hidden="true"
      />
    </PageContainer>
  </section>
</template>
