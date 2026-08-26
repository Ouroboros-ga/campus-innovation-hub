<script setup lang="ts">
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import OpsNav from './OpsNav.vue'

/**
 * 平台运营外壳（FE-090）— /ops
 *
 * 工具化模式：compact navigation + 内容区；Phone 使用摘要行 + 任务页，
 * 不展示横向巨型表格；`mobileShell: 'manage'` 隐藏全局 Bottom Navigation。
 */
const route = useRoute()
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-5xl">
      <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
        {{ route.meta.title ?? '平台运营' }}
      </h1>
      <OpsNav class="mt-6" />
      <div class="mt-6">
        <RouterView />
      </div>
    </PageContainer>
  </section>
</template>
