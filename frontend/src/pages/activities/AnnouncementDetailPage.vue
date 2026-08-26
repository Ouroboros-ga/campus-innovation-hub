<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatFullDate } from '@/shared/lib/date'

import DynamicsDetailSection from '@/features/dynamics/components/DynamicsDetailSection.vue'
import {
  announcementLinkedKindIcon,
  announcementLinkedKindLabel,
  publisherScopeLabel
} from '@/features/dynamics/lib/dynamicsLabels'
import { findAnnouncement, mdToPlainText } from '@/features/dynamics/lib/dynamicsDetail'

/**
 * 公告详情（FE-052）— /activities/announcements/:announcementId
 *
 * 展示：发布来源（学院/学校/平台）、标题、日期、Markdown 正文、
 * 关联对象（如有）、站外原文链接（如有，明确「查看原文」操作，不嵌入外站）。
 * Detail Shell；不使用 Phone Sticky Action；公开公告不写入 notification store。
 */
const route = useRoute()
const id = computed(() => String(route.params.announcementId ?? ''))
const announcement = computed(() => findAnnouncement(id.value))
const body = computed(() => mdToPlainText(announcement.value?.bodyMd ?? null))
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-3xl">
      <div v-if="!announcement">
        <p class="text-base text-muted">
          未找到该公告。
        </p>
        <RouterLink
          to="/activities?tab=announcements"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回校园动态
        </RouterLink>
      </div>

      <template v-else>
        <!-- 桌面/平板面包屑：手机端由居中返回头承担返回（§16.5） -->
        <nav
          class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
          aria-label="面包屑"
        >
          <RouterLink
            to="/activities?tab=announcements"
            class="transition-colors hover:text-primary-600"
          >
            校园动态
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <span class="text-highlighted">
            公告
          </span>
        </nav>

        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ publisherScopeLabel[announcement.publisherScope] }}公告
          </UBadge>
          <UButton
            v-if="announcement.externalUrl"
            :to="announcement.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-external-link"
          >
            查看原文
          </UButton>
        </div>

        <h1 class="mt-3 text-2xl font-semibold leading-snug text-highlighted">
          {{ announcement.title }}
        </h1>
        <p class="mt-2 text-sm tabular-nums text-muted">
          {{ formatFullDate(announcement.publishedAt) }}
        </p>

        <div class="mt-8 space-y-8">
          <DynamicsDetailSection title="公告内容">
            <p class="whitespace-pre-line text-sm leading-7 text-toned">
              {{ body }}
            </p>
          </DynamicsDetailSection>

          <DynamicsDetailSection
            v-if="announcement.linkedObject"
            title="关联对象"
          >
            <RouterLink
              :to="announcement.linkedObject.to"
              class="inline-flex min-h-9 items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <UIcon
                :name="announcementLinkedKindIcon[announcement.linkedObject.kind]"
                class="size-4"
                aria-hidden="true"
              />
              前往相关{{ announcementLinkedKindLabel[announcement.linkedObject.kind] }}：{{
                announcement.linkedObject.label }}
            </RouterLink>
          </DynamicsDetailSection>
        </div>
      </template>
    </PageContainer>
  </section>
</template>
