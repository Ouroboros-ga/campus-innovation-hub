<script setup lang="ts">
export interface SettingsRowItem {
  to: string
  label: string
  description: string
  icon: string
}

defineProps<{ items: readonly SettingsRowItem[] }>()
</script>

<template>
  <section class="rounded-card border border-default bg-default p-4 sm:p-5">
    <h2 class="inline-flex items-center gap-1.5 text-sm font-semibold text-highlighted">
      <UIcon
        name="i-lucide-settings"
        class="size-4 text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      账户设置
    </h2>
    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <RouterLink
        v-for="item in items"
        :key="item.label"
        :to="item.to"
        class="group flex items-center justify-between gap-3 rounded-surface border border-default bg-default px-3 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40 dark:hover:border-primary-800 dark:hover:bg-primary-950/30"
      >
        <span class="flex min-w-0 items-center gap-2.5">
          <UIcon
            :name="item.icon"
            class="size-4 shrink-0 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          <span class="min-w-0">
            <span class="block text-sm font-medium text-highlighted group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ item.label }}</span>
            <span class="mt-0.5 block text-xs text-muted">{{ item.description }}</span>
          </span>
        </span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5 shrink-0 text-muted"
          aria-hidden="true"
        />
      </RouterLink>
    </div>
  </section>
</template>
