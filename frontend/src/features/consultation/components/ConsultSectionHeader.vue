<script setup lang="ts">
/**
 * 咨询与指南区块标题头（FE-050）。
 * 图标 + 标题（左）+ 可选「查看全部」链接（右）。
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
  <header class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2">
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
  </header>
</template>
