<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import CompetitionDetailHeader from '@/features/competitions/components/CompetitionDetailHeader.vue'
import CompetitionHighlights from '@/features/competitions/components/CompetitionHighlights.vue'
import CompetitionRequirementGrid from '@/features/competitions/components/CompetitionRequirementGrid.vue'
import CompetitionSectionCard from '@/features/competitions/components/CompetitionSectionCard.vue'
import CompetitionTimeline from '@/features/competitions/components/CompetitionTimeline.vue'
import RegistrationTipsPanel from '@/features/competitions/components/RegistrationTipsPanel.vue'
import RelatedItemsCard from '@/features/competitions/components/RelatedItemsCard.vue'
import TeamRecruitmentPreview from '@/features/competitions/components/TeamRecruitmentPreview.vue'
import { getCompetition } from '@/features/competitions/api/competitionApi'
import type { CompetitionDetail } from '@/features/competitions/types'
import MobileActionBar from '@/shared/components/app/MobileActionBar.vue'
import PageContainer from '@/shared/components/layout/PageContainer.vue'

/**
 * 竞赛详情页（按参考设计稿，PC + 移动端；FE-101 API 驱动）。
 *
 * 桌面为「左内容 + 右侧栏」双栏布局；手机为单列卡片流，并在底部提供
 * 关注 / 立即报名的 Sticky Action Bar（§34.7）。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

const detail = ref<CompetitionDetail | null>(null)
const loading = ref(true)
const error = ref(false)

watch(
  id,
  async () => {
    loading.value = true
    error.value = false
    detail.value = null
    try {
      detail.value = await getCompetition(id.value)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

const followed = ref(false)

/** 移动端底部主任务（§34.7）：立即报名。 */
const registerAction = computed(() => {
  const current = detail.value
  if (!current) return { to: '/qa', href: undefined as string | undefined }
  if (current.officialUrl) return { to: undefined, href: current.officialUrl }
  if (current.guidePath) return { to: current.guidePath, href: undefined }
  return { to: '/qa', href: undefined }
})

const noticeAllPath = '/activities'
const guideAllPath = '/qa'

