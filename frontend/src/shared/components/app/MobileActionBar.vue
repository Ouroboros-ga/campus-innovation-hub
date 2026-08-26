<template>
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t border-default bg-default md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-2xl items-center justify-center gap-3 px-4 py-2.5">
      <slot />
    </div>
  </div>
</template>
