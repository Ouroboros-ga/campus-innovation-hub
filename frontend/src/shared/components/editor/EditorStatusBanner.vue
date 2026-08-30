<script setup lang="ts">
import { computed } from 'vue'

type BannerTone = 'neutral' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    statusLabel: string
    impact: string
    detail?: string
    tone?: BannerTone
  }>(),
  { detail: '', tone: 'neutral' }
)

const toneClass = computed(() => ({
  neutral: 'border-default bg-muted text-highlighted',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning'
})[props.tone])

const icon = computed(() => ({
  neutral: 'i-lucide-info',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert'
})[props.tone])
</script>

<template>
  <section
    class="flex flex-col gap-2 rounded-surface border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    :class="toneClass"
    aria-label="当前状态与保存影响"
  >
    <div class="flex min-w-0 items-start gap-3">
      <UIcon
        :name="icon"
        class="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="text-sm font-semibold">
          {{ statusLabel }} · {{ impact }}
        </p>
        <p
          v-if="detail"
          class="mt-0.5 text-xs opacity-80"
        >
          {{ detail }}
        </p>
      </div>
    </div>
    <slot />
  </section>
</template>
