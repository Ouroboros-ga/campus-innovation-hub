<template>
  <RouterLink
    to="/"
    class="group inline-flex min-h-11 shrink-0 items-center gap-3 rounded-control focus-visible:outline-offset-4"
    aria-label="返回首页"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-200 bg-primary text-white shadow-sm transition-colors group-hover:bg-primary-700 dark:border-primary-800"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-graduation-cap"
        class="size-5"
      />
    </span>
    <span class="min-w-0 sm:block">
      <span class="block truncate text-base font-bold leading-5 text-highlighted">
        科创与就业服务平台
      </span>
      <span class="mt-0.5 block text-xs leading-4 text-muted">
        人工智能学院
      </span>
    </span>
  </RouterLink>
</template>
