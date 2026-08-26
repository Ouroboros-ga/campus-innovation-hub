<script setup lang="ts">
import { useRouter } from 'vue-router'

/**
 * 手机端 Back Header（FrontendDesign.md §16.3 Detail / Form Shell、§16.5）。
 * 详情 / 表单页在手机端隐藏全局 Bottom Navigation，改用返回头部。
 */
withDefaults(defineProps<{ title?: string }>(), { title: '' })

const router = useRouter()

function goBack() {
  const historyBack = (globalThis.history.state as { back?: string | null } | null)
    ?.back
  if (historyBack != null) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <header
    role="banner"
    class="sticky top-0 z-40 border-b border-default bg-default/95 backdrop-blur-sm"
    style="padding-top: env(safe-area-inset-top)"
  >
    <div class="flex h-[3.25rem] items-center justify-between gap-2 px-3">
      <UButton
        aria-label="返回"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        class="-ml-1 text-default"
        @click="goBack"
      />

      <p class="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-highlighted">
        {{ title }}
      </p>

      <div class="min-w-11 shrink-0">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
