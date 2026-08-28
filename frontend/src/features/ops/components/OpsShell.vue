<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import OpsNav from './OpsNav.vue'

/**
 * 运营工作空间外壳 — /ops
 * 左 260px 导航 + 右内容区，移动端抽屉。
 * 对应 Fig1/图3 四页的 workspace 底座，已去公告管理。
 */
const route = useRoute()
const drawerOpen = ref(false)
</script>

<template>
  <div class="flex min-h-[calc(100dvh-4rem)] bg-canvas">
    <!-- 桌面侧栏 -->
    <aside class="hidden w-[260px] shrink-0 flex-col border-r border-default bg-default lg:flex">
      <div class="flex h-14 items-center gap-3 border-b border-default px-4">
        <span class="grid size-8 place-items-center rounded-lg bg-primary-600 text-white">
          <UIcon name="i-lucide-graduation-cap" class="size-5" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold leading-none text-highlighted">科创与就业服务平台</p>
          <p class="text-xs text-muted">运营管理中心</p>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto px-2 py-3">
        <OpsNav />
      </div>
      <div class="border-t border-default p-3">
        <div class="flex items-center gap-2 rounded-lg bg-muted px-2 py-2">
          <UAvatar size="sm" alt="张同学" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">张同学</p>
            <p class="text-xs text-muted">平台运营</p>
          </div>
          <UIcon name="i-lucide-chevron-down" class="size-4 text-muted" />
        </div>
      </div>
    </aside>

    <!-- 主区 -->
    <div class="min-w-0 flex-1">
      <!-- 顶栏 -->
      <header class="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-default bg-default px-4">
        <div class="flex items-center gap-2">
          <UButton
            class="lg:hidden"
            color="neutral"
            variant="ghost"
            icon="i-lucide-menu"
            aria-label="打开菜单"
            @click="drawerOpen = true"
          />
          <h1 class="text-sm font-semibold text-highlighted lg:text-base">
            {{ route.meta.title ?? '运营工作台' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <UInput
            placeholder="搜索内容、竞赛、活动、用户..."
            icon="i-lucide-search"
            size="sm"
            class="hidden w-64 sm:block"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-bell"
            aria-label="通知"
          />
          <UAvatar size="sm" alt="张同学" />
        </div>
      </header>

      <main class="p-4 sm:p-6">
        <RouterView />
      </main>
    </div>

    <!-- 移动抽屉 -->
    <UDrawer
      v-model:open="drawerOpen"
      direction="left"
      :ui="{ content: 'w-[280px] bg-default' }"
    >
      <template #content>
        <div class="flex h-full flex-col">
          <div class="flex h-14 items-center gap-3 border-b border-default px-4">
            <span class="grid size-8 place-items-center rounded-lg bg-primary-600 text-white">
              <UIcon name="i-lucide-graduation-cap" class="size-5" />
            </span>
            <div>
              <p class="text-sm font-semibold text-highlighted">运营管理中心</p>
              <p class="text-xs text-muted">科创与就业服务平台</p>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-2 py-3" @click="drawerOpen = false">
            <OpsNav />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
