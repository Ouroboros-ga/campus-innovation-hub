<script setup lang="ts">
/**
 * 首页区块头（FE-008 / FE-009 / FE-010 共用）。
 *
 * 设计来源：
 * - FrontendDesign.md §18：各区块有标题 + 「查看全部」；
 * - FrontendDesign.md §43：文案陈述事实，用「查看全部」而非营销词。
 */
defineProps<{
  title: string
  /** 可选的「查看全部」目标路由。 */
  to?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <h2 class="text-lg font-semibold text-highlighted">
      {{ title }}
    </h2>
    <RouterLink
      v-if="to"
      :to="to"
      class="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-primary-600"
    >
      查看全部
      <UIcon
        name="i-lucide-chevron-right"
        class="size-4"
        aria-hidden="true"
      />
    </RouterLink>
  </div>
</template>
