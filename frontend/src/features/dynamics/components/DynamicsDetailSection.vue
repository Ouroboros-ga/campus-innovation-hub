<script setup lang="ts">
/**
 * 校园动态详情区块（FE-051 / FE-052）。
 *
 * 设计来源：FrontendDesign.md §34.6（页面标识 → 分隔线 → 区块内容，
 * 用分隔线与排版营造层级，避免卡片嵌套）、§43。
 */
defineProps<{ title: string }>()
</script>

<template>
  <section class="border-t border-default pt-6">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
      {{ title }}
    </h2>
    <div class="mt-3">
      <slot />
    </div>
  </section>
</template>
