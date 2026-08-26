<script setup lang="ts">
import { useRoute } from 'vue-router'

import {
  isNavigationItemActive,
  publicNavigationItems
} from '@/shared/components/app/navigation'

const route = useRoute()
</script>

<template>
  <nav
    class="hidden h-full items-stretch lg:flex"
    aria-label="主导航"
  >
    <RouterLink
      v-for="item in publicNavigationItems"
      :key="item.to"
      :to="item.to"
      class="relative flex h-full items-center px-3 text-[15px] font-medium text-toned transition-colors hover:text-highlighted"
      :class="{
        'text-primary': isNavigationItemActive(route.path, item.to)
      }"
      :aria-current="
        isNavigationItemActive(route.path, item.to) ? 'page' : undefined
      "
    >
      {{ item.label }}
      <span
        v-if="isNavigationItemActive(route.path, item.to)"
        class="absolute inset-x-3 bottom-0 h-0.5 bg-primary"
        aria-hidden="true"
      />
    </RouterLink>
  </nav>
</template>
