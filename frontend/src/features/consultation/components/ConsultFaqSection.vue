<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  faqCategoryIcon,
  faqCategoryLabel
} from '@/shared/lib/domain-labels'

import type { ConsultFaq } from '../types'
import ConsultSectionHeader from './ConsultSectionHeader.vue'

/**
 * 常见问题区块（FE-050 / FE-060）。
 * 手风琴式：点击问题展开答案。
 * `grouped` 为 true 时按分类分组，每组带分类标题；标题行含「查看全部」链接，
 * 底部含「查看全部」按钮。
 */
const props = withDefaults(
  defineProps<{
    items: ConsultFaq[]
    viewAllTo?: string
    viewAllLabel?: string
    /** 是否按分类分组渲染（每组带分类标题）。 */
    grouped?: boolean
  }>(),
  { viewAllTo: '', viewAllLabel: '查看全部常见问题', grouped: false }
)

interface FaqGroup {
  category: ConsultFaq['category'] | null
  items: ConsultFaq[]
}

const openId = ref<string | null>(null)

/** 非分组时为单组（无分类标题）；分组时按分类收集（保持出现顺序）。 */
const groups = computed<FaqGroup[]>(() => {
  if (!props.grouped) {
    return props.items.length === 0 ? [] : [{ category: null, items: props.items }]
  }
  const result: FaqGroup[] = []
  for (const item of props.items) {
    const group = result.find(entry => entry.category === item.category)
    if (group) {
      group.items.push(item)
    } else {
      result.push({ category: item.category, items: [item] })
    }
  }
  return result
})

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <section>
    <ConsultSectionHeader
      icon="i-lucide-circle-help"
      title="常见问题"
      :action-to="props.viewAllTo"
      action-label="查看全部"
    />

    <div
      v-if="groups.length"
      class="mt-3 space-y-6"
    >
      <div
        v-for="group in groups"
        :key="group.category ?? '__all__'"
      >
        <div
          v-if="group.category"
          class="mb-2 flex items-center gap-2"
        >
          <span
            class="grid size-6 place-items-center rounded-control bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
            aria-hidden="true"
          >
            <UIcon
              :name="faqCategoryIcon[group.category]"
              class="size-3.5"
            />
          </span>
          <span class="text-sm font-semibold text-highlighted">
            {{ faqCategoryLabel[group.category] }}
          </span>
        </div>

        <ul class="divide-y divide-default rounded-surface border border-default bg-default">
          <li
            v-for="item in group.items"
            :key="item.id"
          >
            <button
              type="button"
              class="group flex w-full items-center gap-3 px-3 py-3 text-left"
              :aria-expanded="openId === item.id"
              @click="toggle(item.id)"
            >
              <span
                class="grid size-7 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
                aria-hidden="true"
              >
                <UIcon
                  :name="faqCategoryIcon[item.category]"
                  class="size-3.5"
                />
              </span>
              <span class="min-w-0 flex-1 text-sm font-medium text-highlighted transition-colors group-hover:text-primary-600">
                {{ item.question }}
              </span>
              <UIcon
                :name="openId === item.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 shrink-0 text-muted transition-colors"
                aria-hidden="true"
              />
            </button>

            <p
              v-if="openId === item.id"
              class="px-3 pb-3 pl-[3.25rem] text-sm leading-6 text-toned"
            >
              {{ item.answer }}
            </p>
          </li>
        </ul>
      </div>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-search-x"
      title="暂无常见问题"
      description="该分类下暂无内容。"
    />

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