/** 提取链接主机名（避免在 SFC 中引用 URL 全局构造器）。 */
function linkHost(url: string) {
  return url.replace(/^https?:\/\//, '').split('/')[0]
}
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-6xl">
      <!-- 桌面面包屑 -->
      <nav
        class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
        aria-label="面包屑"
      >
        <RouterLink
          to="/competitions"
          class="transition-colors hover:text-primary-600"
        >
          竞赛
        </RouterLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
        <span class="text-highlighted">
          竞赛详情
        </span>
      </nav>

      <div
        v-if="loading"
        class="space-y-4"
      >
        <USkeleton class="h-44 w-full rounded-card" />
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-24 w-full rounded-card"
        />
      </div>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该竞赛，或加载失败。
        </p>
        <RouterLink
          to="/competitions"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回竞赛列表
        </RouterLink>
      </div>

      <template v-else-if="detail">
        <CompetitionDetailHeader :detail="detail" />

        <div class="mt-6">
          <CompetitionHighlights :highlights="detail.highlights" />
        </div>

        <!-- 桌面：双栏（左内容 + 右侧栏） -->
        <div class="mt-8 hidden lg:block">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div class="min-w-0 space-y-8">
              <CompetitionSectionCard
                icon="i-lucide-book-open"
                title="赛事介绍"
              >
                <p class="text-sm leading-7 text-toned">
                  {{ detail.intro }}
                </p>
              </CompetitionSectionCard>

              <CompetitionSectionCard
                icon="i-lucide-users"
                title="适合谁参加"
              >
                <p class="text-sm leading-7 text-toned">
                  {{ detail.whoShouldJoin }}
                </p>
              </CompetitionSectionCard>

              <CompetitionSectionCard
                icon="i-lucide-clipboard-list"
                title="参赛要求 / 基本信息"
              >
                <CompetitionRequirementGrid :detail="detail" />
              </CompetitionSectionCard>

              <div class="grid gap-6 sm:grid-cols-2">
                <RelatedItemsCard
                  icon="i-lucide-megaphone"
                  title="相关通知"
                  :items="detail.relatedAnnouncements"
                  empty-text="暂无相关通知。"
                  :action-to="noticeAllPath"
                  action-label="查看全部"
                />
                <RelatedItemsCard
                  icon="i-lucide-book-open"
                  title="相关指南"
                  :items="detail.relatedGuides"
                  empty-text="暂无相关指南。"
                  :action-to="guideAllPath"
                  action-label="查看全部"
                />
              </div>
            </div>

            <aside class="min-w-0 space-y-8">
              <CompetitionSectionCard
                icon="i-lucide-clock"
                title="关键时间"
                :action-to="guideAllPath"
                action-label="查看全部"
              >
                <CompetitionTimeline :detail="detail" />
              </CompetitionSectionCard>

              <CompetitionSectionCard
                icon="i-lucide-circle-help"
                title="报名方式与提示"
              >
                <RegistrationTipsPanel
                  :tips="detail.registrationTips"
                  :guide-path="detail.guidePath"
                />
              </CompetitionSectionCard>

              <CompetitionSectionCard
                icon="i-lucide-link"
                title="官方链接"
              >
                <ul
                  v-if="detail.officialLinks.length > 0"
                  class="space-y-2"
                >
                  <li
                    v-for="link in detail.officialLinks"
                    :key="link.url"
                  >
                    <a
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
                    >
                      <UIcon
                        name="i-lucide-external-link"
                        class="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span class="min-w-0 truncate">
                        {{ link.label }}
                      </span>
                      <span class="shrink-0 text-xs text-muted">
                        {{ linkHost(link.url) }}
                      </span>
                    </a>
                  </li>
                </ul>
                <p
                  v-else
                  class="text-sm text-muted"
                >
                  暂无官方链接。
                </p>
              </CompetitionSectionCard>
            </aside>
          </div>

          <TeamRecruitmentPreview
            class="mt-8"
            :teams="detail.recruitingTeams"
          />
        </div>

        <!-- 手机 / 平板：单列卡片流（按移动端参考设计稿顺序） -->
        <div class="mt-6 space-y-4 lg:hidden">
          <CompetitionSectionCard
            icon="i-lucide-clock"
            title="关键时间"
            :action-to="guideAllPath"
            action-label="查看全部"
          >
            <CompetitionTimeline :detail="detail" />
          </CompetitionSectionCard>

          <CompetitionSectionCard
            icon="i-lucide-users"
            title="适合谁参加"
          >
            <p class="text-sm leading-7 text-toned">
              {{ detail.whoShouldJoin }}
            </p>
          </CompetitionSectionCard>

          <CompetitionSectionCard
            icon="i-lucide-link"
            title="官方链接"
          >
            <ul
              v-if="detail.officialLinks.length > 0"
              class="space-y-2"
            >
              <li
                v-for="link in detail.officialLinks"
                :key="link.url"
              >
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
                >
                  <UIcon
                    name="i-lucide-external-link"
                    class="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 truncate">
                    {{ link.label }}
                  </span>
                  <span class="shrink-0 text-xs text-muted">
                    {{ linkHost(link.url) }}
                  </span>
                </a>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-muted"
            >
              暂无官方链接。
            </p>
          </CompetitionSectionCard>

          <div class="grid gap-4 sm:grid-cols-2">
            <RelatedItemsCard
              icon="i-lucide-megaphone"
              title="相关通知"
              :items="detail.relatedAnnouncements"
              empty-text="暂无相关通知。"
              :action-to="noticeAllPath"
              action-label="查看全部"
            />
            <RelatedItemsCard
              icon="i-lucide-book-open"
              title="相关指南"
              :items="detail.relatedGuides"
              empty-text="暂无相关指南。"
              :action-to="guideAllPath"
              action-label="查看全部"
            />
          </div>

          <TeamRecruitmentPreview
            :teams="detail.recruitingTeams"
          />
        </div>
      </template>
    </PageContainer>

    <!-- 手机 Sticky 主操作栏（§34.7，安全区兼容） -->
    <MobileActionBar v-if="detail">
      <div class="flex w-full items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-star"
          class="shrink-0"
          @click="followed = !followed"
        >
          {{ followed ? '已关注' : '关注赛事' }}
        </UButton>
        <UButton
          :to="registerAction.to"
          :href="registerAction.href"
          :target="registerAction.href ? '_blank' : undefined"
          :rel="registerAction.href ? 'noopener noreferrer' : undefined"
          color="primary"
          variant="solid"
          class="min-w-0 flex-1"
          icon="i-lucide-plus"
        >
          立即报名
        </UButton>
      </div>
    </MobileActionBar>
  </section>
</template>
