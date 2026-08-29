<script setup lang="ts">
import { computed, ref } from 'vue'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useDebouncedValue } from '@/shared/composables/useDebouncedValue'

import ConsultFaqSection from '@/features/consultation/components/ConsultFaqSection.vue'
import ConsultGuideSection from '@/features/consultation/components/ConsultGuideSection.vue'
import ConsultQaSection from '@/features/consultation/components/ConsultQaSection.vue'
import { consultSections } from '@/features/consultation/lib/consultationLabels'
import { consultFaqs, consultGuides, consultQaPosts } from '@/mocks/fixtures/consultation'

/**
 * 咨询与指南（FE-050）— /qa
 *
 * 展示：常见问题（手风琴）、指南（卡片）、公开问答（卡片）三个区块；
 * 桌面为三列并排，手机为纵向堆叠；顶部提供搜索与「提交咨询」入口与区块导航。
 * 设计来源：PageMap 咨询指南 / 参考设计稿；FrontendDesign §34.6（详情壳，减少卡片嵌套）。
 */
const q = ref('')

// 懒搜索：输入停顿 300ms 后才应用本地过滤
const debouncedQ = useDebouncedValue(q, 300)

const filteredFaqs = computed(() => filterBy(consultFaqs, item => item.question))
const filteredGuides = computed(() => filterBy(consultGuides, item => item.title))
const filteredQa = computed(() => filterBy(consultQaPosts, item => item.question))

function filterBy<T>(items: readonly T[], toSearch: (item: T) => string): T[] {
  const keyword = debouncedQ.value.trim().toLowerCase()
  if (!keyword) return [...items]
  return items.filter(item => toSearch(item).toLowerCase().includes(keyword))
}

const activeSection = ref('faq')

/** 可滚动元素最小接口（避免在 lint 环境引用 DOM 全局类型）。 */
type ScrollableEl = { scrollIntoView?: (options?: unknown) => void }
const sectionEls = ref<Record<string, ScrollableEl | null>>({})
const hasResults = computed(
  () =>
    filteredFaqs.value.length > 0 ||
    filteredGuides.value.length > 0 ||
    filteredQa.value.length > 0
)

function setSectionRef(key: string, el: unknown) {
  sectionEls.value[key] = (el as ScrollableEl | null) ?? null
}

function scrollTo(id: string) {
  activeSection.value = id
  sectionEls.value[id]?.scrollIntoView?.({ behavior: 'auto', block: 'start' })
}

const viewAll = {
  faq: '/qa/faqs',
  guide: '/qa/guides',
  qa: '/qa/questions'
} as const
</script>

<template>
  <section class="pb-10 pt-6 sm:pb-14 sm:pt-10">
    <PageContainer class="max-w-6xl">
      <!-- 桌面：标题 + 副标题 + 搜索 + 提交咨询 -->
      <div class="hidden items-end justify-between gap-6 md:flex">
        <div>
          <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
            咨询与指南
          </h1>
          <p class="mt-2 max-w-xl text-base text-muted">
            为你提供常见问题解答、办事指南与公开问答，帮助你更高效地参与科创与竞赛活动。
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="搜索问题、指南或关键词"
            class="w-96"
            aria-label="搜索问题、指南或关键词"
          />
          <UButton
            to="/qa/submit"
            color="primary"
            variant="solid"
            icon="i-lucide-pen-square"
          >
            提交咨询
          </UButton>
        </div>
      </div>

      <!-- 手机：搜索 + 提交咨询 -->
      <div class="space-y-3 md:hidden">
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="搜索问题、指南或关键词"
          class="w-full"
          aria-label="搜索问题、指南或关键词"
        />
        <div class="flex justify-end">
          <UButton
            to="/qa/submit"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-pen-square"
          >
            提交咨询
          </UButton>
        </div>
      </div>

      <!-- 区块导航 -->
      <nav
        class="mt-6 flex items-center gap-1 border-b border-default"
        aria-label="咨询与指南区块"
      >
        <button
          v-for="section in consultSections"
          :key="section.id"
          type="button"
          class="relative inline-flex min-h-11 items-center gap-1.5 px-3 text-sm transition-colors"
          :class="activeSection === section.id ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-muted hover:text-highlighted'"
          :aria-current="activeSection === section.id ? 'true' : undefined"
          @click="scrollTo(section.id)"
        >
          <UIcon
            :name="section.icon"
            class="size-4"
            aria-hidden="true"
          />
          {{ section.title }}
          <span
            v-if="activeSection === section.id"
            class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600 dark:bg-primary-400"
            aria-hidden="true"
          />
        </button>
      </nav>

      <!-- 内容：桌面三列 / 移动堆叠 -->
      <div
        v-if="hasResults"
        class="mt-6 grid gap-8 lg:grid-cols-3"
      >
        <div :ref="el => setSectionRef('faq', el)">
          <ConsultFaqSection
            :items="filteredFaqs"
            :view-all-to="viewAll.faq"
          />
        </div>
        <div :ref="el => setSectionRef('guide', el)">
          <ConsultGuideSection
            :items="filteredGuides"
            :view-all-to="viewAll.guide"
          />
        </div>
        <div :ref="el => setSectionRef('qa', el)">
          <ConsultQaSection
            :items="filteredQa"
            :view-all-to="viewAll.qa"
          />
        </div>
      </div>

      <div
        v-else
        class="mt-8"
      >
        <UEmpty
          icon="i-lucide-search-x"
          title="没有找到相关内容"
          description="试试调整搜索关键词。"
        />
      </div>
    </PageContainer>
  </section>
</template>
