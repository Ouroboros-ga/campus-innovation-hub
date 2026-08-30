<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { listGuides } from '@/features/ops/api/opsGuideApi'
import type { GuidePublicationState, OpsGuide } from '@/features/ops/guides/types'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'

const router = useRouter()
const guides = ref<OpsGuide[]>([])
const loading = ref(false)
const error = ref('')

const stateMeta: Record<GuidePublicationState, {
  label: string
  color: 'warning' | 'success' | 'neutral'
}> = {
  DRAFT: { label: '草稿', color: 'warning' },
  PUBLISHED: { label: '已发布', color: 'success' },
  ARCHIVED: { label: '已归档', color: 'neutral' }
}

async function loadGuides(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const result = await listGuides({})
    guides.value = result.items
  } catch {
    error.value = '指南列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(loadGuides)

function openCreate(): void {
  void router.push({ name: 'ops-guide-new' })
}

function openEdit(guide: OpsGuide): void {
  void router.push({ name: 'ops-guide-edit', params: { id: guide.id } })
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          指南管理
        </h2>
        <p class="mt-1 text-sm text-muted">
          创建、发布并维护学生端办事与参赛指南。
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        class="self-start sm:self-auto"
        @click="openCreate"
      >
        新建指南
      </UButton>
    </div>

    <div
      v-if="loading"
      class="space-y-3"
      aria-label="正在加载指南"
    >
      <USkeleton class="h-28 w-full rounded-surface" />
      <USkeleton class="h-28 w-full rounded-surface" />
    </div>

    <div
      v-else-if="error"
      class="rounded-surface border border-error/30 bg-error/10 p-4"
      role="alert"
    >
      <p class="text-sm text-error">
        {{ error }}
      </p>
      <UButton
        class="mt-3"
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        @click="loadGuides"
      >
        重新加载
      </UButton>
    </div>

    <ul
      v-else-if="guides.length"
      class="divide-y divide-default overflow-hidden rounded-surface border border-default bg-default"
    >
      <li
        v-for="guide in guides"
        :key="guide.id"
        data-test="guide-row"
        class="p-4 sm:p-5"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted sm:text-base">
                {{ guide.title }}
              </h3>
              <UBadge
                size="sm"
                variant="soft"
                :color="stateMeta[guide.publicationState].color"
              >
                {{ stateMeta[guide.publicationState].label }}
              </UBadge>
              <UBadge
                v-if="guide.isFeatured"
                size="sm"
                variant="outline"
                color="primary"
              >
                精选 #{{ guide.featuredOrder }}
              </UBadge>
            </div>
            <p class="mt-1 text-xs text-muted">
              {{ guideCategoryLabel[guide.category] }}
              <template v-if="guide.updatedAt">
                · 更新于 {{ formatCompactDate(guide.updatedAt) }}
              </template>
              · 关联 {{ guide.competitionIds.length }} 个竞赛
            </p>
            <p
              v-if="guide.summary"
              class="mt-2 line-clamp-2 text-sm text-toned"
            >
              {{ guide.summary }}
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <UButton
              v-if="guide.publicationState === 'PUBLISHED'"
              :to="guide.detailPath"
              size="sm"
              color="neutral"
              variant="soft"
              icon="i-lucide-external-link"
            >
              查看学生端
            </UButton>
            <UButton
              v-if="guide.allowedActions.includes('EDIT')"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              @click="openEdit(guide)"
            >
              编辑
            </UButton>
          </div>
        </div>
      </li>
    </ul>

    <UEmpty
      v-else
      icon="i-lucide-book-open"
      title="暂无指南"
      description="创建第一篇指南，为学生提供清晰、可复用的办事说明。"
      class="rounded-surface border border-default bg-default py-12"
    >
      <template #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          @click="openCreate"
        >
          新建指南
        </UButton>
      </template>
    </UEmpty>
  </div>
</template>
