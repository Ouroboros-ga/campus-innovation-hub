<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type { NotificationItem } from '@/features/notifications/types'
import {
  NOTIFICATION_TYPE_BG,
  NOTIFICATION_TYPE_ICON
} from '@/features/notifications/types'
import { useNotificationsStore } from '@/stores/notifications'

const props = defineProps<{
  item: NotificationItem
}>()

const router = useRouter()
const store = useNotificationsStore()

const isUnread = computed(() => props.item.read_at === null)

const bgClass = computed(() => NOTIFICATION_TYPE_BG[props.item.notification_type])
const iconClass = computed(() => NOTIFICATION_TYPE_ICON[props.item.notification_type])

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d === 1) return '1 天前'
  if (d < 7) return `${d} 天前`
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(
    new Date(iso)
  )
}

async function handleClick(): Promise<void> {
  if (isUnread.value) await store.markRead(props.item.id)
  if (props.item.action_path) void router.push(props.item.action_path)
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    @click="handleClick"
  >
    <!-- 图标 -->
    <span
      :class="bgClass"
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg"
      aria-hidden="true"
    >
      <span
        :class="iconClass"
        class="size-[18px]"
      />
    </span>

    <!-- 文本 -->
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[14px] font-medium leading-5 text-highlighted">
        {{ item.title }}
      </span>
      <span
        v-if="item.body"
        class="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-muted"
      >
        {{ item.body }}
      </span>
      <span class="mt-1 block text-[12px] leading-4 text-muted">
        {{ relativeTime(item.created_at) }}
      </span>
    </span>

    <!-- 未读蓝点 -->
    <span
      v-if="isUnread"
      class="mt-2 size-2 shrink-0 rounded-full bg-primary"
      aria-label="未读"
    />
    <span
      v-else
      class="mt-2 size-2 shrink-0"
      aria-hidden="true"
    />
  </button>
</template>
