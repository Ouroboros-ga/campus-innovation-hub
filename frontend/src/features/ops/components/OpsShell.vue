<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import NotificationButton from '@/shared/components/app/NotificationButton.vue'
import UserMenu from '@/shared/components/app/UserMenu.vue'
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
    <!-- 桌面侧栏：固定在视口左侧，随详细界面滚动保持可见 -->
    <aside class="hidden w-[260px] shrink-0 flex-col border-r border-default bg-default lg:flex lg:sticky lg:top-0 lg:h-[calc(100dvh-4rem)] lg:self-start">
      <div class="flex-1 overflow-y-auto px-2 py-3">
        <OpsNav />
      </div>
    </aside>

    <!-- 主区 -->
    <div class="min-w-0 flex-1">
      <!-- 顶栏：固定在视口顶部，随详细界面滚动保持可见 -->
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
          <NotificationButton />
          <UserMenu />
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
            <span class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-200 bg-white">
              <svg
                viewBox="0 0 100 100"
                class="size-7"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="white"
                  stroke="#0F6FE8"
                  stroke-width="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="39"
                  fill="none"
                  stroke="#0F6FE8"
                  stroke-width="1.4"
                />
                <text
                  x="50"
                  y="78"
                  font-family="'PingFang SC','Microsoft YaHei',sans-serif"
                  font-size="6"
                  fill="#0B3EA8"
                  font-weight="700"
                  text-anchor="middle"
                >
                  人工智能学院
                </text>
                <g transform="translate(50 50)">
                  <path
                    d="M -18 14 L -2 -20 L 20 10 L 4 13 Z"
                    fill="#0B3EA8"
                  />
                  <path
                    d="M -21 14 Q 0 7 26 11 L 20 18 Q 0 20 -16 16 Z"
                    fill="#0B3EA8"
                  />
                  <path
                    d="M -30 20 Q -12 12 10 20 Q 26 24 36 20 Q 22 26 0 24 Q -15 23 -30 20 Z"
                    fill="#0B3EA8"
                  />
                </g>
              </svg>
            </span>
            <div>
              <p class="text-sm font-semibold text-highlighted">
                运营管理中心
              </p>
              <p class="text-xs text-muted">
                SIT 人工智能学院
              </p>
            </div>
          </div>
          <div
            class="flex-1 overflow-y-auto px-2 py-3"
            @click="drawerOpen = false"
          >
            <OpsNav />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
