<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatFullDate } from '@/shared/lib/date'

import DynamicsDetailSection from '@/features/dynamics/components/DynamicsDetailSection.vue'
import {
  announcementLinkedKindIcon,
  announcementLinkedKindLabel,
  publisherScopeLabel
} from '@/features/dynamics/lib/dynamicsLabels'
import { getAnnouncement } from '@/features/dynamics/api/dynamicsApi'
import type { DynamicsAnnouncement } from '@/features/dynamics/types'
import RichContent from '@/shared/components/reader/RichContent.vue'

/**
 * 公告详情（FE-052 / FE-104 API 驱动）— /activities/announcements/:announcementId
 *
 * 展示：发布来源（学院/学校/平台）、标题、日期、Markdown 正文、
 * 关联对象（如有）、站外原文链接（如有，明确「查看原文」操作，不嵌入外站）。
 * Detail Shell；不使用 Phone Sticky Action；公开公告不写入 notification store。
 */
const route = useRoute()
const id = computed(() => String(route.params.announcementId ?? ''))
const announcement = ref<DynamicsAnnouncement | null>(null)
const loading = ref(true)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  announcement.value = null
  try {
    announcement.value = await getAnnouncement(id.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-3xl">
      <template v-if="loading">
        <div class="space-y-5">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-40 w-full rounded-card" />
          <USkeleton class="h-28 w-full rounded-card" />
        </div>
      </template>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该公告，或加载失败。
        </p>
        <RouterLink
          to="/activities?tab=announcements"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回校园动态
        </RouterLink>
      </div>

      <template v-else-if="announcement">
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
            <RichContent
              v-if="announcement.bodyMd"
              :content="announcement.bodyMd"
            />
            <p
              v-else
              class="text-sm text-muted"
            >
              暂无正文内容。
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
