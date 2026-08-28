<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
import { getHome, type HomeData } from '@/features/homepage/api/homeApi'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 首页 — 接真实 /api/home（去 Mock）。
 * 加载态/空态/错态按 FrontendArchitecture 要求显式处理，不再把 fixtures 当作官方数据展示。
 */
const data = ref<HomeData | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await getHome()
  } catch {
    error.value = '首页加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <HomePhoneSearch />

  <HomeHero>
    <template #media>
      <HomeCarousel :slides="data?.banners ?? undefined" />
    </template>
  </HomeHero>

  <PageContainer>
    <div
      v-if="loading"
      class="py-20 text-center text-sm text-muted"
    >
      正在加载首页…
    </div>
    <p
      v-else-if="error"
      class="py-10 text-center text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
      <UButton
        class="ml-2"
        size="xs"
        color="neutral"
        variant="soft"
        @click="load"
      >
        重试
      </UButton>
    </p>
    <div
      v-else
      class="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12"
    >
      <div class="min-w-0 space-y-10 sm:space-y-12">
        <DeadlineGrid :items="data?.deadlines ?? []" />
        <HomeCompetitionSection :items="data?.featuredCompetitions ?? []" />

        <div class="grid gap-8 sm:gap-10 md:grid-cols-3">
          <TeamRecruitmentList :items="data?.teamPosts ?? []" />
          <OrganizationRecruitmentList :items="data?.recruitingOrganizations ?? []" />
          <ActivityList :items="data?.activities ?? []" />
        </div>
      </div>

      <aside class="min-w-0 space-y-8">
        <AnnouncementList :items="data?.announcements ?? []" />
        <GuideList :items="data?.featuredGuides ?? []" />
        <FaqList :items="data?.faqs ?? []" />
      </aside>
    </div>
  </PageContainer>
</template>
