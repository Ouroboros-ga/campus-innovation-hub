<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import NotificationItem from '@/features/notifications/components/NotificationItem.vue'
import NotificationTabs from '@/features/notifications/components/NotificationTabs.vue'
import type { NotificationTabKey } from '@/features/notifications/types'
import { MENTION_TYPES } from '@/features/notifications/types'
import { useNotificationsStore } from '@/stores/notifications'

const props = defineProps<{
  /** 是否为下拉模式（桌面）；false 时为嵌入式列表（复用同一组件）。 */
  compact?: boolean
}>()

const emit = defineEmits<{
  close: []
  'view-all': []
}>()

const router = useRouter()
const store = useNotificationsStore()
const active = ref<NotificationTabKey>('all')

// 初次展开时拉取列表
watch(
  () => store.initialized,
  v => {
    if (!v) void store.fetchList()
  },
  { immediate: true }
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

function handleViewAll(): void {
  emit('view-all')
  void router.push('/notifications')
  emit('close')
}
</script>

<template>
  <div
    :class="[
      'flex flex-col bg-default',
      props.compact ? 'max-h-[480px] w-[380px]' : 'w-full'
    ]"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between px-4 pb-2 pt-4">
      <h2 class="text-[15px] font-semibold text-highlighted">
        通知中心
      </h2>
      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :disabled="store.unreadCount === 0"
          @click="handleMarkAll"
        >
          全部已读
        </UButton>
        <UButton
          icon="i-lucide-settings"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="通知设置"
          to="/me/settings"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- 分类 -->
    <div class="px-4">
      <NotificationTabs
        v-model:active="active"
        :counts="counts"
      />
    </div>

    <!-- 列表 -->
    <div class="flex-1 overflow-y-auto px-2 py-2">
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
        class="py-10 text-center text-sm text-muted"
      >
        暂无通知
      </div>
      <div
        v-else
        class="space-y-0.5"
      >
        <NotificationItem
          v-for="item in filtered.slice(0, compact ? 5 : filtered.length)"
          :key="item.id"
          :item="item"
        />
      </div>
      <p
        v-if="!store.loading && filtered.length > 0 && !compact"
        class="py-4 text-center text-xs text-muted"
      >
        没有更多通知了
      </p>
    </div>

    <!-- 底部 -->
    <div
      v-if="compact"
      class="border-t border-default p-2"
    >
      <UButton
        block
        variant="ghost"
        color="neutral"
        trailing-icon="i-lucide-chevron-right"
        @click="handleViewAll"
      >
        查看全部通知
      </UButton>
    </div>
  </div>
</template>
