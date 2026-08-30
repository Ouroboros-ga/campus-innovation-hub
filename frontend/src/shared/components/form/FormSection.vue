<script setup lang="ts">
import { useId } from 'vue'

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

const titleId = `${useId()}-title`
</script>

<template>
  <section
    :aria-labelledby="titleId"
    class="py-6 first:pt-0 last:pb-0"
  >
    <header class="border-b border-default pb-4">
      <div class="min-w-0">
        <h2
          :id="titleId"
          class="text-base font-semibold text-highlighted"
        >
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
    <div class="mt-5 space-y-4">
      <slot />
    </div>
  </section>
</template>
