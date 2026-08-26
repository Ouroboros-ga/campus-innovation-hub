<script setup lang="ts">
/**
 * 报名方式与提示（按参考设计稿：check 清单 + 查看完整报名指南）。
 */
withDefaults(
  defineProps<{
    tips: string[]
    guidePath?: string | null
  }>(),
  { guidePath: null }
)
</script>

<template>
  <div>
    <ul class="space-y-3">
      <li
        v-for="(tip, index) in tips"
        :key="index"
        class="flex items-start gap-2.5"
      >
        <UIcon
          name="i-lucide-circle-check"
          class="mt-0.5 size-4 shrink-0 text-success-600 dark:text-success-400"
          aria-hidden="true"
        />
        <span class="text-sm leading-6 text-toned">
          {{ tip }}
        </span>
      </li>
    </ul>

    <RouterLink
      v-if="guidePath"
      :to="guidePath"
      class="mt-4 inline-flex min-h-9 items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
    >
      查看完整报名指南
      <UIcon
        name="i-lucide-chevron-right"
        class="size-4"
        aria-hidden="true"
      />
    </RouterLink>
  </div>
</template>
