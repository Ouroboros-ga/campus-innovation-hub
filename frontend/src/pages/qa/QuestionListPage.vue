<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import ConsultQaSection from '@/features/consultation/components/ConsultQaSection.vue'
import { consultQaPosts } from '@/mocks/fixtures/consultation'

/**
 * 公开问答列表（FE-051）— /qa/questions
 * 全部公开问答，点击条目进入详情。
 */
const items = consultQaPosts
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-3xl">
      <!-- 桌面/平板面包屑：手机端由居中返回头承担返回 -->
      <nav
        class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
        aria-label="面包屑"
      >
        <RouterLink
          to="/qa"
          class="transition-colors hover:text-primary-600"
        >
          咨询指南
        </RouterLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
        <span class="text-highlighted">
          问答
        </span>
      </nav>

      <p class="max-w-xl text-base text-muted">
        社区公开提问与回答，观点仅代表回答者个人。
      </p>

      <div class="mt-8">
        <ConsultQaSection :items="items" />
      </div>
    </PageContainer>
  </section>
</template>
