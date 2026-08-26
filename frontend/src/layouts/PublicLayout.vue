<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import GlobalSearch from '@/features/search/components/GlobalSearch.vue'
import AppFooter from '@/shared/components/app/AppFooter.vue'
import AppHeader from '@/shared/components/app/AppHeader.vue'
import MobileBottomNav from '@/shared/components/app/MobileBottomNav.vue'

const route = useRoute()

/** 手机端根级 Tab Shell：仅这些路由在手机端展示底部主导航。 */
const isTabShell = computed(() => {
  const shell = route.meta.mobileShell
  return shell === 'tab' || shell === undefined
})
</script>

<template>
  <div
    class="flex min-h-dvh flex-col"
    :class="{
      'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0': isTabShell
    }"
  >
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
    <MobileBottomNav v-if="isTabShell" />
    <GlobalSearch />
  </div>
</template>
