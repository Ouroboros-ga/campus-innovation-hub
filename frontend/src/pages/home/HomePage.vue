<script setup lang="ts">
import ActivityList from '@/features/homepage/components/ActivityList.vue'
import AnnouncementList from '@/features/homepage/components/AnnouncementList.vue'
import DeadlineGrid from '@/features/homepage/components/DeadlineGrid.vue'
import FaqList from '@/features/homepage/components/FaqList.vue'
import GuideList from '@/features/homepage/components/GuideList.vue'
import HomeCarousel from '@/features/homepage/components/HomeCarousel.vue'
import HomeCompetitionSection from '@/features/homepage/components/HomeCompetitionSection.vue'
import HomeHero from '@/features/homepage/components/HomeHero.vue'
import HomePhoneSearch from '@/features/homepage/components/HomePhoneSearch.vue'
import OrganizationRecruitmentList from '@/features/homepage/components/OrganizationRecruitmentList.vue'
import TeamRecruitmentList from '@/features/homepage/components/TeamRecruitmentList.vue'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 首页（FE-006 / FE-007 / FE-008 / FE-009 / FE-010 / FE-011）。
 *
 * 桌面端组合（FrontendDesign.md §18.1）：
 * - Hero：主信息 + 快捷入口（左），校园轮播（右）；
 * - 主栏：即将截止 + 热门竞赛 + 社区（正在组队 / 正在招新的组织 / 近期活动）；
 * - 右侧栏：通知公告 + 热门指南 + 常见问题。
 *
 * Phone / Tablet 采用单列堆叠，社区与右侧栏在内容之后展开（§18.2 / §34）。
 */
</script>

<template>
  <HomePhoneSearch />

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

        <div class="grid gap-8 sm:gap-10 md:grid-cols-3">
          <TeamRecruitmentList />
          <OrganizationRecruitmentList />
          <ActivityList />
        </div>
      </div>

      <aside class="min-w-0 space-y-8">
        <AnnouncementList />
        <GuideList />
        <FaqList />
      </aside>
    </div>
  </PageContainer>
</template>
