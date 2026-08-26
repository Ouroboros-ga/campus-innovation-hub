<script setup lang="ts">
import { useRoute } from 'vue-router'

import {
  isNavigationItemActive,
  phoneTabItems
} from '@/shared/components/app/navigation'

const route = useRoute()
</script>

<template>
  <nav
    aria-label="底部主导航"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <ul class="mx-auto flex min-h-14 max-w-2xl items-stretch">
      <li
        v-for="item in phoneTabItems"
        :key="item.to"
        class="min-w-0 flex-1"
      >
        <RouterLink
          :to="item.to"
          class="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-toned transition-colors"
          :class="{
            'text-primary': isNavigationItemActive(route.path, item.to)
          }"
          :aria-current="
            isNavigationItemActive(route.path, item.to) ? 'page' : undefined
          "
        >
          <UIcon
            :name="item.icon"
            class="size-6"
            aria-hidden="true"
          />
          <span class="leading-none">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
