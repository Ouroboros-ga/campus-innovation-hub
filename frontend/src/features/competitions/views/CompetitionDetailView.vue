<script setup lang="ts">
import { computed, ref } from 'vue'

import CompetitionDetailHeader from '@/features/competitions/components/CompetitionDetailHeader.vue'
import CompetitionHighlights from '@/features/competitions/components/CompetitionHighlights.vue'
import CompetitionRequirementGrid from '@/features/competitions/components/CompetitionRequirementGrid.vue'
import CompetitionSectionCard from '@/features/competitions/components/CompetitionSectionCard.vue'
import CompetitionTimeline from '@/features/competitions/components/CompetitionTimeline.vue'
import RegistrationTipsPanel from '@/features/competitions/components/RegistrationTipsPanel.vue'
import RelatedItemsCard from '@/features/competitions/components/RelatedItemsCard.vue'
import TeamRecruitmentPreview from '@/features/competitions/components/TeamRecruitmentPreview.vue'
import MobileActionBar from '@/shared/components/app/MobileActionBar.vue'
import type { CompetitionDetail } from '@/features/competitions/types'

/**
 * 竞赛详情纯展示视图（Pure Public View）。
 *
 * 学生端 `CompetitionDetailPage` 与运营端 `CompetitionStudioPage` 共用同一渲染，
 * 保证 WYSIWYG：运营所见即学生所得。
 *
 * 当 `editorMode=true` 时，关键区块标记 `data-editor-field`，供 Studio
 * 点击定位左侧 Inspector（Hover 高亮、Click 聚焦）。
 */
const props = withDefaults(
  defineProps<{
    detail: CompetitionDetail
    editorMode?: boolean
  }>(),
  { editorMode: false }
)

const emit = defineEmits<{
  'field-click': [field: string, section: string]
}>()

const followed = ref(false)

const registerAction = computed(() => {
  const current = props.detail
  if (current.officialUrl) return { to: undefined as string | undefined, href: current.officialUrl }
  if (current.guidePath) return { to: current.guidePath, href: undefined as string | undefined }
  return { to: '/qa', href: undefined as string | undefined }
})

const noticeAllPath = '/activities'
const guideAllPath = '/qa'

function linkHost(url: string) {
  return url.replace(/^https?:\/\//, '').split('/')[0]
}

function onFieldClick(field: string, section: string) {
  if (!props.editorMode) return
  emit('field-click', field, section)
}
</script>

<template>
  <div>
    <div
      data-editor-section="header"
      data-editor-field="name"
      :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
      @click="onFieldClick('name', 'basic')"
    >
      <CompetitionDetailHeader :detail="detail" />
    </div>

    <div
      class="mt-6"
      data-editor-section="highlights"
      :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
      @click="onFieldClick('highlights', 'highlights')"
    >
      <CompetitionHighlights :highlights="detail.highlights" />
    </div>

    <!-- 桌面：双栏 -->
    <div class="mt-8 hidden lg:block">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="min-w-0 space-y-8">
          <div
            data-editor-section="intro"
            data-editor-field="description_md"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('description_md', 'intro')"
          >
            <CompetitionSectionCard
              icon="i-lucide-book-open"
              title="赛事介绍"
            >
              <p class="text-sm leading-7 text-toned">
                {{ detail.intro }}
              </p>
            </CompetitionSectionCard>
          </div>

          <div
            data-editor-section="who"
            data-editor-field="suitable_for_md"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('suitable_for_md', 'intro')"
          >
            <CompetitionSectionCard
              icon="i-lucide-users"
              title="适合谁参加"
            >
              <p class="text-sm leading-7 text-toned">
                {{ detail.whoShouldJoin }}
              </p>
            </CompetitionSectionCard>
          </div>

          <div
            data-editor-section="requirement"
            data-editor-field="participation_mode"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('participation_mode', 'basic')"
          >
            <CompetitionSectionCard
              icon="i-lucide-clipboard-list"
              title="参赛要求 / 基本信息"
            >
              <CompetitionRequirementGrid :detail="detail" />
            </CompetitionSectionCard>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div
              data-editor-section="related"
              data-editor-field="related_guides"
              :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
              @click="onFieldClick('related_guides', 'related')"
            >
              <RelatedItemsCard
                icon="i-lucide-megaphone"
                title="相关通知"
                :items="detail.relatedAnnouncements"
                empty-text="暂无相关通知。"
                :action-to="noticeAllPath"
                action-label="查看全部"
              />
            </div>
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
          <div
            data-editor-section="timeline"
            data-editor-field="timeline"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('timeline', 'timeline')"
          >
            <CompetitionSectionCard
              icon="i-lucide-clock"
              title="关键时间"
              :action-to="guideAllPath"
              action-label="查看全部"
            >
              <CompetitionTimeline :detail="detail" />
            </CompetitionSectionCard>
          </div>

          <div
            data-editor-section="tips"
            data-editor-field="preparation_advice_md"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('preparation_advice_md', 'tips')"
          >
            <CompetitionSectionCard
              icon="i-lucide-circle-help"
              title="报名方式与提示"
            >
              <RegistrationTipsPanel
                :tips="detail.registrationTips"
                :guide-path="detail.guidePath"
              />
            </CompetitionSectionCard>
          </div>

          <div
            data-editor-section="links"
            data-editor-field="official_url"
            :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
            @click="onFieldClick('official_url', 'links')"
          >
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
          </div>
        </aside>
      </div>

      <div
        class="mt-8"
        data-editor-section="teams"
      >
        <TeamRecruitmentPreview :teams="detail.recruitingTeams" />
      </div>
    </div>

    <!-- 手机 / 平板：单列 -->
    <div class="mt-6 space-y-4 lg:hidden">
      <div
        data-editor-section="timeline"
        data-editor-field="timeline"
        :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
        @click="onFieldClick('timeline', 'timeline')"
      >
        <CompetitionSectionCard
          icon="i-lucide-clock"
          title="关键时间"
          :action-to="guideAllPath"
          action-label="查看全部"
        >
          <CompetitionTimeline :detail="detail" />
        </CompetitionSectionCard>
      </div>

      <div
        data-editor-section="who"
        data-editor-field="suitable_for_md"
        :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
        @click="onFieldClick('suitable_for_md', 'intro')"
      >
        <CompetitionSectionCard
          icon="i-lucide-users"
          title="适合谁参加"
        >
          <p class="text-sm leading-7 text-toned">
            {{ detail.whoShouldJoin }}
          </p>
        </CompetitionSectionCard>
      </div>

      <div
        data-editor-section="links"
        data-editor-field="official_url"
        :class="editorMode ? 'cursor-pointer rounded-md ring-1 ring-transparent hover:ring-primary-300' : ''"
        @click="onFieldClick('official_url', 'links')"
      >
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
      </div>

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

      <TeamRecruitmentPreview :teams="detail.recruitingTeams" />
    </div>

    <MobileActionBar v-if="!editorMode">
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
  </div>
</template>
