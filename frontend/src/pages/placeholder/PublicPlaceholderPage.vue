<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

defineProps<{
  title: string
}>()
</script>

<template>
  <section class="py-12 sm:py-16">
    <PageContainer>
      <div class="max-w-xl space-y-3">
        <h1 class="text-3xl font-bold leading-tight text-highlighted">
          {{ title }}
        </h1>
        <p class="text-base text-muted">
          页面内容将在后续任务中逐步完善。
        </p>
      </div>
    </PageContainer>
  </section>
</template>
