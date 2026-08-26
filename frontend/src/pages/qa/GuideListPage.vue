<script setup lang="ts">
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import ConsultGuideSection from '@/features/consultation/components/ConsultGuideSection.vue'
import { consultGuides } from '@/mocks/fixtures/consultation'

/**
 * 指南列表（FE-051）— /qa/guides
 * 全部办事指南，点击卡片进入详情。
 */
const items = consultGuides
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
          指南
        </span>
      </nav>

      <p class="max-w-xl text-base text-muted">
        从报名参赛到材料申报的可操作指南，帮助你高效办事。
      </p>

      <div class="mt-8">
        <ConsultGuideSection :items="items" />
      </div>
    </PageContainer>
  </section>
</template>
