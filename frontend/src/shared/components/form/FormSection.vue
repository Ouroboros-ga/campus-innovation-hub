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
  <div class="space-y-4">
    <header class="space-y-1">
      <h2 class="text-base font-semibold text-highlighted">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-sm text-muted"
      >
        {{ description }}
      </p>
    </header>
    <div class="space-y-4">
      <slot />
    </div>
  </div>
</template>
