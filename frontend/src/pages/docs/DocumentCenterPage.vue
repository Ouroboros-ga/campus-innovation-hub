<script setup lang="ts">
import { onMounted, ref } from 'vue'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { listDocuments } from '@/features/documents/api/documentApi'
import type { SiteDocument } from '@/features/documents/api/documentApi'

const items = ref<SiteDocument[]>([])
const loading = ref(true)
const error = ref('')

const docMeta: Record<string, { icon: string; description: string }> = {
  about: { icon: 'i-lucide-info', description: '了解平台定位、服务范围与运营主体。' },
  contact: { icon: 'i-lucide-mail', description: '获取运营与技术支持的联系方式。' },
  help: { icon: 'i-lucide-circle-help', description: '快速掌握报名、组队与咨询等核心操作。' },
  privacy: { icon: 'i-lucide-shield', description: '了解我们如何收集、使用与保护你的信息。' },
  terms: { icon: 'i-lucide-file-text', description: '使用平台前请阅读服务条款。' }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await listDocuments()
    // 按固定顺序排序：about, help, privacy, terms, contact
    const order = ['about', 'privacy', 'terms', 'help', 'contact']
    items.value.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
  } catch {
    error.value = '文档列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="pb-10 pt-4 sm:pb-14 sm:pt-6">
    <PageContainer>
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
        <span class="text-highlighted">文档中心</span>
      </nav>

      <div class="max-w-3xl">
        <h1 class="text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
          文档中心
        </h1>
        <p class="mt-2 text-sm leading-6 text-muted">
          收录平台的关于我们、联系方式、使用帮助、隐私政策与服务条款。
        </p>
      </div>

      <div
        v-if="loading"
        class="mt-8 grid gap-4 sm:grid-cols-2"
      >
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-28 w-full rounded-card"
        />
      </div>

      <div
        v-else-if="error"
        class="mt-8 rounded-card border border-default bg-default p-8 text-center"
      >
        <p class="text-sm text-muted">
          {{ error }}
        </p>
        <UButton
          class="mt-4"
          size="sm"
          color="neutral"
          variant="soft"
          @click="load"
        >
          重试
        </UButton>
      </div>

      <div
        v-else
        class="mt-8 grid gap-4 sm:grid-cols-2"
      >
        <RouterLink
          v-for="doc in items"
          :key="doc.slug"
          :to="`/docs/${doc.slug}`"
          class="group flex flex-col rounded-card border border-default bg-default p-5 transition-colors hover:border-primary-200 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:hover:border-primary-900 dark:hover:bg-primary-950/40"
        >
          <span
            class="grid size-9 place-items-center rounded-lg bg-muted text-muted group-hover:bg-primary-50 group-hover:text-primary-600 dark:group-hover:bg-primary-950 dark:group-hover:text-primary-400"
            aria-hidden="true"
          >
            <UIcon
              :name="docMeta[doc.slug]?.icon ?? 'i-lucide-file-text'"
              class="size-4.5"
            />
          </span>
          <h2 class="mt-3 text-base font-semibold text-highlighted">
            {{ doc.title }}
          </h2>
          <p class="mt-1 line-clamp-2 text-sm leading-5 text-muted">
            {{ doc.summary ?? docMeta[doc.slug]?.description ?? '' }}
          </p>
          <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:text-primary-700 dark:text-primary-400">
            查看详情
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </RouterLink>
      </div>

      <div class="mt-8 rounded-card border border-default bg-muted p-4 text-xs leading-5 text-muted">
        <p class="font-medium text-highlighted">
          SIT 人工智能学院·科创与就业服务平台
        </p>
        <p class="mt-1">
          文档内容由学院运营维护，版本号与更新时间以详情页为准。如需内容纠错或补充，请通过“联系我们”提交反馈。
        </p>
      </div>
    </PageContainer>
  </section>
</template>
