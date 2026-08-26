<script setup lang="ts">
/**
 * 详情区块卡片容器（按参考设计稿）。
 *
 * 结构：标题行（图标 + 标题 + 可选「查看全部」动作）+ 内容。
 * 仅用于有真实分组的区块，避免卡片套卡片（FrontendDesign.md §3.8 / §20）。
 */
withDefaults(
  defineProps<{
    icon: string
    title: string
    actionTo?: string
    actionLabel?: string
  }>(),
  { actionTo: '', actionLabel: '查看全部' }
)
</script>

<template>
  <section class="rounded-surface border border-default bg-default">
    <header class="flex items-center justify-between gap-3 border-b border-default px-4 py-3.5 sm:px-5">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="grid size-8 shrink-0 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <UIcon
            :name="icon"
            class="size-4"
            aria-hidden="true"
          />
        </span>
        <h2 class="truncate text-base font-semibold text-highlighted">
          {{ title }}
        </h2>
      </div>

      <slot name="action">
        <RouterLink
          v-if="actionTo"
          :to="actionTo"
          class="inline-flex min-h-8 shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-primary-600"
        >
          {{ actionLabel }}
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
        </RouterLink>
      </slot>
    </header>

    <div class="px-4 py-4 sm:px-5">
      <slot />
    </div>
  </section>
</template>
