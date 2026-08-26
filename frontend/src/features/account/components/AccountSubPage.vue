<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import AccountNav from './AccountNav.vue'

/**
 * 账号子页布局（FE-070）：桌面左侧账号导航 + 右侧内容；
 * 手机端由后台头（详情壳）承担返回，不展示底部导航（PublicLayout 处理）。
 */
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-4xl">
      <div class="grid gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
        <AccountNav class="hidden md:block" />
        <div class="min-w-0">
          <slot />
        </div>
      </div>
    </PageContainer>
  </section>
</template>
