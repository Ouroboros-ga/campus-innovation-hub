<script setup lang="ts">
import type { NotificationTabKey } from '@/features/notifications/types'
import { NOTIFICATION_TAB_LABEL } from '@/features/notifications/types'

defineProps<{
  active: NotificationTabKey
  counts: Record<NotificationTabKey, number>
}>()

defineEmits<{
  'update:active': [value: NotificationTabKey]
}>()

const tabs: NotificationTabKey[] = ['all', 'unread', 'mention', 'system']
</script>

<template>
  <div
    role="tablist"
    class="flex items-center gap-1 border-b border-default text-sm"
  >
    <button
      v-for="key in tabs"
      :key="key"
      role="tab"
      :aria-selected="active === key"
      :class="[
        'relative -mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors',
        active === key
          ? 'border-primary font-medium text-highlighted'
          : 'border-transparent text-muted hover:text-highlighted'
      ]"
      @click="$emit('update:active', key)"
    >
      {{ NOTIFICATION_TAB_LABEL[key] }}
      <span
        v-if="counts[key] > 0"
        :class="[
          'ml-1 text-xs',
          active === key ? 'text-primary' : 'text-muted'
        ]"
      >
        ({{ counts[key] }})
      </span>
    </button>
  </div>
</template>
