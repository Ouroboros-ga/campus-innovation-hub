<script setup lang="ts">
import { useRouter } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

const router = useRouter()

function goHome() {
  void router.push({ name: 'home' })
}
function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'home' })
}
</script>

<template>
  <section class="py-16 sm:py-20">
    <PageContainer class="max-w-lg text-center">
      <div class="mx-auto flex max-w-md flex-col items-center gap-4">
        <div class="grid size-16 place-items-center rounded-full bg-muted">
          <UIcon
            name="i-lucide-file-question"
            class="size-8 text-muted"
            aria-hidden="true"
          />
        </div>
        <h1 class="text-2xl font-bold text-highlighted">
          页面未找到
        </h1>
        <p class="text-sm leading-6 text-muted">
          你访问的页面不存在或已移动。请检查地址是否正确，或返回首页继续浏览。
        </p>
        <p class="font-mono text-xs text-muted">
          404 · NOT_FOUND
        </p>
        <div class="mt-4 flex gap-3">
          <UButton
            color="primary"
            icon="i-lucide-house"
            @click="goHome"
          >
            返回首页
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
            @click="goBack"
          >
            返回上一页
          </UButton>
        </div>
      </div>
    </PageContainer>
  </section>
</template>
