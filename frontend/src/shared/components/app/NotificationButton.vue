<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

function handleClick(): void {
  if (isPhone.value) {
    void router.push('/notifications')
    return
  }
  open.value = !open.value
  if (open.value && !store.initialized) void store.fetchList()
}

function handleClose(): void {
  open.value = false
}
</script>

<template>
  <!-- 手机端：直接跳转 -->
  <UButton
    v-if="isPhone"
    aria-label="查看通知"
    icon="i-lucide-bell"
    color="neutral"
    variant="ghost"
    class="relative text-default"
    @click="handleClick"
  >
    <span
      v-if="store.unreadCount > 0"
      class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium leading-none text-white ring-2 ring-default"
      aria-hidden="true"
    >
      {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
    </span>
  </UButton>

  <!-- 桌面/平板：下拉面板 -->
  <UPopover
    v-else
    v-model:open="open"
    :content="{ align: 'end', sideOffset: 8 }"
  >
    <UButton
      aria-label="查看通知"
      icon="i-lucide-bell"
      color="neutral"
      variant="ghost"
      class="relative text-default"
      @click="handleClick"
    >
      <span
        v-if="store.unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium leading-none text-white ring-2 ring-default"
        aria-hidden="true"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </UButton>

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
</template>
