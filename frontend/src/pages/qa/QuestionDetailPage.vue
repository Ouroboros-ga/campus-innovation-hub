<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate } from '@/shared/lib/date'
import RichContent from '@/shared/components/reader/RichContent.vue'

import { qaStatusMeta } from '@/features/consultation/lib/consultationLabels'
import { findQaPost } from '@/features/consultation/lib/consultation'

/**
 * 公开问答详情（FE-051）— /qa/questions/:id
 * 展示问题、状态徽标、标签、完整回答、回答者与赞同数。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const post = computed(() => findQaPost(id.value))
</script>

<template>
  <section class="pt-4 pb-10 sm:pt-6 sm:pb-14">
    <PageContainer class="max-w-3xl">
      <div v-if="!post">
        <p class="text-base text-muted">
          未找到该问答。
        </p>
        <RouterLink
          to="/qa/questions"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回公开问答
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
            to="/qa/questions"
            class="transition-colors hover:text-primary-600"
          >
            问答
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <span class="line-clamp-1 max-w-xs text-highlighted">
            {{ post.question }}
          </span>
        </nav>

        <article class="mt-5 rounded-surface border border-default bg-default p-5">
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-2xl font-bold leading-snug text-highlighted sm:text-3xl">
              {{ post.question }}
            </h1>
            <UBadge
              size="sm"
              variant="soft"
              :color="qaStatusMeta[post.status].color"
              class="shrink-0"
            >
              {{ qaStatusMeta[post.status].label }}
            </UBadge>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800"
            >
              {{ tag }}
            </span>
          </div>

          <RichContent
            v-if="post.answer"
            class="mt-4"
            :content="post.answer"
          />
          <p
            v-else
            class="mt-4 text-sm text-muted"
          >
            暂未回答。
          </p>

          <footer class="mt-5 flex items-center justify-between gap-3 border-t border-default pt-3 text-xs text-muted">
            <div class="min-w-0">
              回答者：
              <span class="font-medium text-highlighted">{{ post.authorName }}</span>
              · 回答于 {{ formatCompactDate(post.answeredAt) }}
            </div>
            <span class="inline-flex shrink-0 items-center gap-1">
              <UIcon
                name="i-lucide-thumbs-up"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ post.likes }}
            </span>
          </footer>
        </article>
      </template>
    </PageContainer>
  </section>
</template>
