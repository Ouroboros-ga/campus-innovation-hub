<script setup lang="ts">
/**
 * 组队详情区块（FE-031）。
 *
 * 设计来源：FrontendDesign.md §34.6 —— 详情页用「区块标题 + 细分隔线 + 内容」，
 * 减少卡片嵌套；只有真正表达分组时才用卡片。
 */
defineProps<{ title: string }>()
</script>

<template>
  <section class="border-t border-default pt-6">
    <h2 class="text-lg font-semibold text-highlighted">
      <slot name="title">
        {{ title }}
      </slot>
    </h2>
    <div class="mt-4">
      <slot />
    </div>
  </section>
</template>
