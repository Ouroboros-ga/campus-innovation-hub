<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    icon: string
    to?: string
    actionLabel?: string
  }>(),
  { to: undefined, actionLabel: '查看全部' }
)
</script>

<template>
  <section class="flex flex-col overflow-hidden rounded-card border border-default bg-default">
    <header class="flex items-center justify-between gap-2 border-b border-default px-4 py-3">
      <h2 class="inline-flex items-center gap-1.5 text-sm font-semibold text-highlighted">
        <UIcon
          :name="icon"
          class="size-4 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        {{ title }}
      </h2>
      <RouterLink
        v-if="to"
        :to="to"
        class="inline-flex items-center gap-0.5 text-xs text-muted hover:text-primary-600 dark:hover:text-primary-400"
      >
        {{ actionLabel }}
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
      </RouterLink>
    </header>
    <div class="flex-1 p-3 sm:p-4">
      <slot />
    </div>
    <!-- 底部“查看全部/更多”插槽用于个别卡片的二次入口 -->
    <div
      v-if="$slots.footer"
      class="border-t border-default px-4 py-2.5 text-center"
    >
      <slot name="footer" />
    </div>
  </section>
</template>
