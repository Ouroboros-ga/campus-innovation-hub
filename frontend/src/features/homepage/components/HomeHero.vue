<script setup lang="ts">
import { computed, useSlots } from 'vue'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import HeroRecommendation from './HeroRecommendation.vue'
import QuickEntry from './QuickEntry.vue'

/**
 * 首页 Hero（FE-006）。
 *
 * 设计来源：docs/frontend/FrontendDesign.md
 * - §18：Hero 由主信息 + 快捷入口 + 校园轮播组成；
 * - §11.1：Hero H1 32–36px；§11.2 标题权重 700–760；
 * - §11.4：中文正文 line-height 不低于 1.6；
 * - §2：可信、年轻、高效、克制（无渐变 hero、无虚假 KPI）；
 * - §3.5：不使用紫色渐变 hero。
 *
 * 轮播（FE-007）通过 `media` 插槽注入。有媒体时 Hero 右侧为媒体列，
 * 无媒体（FE-006 过渡态）时内容退化为单列并限制可读宽度。
 */
const slots = useSlots()
const hasMedia = computed(() => Boolean(slots.media))
</script>

<template>
  <section class="border-b border-default bg-default">
    <PageContainer>
      <div
        class="grid items-center gap-8 py-10 sm:py-14"
        :class="
          hasMedia
            ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12'
            : 'grid-cols-1'
        "
      >
        <div :class="hasMedia ? 'min-w-0' : 'max-w-3xl min-w-0'">
          <h1
            class="text-[26px] font-bold leading-tight text-highlighted sm:text-[32px] lg:text-[36px]"
          >
            发现科创机会，成就无限可能
          </h1>
          <p class="mt-4 text-base text-muted">
            连接竞赛、伙伴、组织与活动，助力你的成长与探索
          </p>
          <QuickEntry class="mt-8" />
          <HeroRecommendation class="mt-8 hidden md:block" />
        </div>
        <div class="min-w-0">
          <slot name="media" />
        </div>
      </div>
    </PageContainer>
  </section>
</template>
