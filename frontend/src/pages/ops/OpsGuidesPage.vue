<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import GuideEditorModal from '@/features/ops/components/GuideEditorModal.vue'
import { listGuides, type OpsGuide } from '@/features/ops/api/opsGuideApi'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import { formatCompactDate } from '@/shared/lib/date'

/** 指南管理（FE-090 /ops/guides）。 */
const toast = useToast()

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

function notifyArchive(guide: OpsGuide) {
  toast.add({
    title: '归档指南',
    description: `「${guide.title}」的归档操作待接入（当前未实施）。`,
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
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-archive"
            @click="notifyArchive(guide)"
          >
            归档
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无指南。
    </p>

    <GuideEditorModal
      :open="editorOpen"
      :guide="editing"
      @update:open="editorOpen = $event"
      @saved="loadGuides"
    />
  </div>
</template>
