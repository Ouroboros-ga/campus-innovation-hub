<script setup lang="ts">
import { useGlobalSearchStore } from '@/stores/globalSearch'

/** 全局搜索触发按钮（FE-012）。点击打开 Command Palette。 */
const store = useGlobalSearchStore()
</script>

<template>
  <UButton
    aria-label="搜索"
    icon="i-lucide-search"
    label="搜索"
    color="neutral"
    variant="ghost"
    class="px-2.5 text-default"
    :ui="{ label: 'hidden 2xl:inline' }"
    @click="store.openSearch()"
  />
</template>
