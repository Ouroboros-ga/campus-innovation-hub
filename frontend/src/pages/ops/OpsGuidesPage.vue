<script setup lang="ts">
import { useToast } from '@nuxt/ui/composables'

import { consultGuides } from '@/mocks/fixtures/consultation'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'

/** 指南管理（FE-090 /ops/guides）。 */
const toast = useToast()

function notify(title: string) {
  toast.add({
    title,
    description: '演示环境（mock）。',
    color: 'neutral',
    icon: 'i-lucide-info'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-highlighted">
        指南管理
      </h2>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="notify('新建指南')"
      >
        新建指南
      </UButton>
    </div>

    <ul class="space-y-3">
      <li
        v-for="guide in consultGuides"
        :key="guide.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ guide.title }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ guideCategoryLabel[guide.category] }} ·
              更新于 {{ formatCompactDate(guide.publishedAt) }}
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            color="success"
          >
            已发布
          </UBadge>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            :to="guide.detailPath"
            size="sm"
            color="neutral"
            variant="soft"
          >
            查看
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-pencil"
            @click="notify('编辑指南')"
          >
            编辑
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-archive"
            @click="notify('归档指南')"
          >
            归档
          </UButton>
        </div>
      </li>
    </ul>
  </div>
</template>
