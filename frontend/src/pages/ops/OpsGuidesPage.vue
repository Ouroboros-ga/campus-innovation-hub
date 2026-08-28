<script setup lang="ts">
import { onMounted, ref } from 'vue'

import GuideEditorModal from '@/features/ops/components/GuideEditorModal.vue'
import { listGuides, type OpsGuide } from '@/features/ops/api/opsGuideApi'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'

/** 指南管理（FE-090 /ops/guides）。 */

const guides = ref<OpsGuide[]>([])
const loading = ref(false)
const error = ref('')

const editorOpen = ref(false)
const editing = ref<OpsGuide | null>(null)

async function loadGuides() {
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

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(guide: OpsGuide) {
  editing.value = guide
  editorOpen.value = true
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
        @click="openCreate"
      >
        新建指南
      </UButton>
    </div>

    <p
      v-if="loading"
      class="text-sm text-muted"
    >
      正在加载指南…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>
    <ul
      v-else-if="guides.length"
      class="space-y-3"
    >
      <li
        v-for="guide in guides"
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
            @click="openEdit(guide)"
          >
            编辑
          </UButton>
          <UTooltip text="敬请期待">
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              disabled
            >
              归档
            </UButton>
          </UTooltip>
        </div>
      </li>
    </ul>

    <UEmpty
      v-else
      icon="i-lucide-book-open"
      title="暂无指南"
      description="尝试调整筛选或重新加载。"
      class="rounded-lg border border-default bg-default py-10"
    >
      <template #actions>
        <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" @click="loadGuides">重新加载</UButton>
        <UButton color="primary" variant="soft" icon="i-lucide-plus" @click="openCreate">新建指南</UButton>
      </template>
    </UEmpty>

    <GuideEditorModal
      :open="editorOpen"
      :guide="editing"
      @update:open="editorOpen = $event"
      @saved="loadGuides"
    />
  </div>
</template>
