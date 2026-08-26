<script setup lang="ts">
/**
 * 组织详情信息卡（FE-041 双端建设）。
 *
 * 用于「主要方向 / 指导老师 / 负责人 / 公开联系方式」四块信息；
 * 参考设计稿的卡片式分区，避免卡片套卡片（§45）。
 */
defineProps<{ title: string }>()
</script>

<template>
  <section class="rounded-card border border-default bg-default p-4">
    <h2 class="text-sm font-semibold text-highlighted">
      {{ title }}
    </h2>
    <div class="mt-3 text-sm text-toned">
      <slot />
    </div>
  </section>
</template>
