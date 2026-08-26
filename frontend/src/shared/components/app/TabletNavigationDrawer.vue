<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import {
  isNavigationItemActive,
  publicNavigationItems
} from '@/shared/components/app/navigation'

const route = useRoute()
const isOpen = ref(false)
</script>

<template>
  <div>
    <UButton
      aria-label="打开主菜单"
      icon="i-lucide-menu"
      color="neutral"
      variant="ghost"
      class="text-default"
      @click="isOpen = true"
    />

    <UDrawer
      v-model:open="isOpen"
      title="主导航"
      description="前往平台的主要公开页面。"
      direction="right"
      close
      :ui="{ content: 'w-[min(22rem,calc(100vw-1rem))]' }"
    >
      <template #body>
        <nav
          class="space-y-1"
          aria-label="平板主导航"
        >
          <RouterLink
            v-for="item in publicNavigationItems"
            :key="item.to"
            :to="item.to"
            class="flex min-h-11 items-center justify-between rounded-control px-3 text-sm font-medium text-toned transition-colors hover:bg-muted hover:text-highlighted"
            :class="{
              'bg-primary-50 text-primary dark:bg-primary-950/40':
                isNavigationItemActive(route.path, item.to)
            }"
            :aria-current="
              isNavigationItemActive(route.path, item.to) ? 'page' : undefined
            "
            @click="isOpen = false"
          >
            <span>{{ item.label }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-4 text-muted"
              aria-hidden="true"
            />
          </RouterLink>
        </nav>

        <div class="mt-6 border-t border-default pt-5">
          <div class="flex min-h-11 items-center justify-between gap-3 px-3">
            <span class="text-sm font-medium text-toned">外观</span>
            <UColorModeButton aria-label="切换外观" />
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
