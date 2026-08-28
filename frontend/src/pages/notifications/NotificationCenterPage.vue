<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import NotificationItem from '@/features/notifications/components/NotificationItem.vue'
import NotificationTabs from '@/features/notifications/components/NotificationTabs.vue'
import type { NotificationItem as NotificationItemType, NotificationTabKey } from '@/features/notifications/types'
import { MENTION_TYPES } from '@/features/notifications/types'
import { listNotifications } from '@/features/notifications/api/notificationsApi'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const route = useRoute()
const router = useRouter()
const active = ref<NotificationTabKey>((route.query.tab as NotificationTabKey) ?? 'all')
const page = ref(Number(route.query.page ?? 1) || 1)
const pageSize = 20
const total = ref(0)
const items = ref<NotificationItemType[]>([])
const loading = ref(false)

function syncFromRoute() {
  const tab = route.query.tab as string | undefined
  if (tab && ['all','unread','mention','system'].includes(tab)) active.value = tab as NotificationTabKey
  page.value = Number(route.query.page ?? 1) || 1
}
function pushRoute(overrides: Record<string,string|undefined> = {}) {
  const next: Record<string,string> = {}
  const tab = overrides.tab !== undefined ? overrides.tab : active.value
  if (tab && tab !== 'all') next.tab = tab
  const p = overrides.page !== undefined ? overrides.page : String(page.value)
  if (Number(p) > 1) next.page = p
  router.replace({ query: next })
}

async function fetchPaged() {
  loading.value = true
  try {
    // 运营分页契约：GET /api/notifications?page & query 承载
    const params: Record<string, unknown> = { page: page.value, pageSize }
    if (active.value === 'unread') params.unread = true
    else if (active.value === 'system') params.type = 'SYSTEM'
    // mention 与 all 由后端 type 过滤或前端二次过滤保持兼容
    const res = await listNotifications(params as never)
    let result = res.items
    if (active.value === 'mention') result = result.filter(n => MENTION_TYPES.includes(n.notification_type))
    items.value = result
    total.value = res.total
    // 同步 store 供铃铛
    store.items = result
  } catch {
    items.value = []
    total.value = 0
  } finally { loading.value = false }
}

onMounted(() => {
  syncFromRoute()
  void fetchPaged()
  if (!store.initialized) void store.fetchList()
})

watch(() => route.query, () => { syncFromRoute(); void fetchPaged() })
watch(active, () => { page.value = 1; pushRoute({ tab: active.value, page: undefined }); void fetchPaged() })

const counts = computed<Record<NotificationTabKey, number>>(() => {
  const all = total.value || store.items.length
  const unread = store.items.filter(n => n.read_at === null).length
  const mention = store.items.filter(n => MENTION_TYPES.includes(n.notification_type)).length
  const system = store.items.filter(n => n.notification_type === 'SYSTEM').length
  return { all, unread, mention, system }
})

const filtered = computed(() => {
  // 已按分页参数在 fetchPaged 过滤，此处仅对 mention 兜底
  return items.value
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
      <div class="mt-2 bg-default md:mt-4 md:rounded-card md:border md:border-default md:shadow-sm">
        <div class="px-2 md:px-4">
          <NotificationTabs
            v-model:active="active"
            :counts="counts"
          />
        </div>

        <!-- 列表 -->
        <div class="px-2 py-2">
          <div
            v-if="loading"
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
            <div class="mt-4 flex justify-center gap-2">
              <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="() => fetchPaged()">重新加载</UButton>
            </div>
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
          <div
            v-if="!loading && total > pageSize"
            class="flex justify-center py-4"
          >
            <UPagination :page="page" :total="total" :items-per-page="pageSize" @update:page="p => { page = p; pushRoute({ page: String(p) }); void fetchPaged() }" />
          </div>
          <p
            v-else-if="!loading && filtered.length > 0"
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
