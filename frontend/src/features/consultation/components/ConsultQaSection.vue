<script setup lang="ts">
import { formatCompactDate } from '@/shared/lib/date'

import { qaStatusMeta } from '../lib/consultationLabels'
import type { ConsultQaPost } from '../types'
import ConsultSectionHeader from './ConsultSectionHeader.vue'

/**
 * 公开问答区块（FE-050）。
 * 每条：问题标题 + 状态徽标 + 标签 + 回答摘要 + 回答者 / 日期 + 赞同数。
 */
const props = withDefaults(
  defineProps<{
    items: ConsultQaPost[]
    viewAllTo?: string
    viewAllLabel?: string
  }>(),
  { viewAllTo: '', viewAllLabel: '查看全部公开问答' }
)
</script>

<template>
  <section>
    <ConsultSectionHeader
      icon="i-lucide-message-square-text"
      title="公开问答"
      :action-to="props.viewAllTo"
      action-label="查看全部"
    />

    <ul class="mt-3 space-y-3">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group block rounded-surface border border-default bg-default p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
                aria-hidden="true"
              >
                <UIcon
                  name="i-lucide-message-square-text"
                  class="size-4"
                />
              </span>
              <span class="min-w-0 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600">
                {{ item.question }}
              </span>
            </span>
            <UBadge
              size="sm"
              variant="soft"
              :color="qaStatusMeta[item.status].color"
            >
              {{ qaStatusMeta[item.status].label }}
            </UBadge>
          </div>

          <div class="mt-2 flex flex-wrap gap-1.5 pl-10">
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800"
            >
              {{ tag }}
            </span>
          </div>

          <p class="mt-2 line-clamp-2 pl-10 text-sm leading-6 text-toned">
            {{ item.answer }}
          </p>

          <p class="mt-2 flex items-center gap-2 pl-10 text-xs text-muted">
            回答者：
            <span class="font-medium text-highlighted">{{ item.authorName }}</span>
            · 回答于 {{ formatCompactDate(item.answeredAt) }}
            <span class="ml-auto inline-flex items-center gap-1">
              <UIcon
                name="i-lucide-thumbs-up"
                class="size-3.5"
                aria-hidden="true"
              />
              {{ item.likes }}
            </span>
          </p>
        </RouterLink>
      </li>
    </ul>

    <UButton
      v-if="props.viewAllTo"
      :to="props.viewAllTo"
      color="neutral"
      variant="outline"
      size="sm"
      class="mt-4 w-full"
      icon="i-lucide-arrow-right"
    >
      {{ props.viewAllLabel }}
    </UButton>
  </section>
</template>
