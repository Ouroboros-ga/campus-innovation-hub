<template>
  <RouterLink
    to="/"
    class="group inline-flex min-h-11 shrink-0 items-center gap-3 rounded-control focus-visible:outline-offset-4"
    aria-label="返回首页"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-200 bg-white shadow-sm transition-colors group-hover:border-primary-300 dark:border-primary-800"
      aria-hidden="true"
    >
      <img
        src="/logo-80.webp"
        srcset="/logo-40.webp 40w, /logo-80.webp 80w, /logo-256.webp 256w"
        sizes="40px"
        alt="绍兴理工学院人工智能学院 Logo"
        width="40"
        height="40"
        class="size-10 object-contain"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />
    </span>
    <span class="min-w-0 sm:block">
      <span class="block truncate text-base font-bold leading-5 text-highlighted">
        科创与就业服务平台
      </span>
      <span class="mt-0.5 block text-xs leading-4 text-muted">
        SIT 人工智能学院
      </span>
    </span>
  </RouterLink>
</template>
