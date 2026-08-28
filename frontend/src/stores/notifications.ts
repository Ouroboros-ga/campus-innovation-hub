import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  getUnreadCount,
  listNotifications,
  markAllRead as apiMarkAllRead,
  markRead as apiMarkRead
} from '@/features/notifications/api/notificationsApi'
import type { NotificationItem } from '@/features/notifications/types'
import { notificationFixtures } from '@/mocks/fixtures/notifications'

let pollTimer: ReturnType<typeof setInterval> | null = null

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const initialized = ref(false)

  const unreadItems = computed(() => items.value.filter(n => n.read_at === null))

  /** 是否使用 mock（无后端或未登录时）。通过环境变量或失败回退。 */
  const useMock = ref(false)

  async function fetchUnreadCount(): Promise<void> {
    try {
      const count = await getUnreadCount()
      unreadCount.value = count
      useMock.value = false
    } catch {
      // 未登录或后端不可达：用 mock 派生
      useMock.value = true
      unreadCount.value = notificationFixtures.filter(n => n.read_at === null).length
    }
  }

  async function fetchList(): Promise<void> {
    loading.value = true
    try {
      const result = await listNotifications({ page: 1, pageSize: 20 })
      items.value = result.items
      useMock.value = false
      unreadCount.value = result.items.filter(n => n.read_at === null).length
    } catch {
      useMock.value = true
      // 按 created_at 倒序（设计要求）。
      items.value = [...notificationFixtures].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      unreadCount.value = items.value.filter(n => n.read_at === null).length
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function markRead(id: string): Promise<void> {
    const target = items.value.find(n => n.id === id)
    if (!target || target.read_at !== null) return
    if (useMock.value) {
      target.read_at = new Date().toISOString()
      unreadCount.value = items.value.filter(n => n.read_at === null).length
      return
    }
    try {
      await apiMarkRead(id)
      target.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // 失败保持未读，下次重试
    }
  }

  async function markAllRead(): Promise<void> {
    if (unreadCount.value === 0) return
    if (useMock.value) {
      const now = new Date().toISOString()
      items.value.forEach(n => {
        if (n.read_at === null) n.read_at = now
      })
      unreadCount.value = 0
      return
    }
    try {
      await apiMarkAllRead()
      const now = new Date().toISOString()
      items.value.forEach(n => {
        if (n.read_at === null) n.read_at = now
      })
      unreadCount.value = 0
    } catch {
      // 保持现状
    }
  }

  function startPolling(intervalMs = 30_000): void {
    if (pollTimer) return
    void fetchUnreadCount()
    pollTimer = setInterval(() => {
      void fetchUnreadCount()
    }, intervalMs)
  }

  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function reset(): void {
    items.value = []
    unreadCount.value = 0
    loading.value = false
    initialized.value = false
    useMock.value = false
    stopPolling()
  }

  return {
    items,
    unreadCount,
    unreadItems,
    loading,
    initialized,
    useMock,
    fetchUnreadCount,
    fetchList,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    reset
  }
})
