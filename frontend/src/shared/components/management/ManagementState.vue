<script setup lang="ts">
withDefaults(defineProps<{ loading?: boolean; error?: string | null; empty?: boolean; emptyText?: string }>(), { loading: false, error: null, empty: false, emptyText: '暂无记录。' })
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <p v-if="loading" class="py-8 text-center text-sm text-muted">正在加载…</p>
  <div v-else-if="error" class="rounded-surface border border-error/30 bg-error/10 p-4" role="alert"><p class="text-sm text-error">{{ error }}</p><UButton class="mt-3" size="sm" color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="emit('retry')">重新加载</UButton></div>
  <p v-else-if="empty" class="py-8 text-center text-sm text-muted">{{ emptyText }}</p>
  <slot v-else />
</template>
