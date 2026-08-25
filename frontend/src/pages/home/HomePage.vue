<script setup lang="ts">
import AnnouncementList from '@/features/homepage/components/AnnouncementList.vue'
import DeadlineGrid from '@/features/homepage/components/DeadlineGrid.vue'
import GuideList from '@/features/homepage/components/GuideList.vue'
import HomeCarousel from '@/features/homepage/components/HomeCarousel.vue'
import HomeCompetitionSection from '@/features/homepage/components/HomeCompetitionSection.vue'
import HomeHero from '@/features/homepage/components/HomeHero.vue'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 首页（FE-006 / FE-007 / FE-008 / FE-009 / FE-010）。
 *
 * 桌面端组合（FrontendDesign.md §18.1）：
 * - Hero：主信息 + 快捷入口（左），校园轮播（右）；
 * - 主栏：即将截止 + 热门竞赛；
 * - 右侧栏：通知公告 + 热门指南。
 *
 * Phone / Tablet 采用单列堆叠，右侧栏在内容之后展开（§34）。
 */
</script>

<template>
  <HomeHero>
    <template #media>
      <HomeCarousel />
    </template>
  </HomeHero>

  <PageContainer>
    <div
      class="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12"
    >
      <div class="min-w-0 space-y-10 sm:space-y-12">
        <DeadlineGrid />
        <HomeCompetitionSection />
      </div>

      <aside class="min-w-0 space-y-8">
        <AnnouncementList />
        <GuideList />
      </aside>
    </div>
  </PageContainer>
</template>
