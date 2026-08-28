<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import NotificationPanel from '@/features/notifications/components/NotificationPanel.vue'
import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const store = useNotificationsStore()
const { isPhone } = useBreakpoint()

const open = ref(false)

onMounted(() => {
  void store.fetchUnreadCount()
  store.startPolling()
})

watch(open, value => {
  if (value && !store.initialized) void store.fetchList()
})

function goNotifications(): void {
  void router.push('/notifications')
}

function handleClose(): void {
  open.value = false
}
</script>

<template>
  <!-- 手机端：直接跳转，无 Popover -->
  <div
    v-if="isPhone"
    class="relative inline-flex"
  >
    <UButton
      aria-label="查看通知"
      icon="i-lucide-bell"
      color="neutral"
      variant="ghost"
      class="text-default"
      @click="goNotifications"
    />
    <span
      v-if="store.unreadCount > 0"
      class="pointer-events-none absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium leading-none text-white ring-2 ring-default"
      aria-hidden="true"
    >
      {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
    </span>
  </div>

  <!-- 桌面/平板：下拉面板 -->
  <div
    v-else
    class="relative inline-flex"
  >
    <UPopover
      v-model:open="open"
      :content="{ align: 'end', sideOffset: 8 }"
    >
      <UButton
        aria-label="查看通知"
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        class="text-default"
      />

      <template #content>
        <div class="overflow-hidden rounded-xl border border-default bg-default shadow-lg">
          <NotificationPanel
            compact
            @close="handleClose"
            @view-all="handleClose"
          />
        </div>
      </template>
    </UPopover>
    <span
      v-if="store.unreadCount > 0"
      class="pointer-events-none absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium leading-none text-white ring-2 ring-default"
      aria-hidden="true"
    >
      {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
    </span>
  </div>
</template>
