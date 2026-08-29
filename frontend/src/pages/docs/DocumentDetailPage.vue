<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { formatCompactDate } from '@/shared/lib/date'
import { getDocument } from '@/features/documents/api/documentApi'
import type { SiteDocument } from '@/features/documents/api/documentApi'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? '').toLowerCase())

const docNav = [
  { slug: 'about', label: '关于我们', icon: 'i-lucide-info', category: 'ABOUT' },
  { slug: 'contact', label: '联系我们', icon: 'i-lucide-mail', category: 'CONTACT' },
  { slug: 'help', label: '使用帮助', icon: 'i-lucide-circle-help', category: 'HELP' },
  { slug: 'privacy', label: '隐私政策', icon: 'i-lucide-shield', category: 'PRIVACY' },
  { slug: 'terms', label: '服务条款', icon: 'i-lucide-file-text', category: 'TERMS' }
] as const

const activeSlug = computed(() => slug.value)
const activeNav = computed(() => docNav.find(item => item.slug === activeSlug.value))

const data = ref<SiteDocument | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  if (!activeSlug.value) return
  loading.value = true
  error.value = ''
  try {
    data.value = await getDocument(activeSlug.value)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '文档加载失败'
    // 区分 404
    if (String(message).includes('404') || String(message).includes('不存在')) {
      error.value = '未找到该文档。'
    } else {
      error.value = '文档加载失败，请稍后重试。'
    }
    data.value = null
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  // 当 slug 变化时重新加载
  void slug.value
  void load()
})

const title = computed(() => data.value?.title ?? activeNav.value?.label ?? '文档')
</script>

<template>
  <section class="pb-10 pt-4 sm:pb-14 sm:pt-6">
    <PageContainer>
      <!-- 桌面面包屑 -->
      <nav
        class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
        aria-label="面包屑"
      >
        <RouterLink
          to="/"
          class="transition-colors hover:text-primary-600"
        >
          首页
        </RouterLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
        <RouterLink
          to="/docs/about"
          class="transition-colors hover:text-primary-600"
        >
          文档中心
        </RouterLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3.5"
          aria-hidden="true"
        />
        <span class="line-clamp-1 max-w-xs text-highlighted">{{ title }}</span>
      </nav>

      <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <!-- 左侧导航：桌面固定，移动端横向滚动 -->
        <nav
          class="order-2 -mx-3 overflow-x-auto px-3 lg:order-1 lg:mx-0 lg:overflow-visible lg:px-0"
          aria-label="文档导航"
        >
          <div
            class="flex gap-1.5 lg:flex-col lg:gap-1"
            role="tablist"
            aria-orientation="vertical"
          >
            <RouterLink
              v-for="item in docNav"
              :key="item.slug"
              :to="`/docs/${item.slug}`"
              class="inline-flex shrink-0 items-center gap-2 rounded-card border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:w-full"
              :class="
                activeSlug === item.slug
                  ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300'
                  : 'border-default bg-default text-muted hover:bg-muted hover:text-highlighted'
              "
              :aria-current="activeSlug === item.slug ? 'page' : undefined"
            >
              <UIcon
                :name="item.icon"
                class="size-4 shrink-0"
                aria-hidden="true"
              />
              {{ item.label }}
            </RouterLink>
          </div>
          <div class="mt-4 hidden rounded-card border border-default bg-muted p-3 text-xs leading-5 text-muted lg:block">
            <p class="font-medium text-highlighted">SIT 人工智能学院</p>
            <p class="mt-1">
              科创与就业服务平台文档中心，收录隐私政策、服务条款与使用帮助。
            </p>
          </div>
        </nav>

        <!-- 右侧正文 -->
        <div class="order-1 min-w-0 lg:order-2">
          <div
            v-if="loading"
            class="rounded-card border border-default bg-default p-6"
          >
            <USkeleton class="h-8 w-2/5" />
            <USkeleton class="mt-4 h-4 w-full" />
            <USkeleton class="mt-2 h-4 w-5/6" />
            <USkeleton class="mt-6 h-32 w-full" />
          </div>

          <div
            v-else-if="error"
            class="rounded-card border border-default bg-default p-6 text-center"
          >
            <UIcon
              name="i-lucide-file-warning"
              class="mx-auto size-8 text-muted"
              aria-hidden="true"
            />
            <p class="mt-3 text-sm text-muted">
              {{ error }}
            </p>
            <div class="mt-4 flex justify-center gap-2">
              <UButton
                size="sm"
                color="primary"
                variant="soft"
                @click="load"
              >
                重试
              </UButton>
              <UButton
                to="/docs/about"
                size="sm"
                color="neutral"
                variant="ghost"
              >
                返回文档中心
              </UButton>
            </div>
          </div>

          <article
            v-else-if="data"
            class="rounded-surface border border-default bg-default p-5 sm:p-7"
          >
            <header class="border-b border-default pb-4">
              <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
                <UBadge
                  :label="activeNav?.label ?? data.category"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
                <span
                  v-if="data.version"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-tag"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                  版本 {{ data.version }}
                </span>
                <span
                  v-if="data.updatedAt || data.publishedAt"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-clock-3"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                  更新于 {{ formatCompactDate(data.updatedAt ?? data.publishedAt ?? '') }}
                </span>
              </div>
              <h1 class="mt-3 text-2xl font-bold leading-snug text-highlighted sm:text-3xl">
                {{ data.title }}
              </h1>
              <p
                v-if="data.summary"
                class="mt-2 text-sm leading-6 text-toned"
              >
                {{ data.summary }}
              </p>
            </header>

            <div class="mt-6">
              <RichContent :content="data.bodyMd" />
            </div>

            <footer class="mt-8 border-t border-default pt-4 text-xs leading-5 text-muted">
              <p>
                本文档由 SIT 人工智能学院维护，最新版本以线上发布为准。如有疑问，请通过
                <RouterLink
                  to="/docs/contact"
                  class="text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
                >
                  联系我们
                </RouterLink>
                与我们取得联系。
              </p>
            </footer>
          </article>
        </div>
      </div>
    </PageContainer>
  </section>
</template>
