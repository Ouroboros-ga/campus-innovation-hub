<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  faqCategoryIcon,
  faqCategoryLabel
} from '@/shared/lib/domain-labels'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

import ConsultFaqSection from '@/features/consultation/components/ConsultFaqSection.vue'
import { consultFaqs } from '@/mocks/fixtures/consultation'
import type { FaqCategory } from '@/shared/types/homepage'

/**
 * 常见问题完整列表（FE-051 / FE-060）— /qa/faqs
 * 提供分类筛选；「全部」时按分类分组展示，选中某个分类时展示该分类下的问题。
 * 问题以手风琴形式展开答案。
 */
const items = consultFaqs

/** 分类筛选（ALL 表示全部）。 */
const activeCategory = ref<FaqCategory | 'ALL'>('ALL')

/** 出现的分类（保持首次出现顺序）。 */
const categories = computed<FaqCategory[]>(() => {
  const seen: FaqCategory[] = []
  for (const item of items) {
    if (!seen.includes(item.category)) seen.push(item.category)
  }
  return seen
})

const visibleItems = computed(() =>
  activeCategory.value === 'ALL'
    ? items
    : items.filter(item => item.category === activeCategory.value)
)

function setCategory(category: FaqCategory | 'ALL') {
  activeCategory.value = category
}
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-3xl">
      <!-- 桌面/平板面包屑：手机端由居中返回头承担返回（§16.5） -->
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
          常见问题
        </span>
      </nav>

      <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
        常见问题
      </h1>
      <p class="mt-2 text-base text-muted">
        集中解答平台使用与竞赛参与中的常见疑问。
      </p>

      <!-- 分类筛选 -->
      <div
        role="group"
        aria-label="常见问题分类筛选"
        class="mt-6 flex flex-wrap gap-2"
      >
        <UButton
          size="sm"
          color="neutral"
          :variant="activeCategory === 'ALL' ? 'solid' : 'outline'"
          :aria-pressed="activeCategory === 'ALL'"
          @click="setCategory('ALL')"
        >
          全部
        </UButton>
        <UButton
          v-for="category in categories"
          :key="category"
          size="sm"
          color="neutral"
          :variant="activeCategory === category ? 'solid' : 'outline'"
          :icon="faqCategoryIcon[category]"
          :aria-pressed="activeCategory === category"
          @click="setCategory(category)"
        >
          {{ faqCategoryLabel[category] }}
        </UButton>
      </div>

      <div class="mt-8">
        <ConsultFaqSection
          :items="visibleItems"
          :grouped="activeCategory === 'ALL'"
        />
      </div>
    </PageContainer>
  </section>
</template>
