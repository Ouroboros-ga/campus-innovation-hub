<script setup lang="ts">
import { consultationCategoryLabel, consultationStatusLabel, consultationVisibilityLabel, type ConsultationSummary } from './types'
import { formatDateTimeCompact } from '@/shared/lib/date'

defineProps<{ items: ConsultationSummary[]; selectedId?: string; loading?: boolean; error?: string | null }>()
const emit = defineEmits<{ select: [id: string]; retry: [] }>()
</script>

<template>
  <div class="min-h-0 rounded-surface border border-default bg-default">
    <p v-if="loading" class="p-5 text-sm text-muted">正在加载咨询队列…</p>
    <div v-else-if="error" class="p-5" role="alert"><p class="text-sm text-error">{{ error }}</p><UButton class="mt-3" color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" @click="emit('retry')">重新加载</UButton></div>
    <p v-else-if="!items.length" class="p-5 text-sm text-muted">暂无符合条件的咨询。</p>
    <ul v-else class="divide-y divide-default">
      <li v-for="item in items" :key="item.id">
        <button type="button" class="w-full px-4 py-4 text-left outline-none transition-colors hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary" :class="selectedId === item.id ? 'bg-elevated' : ''" @click="emit('select', item.id)">
          <div class="flex items-start justify-between gap-3"><p class="line-clamp-2 text-sm font-semibold text-highlighted">{{ item.title }}</p><span class="shrink-0 text-xs text-muted">{{ consultationStatusLabel[item.status] }}</span></div>
          <p class="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted"><span>{{ consultationCategoryLabel[item.category] }}</span><span>{{ consultationVisibilityLabel[item.visibility] }}</span><span>{{ item.authorName }}</span></p>
          <p class="mt-2 text-xs text-muted">{{ item.replyCount }} 条正式回复 · {{ formatDateTimeCompact(item.createdAt) }}</p>
        </button>
      </li>
    </ul>
  </div>
</template>
