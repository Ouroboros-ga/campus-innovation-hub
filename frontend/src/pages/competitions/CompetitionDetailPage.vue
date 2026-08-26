<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import CompetitionBasicInfo from '@/features/competitions/components/CompetitionBasicInfo.vue'
import CompetitionDetailHeader from '@/features/competitions/components/CompetitionDetailHeader.vue'
import CompetitionTimeline from '@/features/competitions/components/CompetitionTimeline.vue'
import DetailSection from '@/features/competitions/components/DetailSection.vue'
import { findCompetitionDetail } from '@/features/competitions/lib/competitionDetail'
import { formatCompactDate } from '@/shared/lib/date'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 竞赛详情页（FE-021）。
 *
 * 设计来源：PageMap 竞赛详情 / FrontendDesign.md §34.6（减少卡片嵌套，
 * 区块标题 + 分隔线 + 内容）；主任务在 Header 中保持明显（§34.7）。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const detail = computed(() => findCompetitionDetail(id.value))
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer>
      <div v-if="!detail">
        <p class="text-base text-muted">
          未找到该竞赛。
        </p>
        <RouterLink
          to="/competitions"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回竞赛列表
        </RouterLink>
      </div>

      <template v-else>
        <CompetitionDetailHeader :detail="detail" />

        <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div class="min-w-0 space-y-8">
            <DetailSection title="基本信息">
              <CompetitionBasicInfo :detail="detail" />
            </DetailSection>

            <DetailSection title="比赛简介">
              <p class="max-w-2xl text-sm leading-7 text-toned">
                {{ detail.intro }}
              </p>
            </DetailSection>

            <DetailSection title="谁适合参加">
              <ul class="space-y-1.5 text-sm text-toned">
                <li>
                  <span class="font-medium text-highlighted">年级：</span>
                  {{ detail.whoShouldJoin.grades }}
                </li>
                <li>
                  <span class="font-medium text-highlighted">基础要求：</span>
                  {{ detail.whoShouldJoin.prerequisites }}
                </li>
                <li v-if="detail.whoShouldJoin.skills.length">
                  <span class="font-medium text-highlighted">技能建议：</span>
                  {{ detail.whoShouldJoin.skills.join('、') }}
                </li>
                <li>
                  <span class="font-medium text-highlighted">是否需要团队：</span>
                  {{ detail.whoShouldJoin.teamNeeded ? '需要组队' : '可独立参赛' }}
                </li>
              </ul>
            </DetailSection>

            <DetailSection title="时间线">
              <CompetitionTimeline :detail="detail" />
            </DetailSection>
          </div>

          <aside class="min-w-0 space-y-8">
            <DetailSection title="相关通知">
              <ul
                v-if="detail.relatedAnnouncements.length"
                class="divide-y divide-default"
              >
                <li
                  v-for="item in detail.relatedAnnouncements"
                  :key="item.id"
                >
                  <RouterLink
                    :to="item.detailPath"
                    class="group flex items-center justify-between gap-3 py-3"
                  >
                    <span
                      class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600"
                    >
                      {{ item.title }}
                    </span>
                    <span class="shrink-0 text-xs tabular-nums text-muted">
                      {{ formatCompactDate(item.publishedAt) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted"
              >
                暂无相关通知。
              </p>
            </DetailSection>

            <DetailSection title="相关指南">
              <ul
                v-if="detail.relatedGuides.length"
                class="divide-y divide-default"
              >
                <li
                  v-for="item in detail.relatedGuides"
                  :key="item.id"
                >
                  <RouterLink
                    :to="item.detailPath"
                    class="group block py-3"
                  >
                    <span
                      class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600"
                    >
                      {{ item.title }}
                    </span>
                    <span class="mt-0.5 block text-xs tabular-nums text-muted">
                      {{ formatCompactDate(item.publishedAt) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted"
              >
                暂无相关指南。
              </p>
            </DetailSection>

            <DetailSection title="正在组队">
              <ul
                v-if="detail.recruitingTeams.length"
                class="divide-y divide-default"
              >
                <li
                  v-for="item in detail.recruitingTeams"
                  :key="item.id"
                >
                  <RouterLink
                    :to="item.detailPath"
                    class="group block py-3"
                  >
                    <span
                      class="line-clamp-2 text-sm font-semibold text-highlighted transition-colors group-hover:text-primary-600"
                    >
                      {{ item.title }}
                    </span>
                    <span class="mt-1 block text-xs text-muted">
                      {{ item.competitionName }} ·
                      {{ item.baseMemberCount }}/{{ item.targetMemberCount }} 人
                    </span>
                    <span class="mt-0.5 block truncate text-xs text-muted">
                      {{ item.roles.join(' · ') }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted"
              >
                暂无正在组队的队伍。
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton
                  to="/teams"
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-users"
                >
                  查看全部组队
                </UButton>
                <UButton
                  to="/teams"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-user-plus"
                >
                  发布组队
                </UButton>
              </div>
            </DetailSection>
          </aside>
        </div>
      </template>
    </PageContainer>
  </section>
</template>
