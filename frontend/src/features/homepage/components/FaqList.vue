<script setup lang="ts">
import { faqList } from '@/mocks/fixtures/homepage'
import {
  faqCategoryIcon,
  faqCategoryLabel
} from '@/shared/lib/domain-labels'
import type { FaqSummary } from '@/shared/types/homepage'
import SectionHeader from './SectionHeader.vue'

/**
 * 首页「常见问题」区块（FE-011，右侧栏）。
 *
 * 设计来源：
 * - PageMap 首页-常见问题：问题标题，点击进入 Q&A；
 * - FrontendDesign.md §20 / §45：FAQ 用列表，单条底边分隔；
 * - §47 / database-design §28：不展示虚构浏览量 / 回答数。
 */
const props = withDefaults(
  defineProps<{ items?: FaqSummary[] }>(),
  { items: () => faqList }
)
</script>

<template>
  <section>
    <SectionHeader
      title="常见问题"
      to="/qa"
    />
    <ul class="mt-2 divide-y divide-default">
      <li
        v-for="item in props.items"
        :key="item.id"
      >
        <RouterLink
          :to="item.detailPath"
          class="group flex items-center gap-3 py-3"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="faqCategoryIcon[item.category]"
              class="size-[18px] text-primary-600 dark:text-primary-400"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span
              class="line-clamp-2 text-sm font-semibold leading-snug text-highlighted transition-colors group-hover:text-primary-600"
            >
              {{ item.question }}
            </span>
            <span class="mt-0.5 block text-xs text-muted">
              {{ faqCategoryLabel[item.category] }}
            </span>
          </span>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 shrink-0 text-muted transition-colors group-hover:text-primary-600"
            aria-hidden="true"
          />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
