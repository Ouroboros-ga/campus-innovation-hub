<script setup lang="ts">
import GlobalSearch from '@/features/search/components/GlobalSearch.vue'
import AppFooter from '@/shared/components/app/AppFooter.vue'
import AppHeader from '@/shared/components/app/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
    <GlobalSearch />
  </div>
</template>
