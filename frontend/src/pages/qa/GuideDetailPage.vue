<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate } from '@/shared/lib/date'
import { guideCategoryIcon, guideCategoryLabel } from '@/shared/lib/domain-labels'
import RichContent from '@/shared/components/reader/RichContent.vue'

import { findGuideDetail } from '@/features/consultation/lib/consultation'

/**
 * 指南详情（FE-051）— /qa/guides/:id
 * 展示指南标题、类型、更新日期与正文。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const detail = computed(() => findGuideDetail(id.value))
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-3xl">
      <div v-if="!detail">
        <p class="text-base text-muted">
          未找到该指南。
        </p>
        <RouterLink
          to="/qa/guides"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回指南
        </RouterLink>
      </div>

      <template v-else>
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
          <RouterLink
            to="/qa/guides"
            class="transition-colors hover:text-primary-600"
          >
            指南
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <span class="line-clamp-1 max-w-xs text-highlighted">
            {{ detail.title }}
          </span>
        </nav>

        <div class="mt-5 flex items-start gap-3">
          <span
            class="grid size-12 shrink-0 place-items-center rounded-surface bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
            aria-hidden="true"
          >
            <UIcon
              :name="guideCategoryIcon[detail.category]"
              class="size-5"
            />
          </span>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold leading-snug text-highlighted sm:text-3xl">
              {{ detail.title }}
            </h1>
            <p class="mt-1.5 text-sm text-muted">
              {{ guideCategoryLabel[detail.category] }} ·
              更新于 {{ formatCompactDate(detail.publishedAt) }}
            </p>
          </div>
        </div>

        <p
          v-if="detail.summary"
          class="mt-4 text-sm leading-6 text-toned"
        >
          {{ detail.summary }}
        </p>

        <div class="mt-6 border-t border-default pt-6">
          <RichContent :content="detail.body" />
        </div>
      </template>
    </PageContainer>
  </section>
</template>
