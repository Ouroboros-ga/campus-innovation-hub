<script setup lang="ts">
export interface AccountMenuItem {
  to: string
  label: string
  description: string
  icon: string
}

defineProps<{ items: readonly AccountMenuItem[] }>()
</script>

<template>
  <section class="overflow-hidden rounded-card border border-default bg-default">
    <ul class="divide-y divide-default">
      <li
        v-for="item in items"
        :key="item.to"
      >
        <RouterLink
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
        >
          <span
            class="grid size-8 shrink-0 place-items-center text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          >
            <UIcon :name="item.icon" class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-highlighted">{{ item.label }}</span>
            <span class="mt-0.5 block text-xs text-muted">{{ item.description }}</span>
          </span>
          <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
