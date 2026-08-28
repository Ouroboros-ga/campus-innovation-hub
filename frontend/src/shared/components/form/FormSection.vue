<script setup lang="ts">
/**
 * 表单分组区块（FormSection）。
 *
 * 将长表单按语义拆分为可读的小节，降低认知负担（FrontendDesign.md §26
 * 「large forms are grouped by meaningful sections」）。仅提供标题 + 可选说明，
 * 不使用图标/装饰，保持结构清晰；字段由默认 slot 以单列或响应式栅格提供。
 */
withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  { description: '' }
)
</script>

<template>
  <div class="rounded-xl border border-default bg-default p-5 shadow-sm">
    <header class="mb-4 flex items-start gap-3">
      <span class="mt-0.5 grid size-7 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950">
        <UIcon name="i-lucide-sparkles" class="size-4" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-sm font-semibold text-highlighted">
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="mt-1 text-xs leading-relaxed text-muted"
        >
          {{ description }}
        </p>
      </div>
    </header>
    <div class="space-y-4">
      <slot />
    </div>
  </div>
</template>
