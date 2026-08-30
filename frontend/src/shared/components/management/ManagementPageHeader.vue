<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string }>(), { description: '' })
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="text-lg font-semibold text-highlighted">{{ title }}</h2><p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p></div><div class="flex flex-wrap gap-2"><slot name="actions" /></div></header>
</template>
