<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { listOpsDocuments, publishDocument, archiveDocument } from '@/features/documents/api/documentApi'
import type { OpsDocument } from '@/features/documents/api/documentApi'
import { formatCompactDate } from '@/shared/lib/date'

const router = useRouter()
const items = ref<OpsDocument[]>([])
const loading = ref(false)
const error = ref('')
const actionLoading = ref<string | null>(null)

const categoryLabel: Record<string, string> = {
  ABOUT: '关于我们',
  CONTACT: '联系我们',
  HELP: '使用帮助',
  PRIVACY: '隐私政策',
  TERMS: '服务条款',
  OTHER: '其他'
}

const stateLabel: Record<string, { label: string; color: 'neutral' | 'success' | 'warning' }> = {
  DRAFT: { label: '草稿', color: 'neutral' },
  PUBLISHED: { label: '已发布', color: 'success' },
  ARCHIVED: { label: '已归档', color: 'warning' }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listOpsDocuments({})
    items.value = res.items
  } catch {
    error.value = '文档列表加载失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  router.push({ name: 'ops-document-new' })
}

function openEdit(doc: OpsDocument) {
  router.push({ name: 'ops-document-edit', params: { id: doc.id } })
}

async function handlePublish(doc: OpsDocument) {
  if (!doc.allowedActions.includes('PUBLISH')) return
  actionLoading.value = doc.id
  try {
    await publishDocument(doc.id)
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '发布失败'
  } finally {
    actionLoading.value = null
  }
}

async function handleArchive(doc: OpsDocument) {
  if (!doc.allowedActions.includes('ARCHIVE')) return
  actionLoading.value = doc.id
  try {
    await archiveDocument(doc.id)
    await load()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '归档失败'
  } finally {
    actionLoading.value = null
  }
}

const publishedCount = computed(() => items.value.filter(i => i.publicationState === 'PUBLISHED').length)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          文档中心管理
        </h2>
        <p class="mt-1 text-xs text-muted">
          管理“关于我们、联系我们、使用帮助、隐私政策、服务条款” · 已发布 {{ publishedCount }} 篇
        </p>
      </div>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        新建文档
      </UButton>
    </div>

    <div class="rounded-card border border-default bg-muted p-3 text-xs leading-5 text-muted">
      <p class="font-medium text-highlighted">
        使用说明
      </p>
      <ul class="mt-1 list-disc pl-4">
        <li>每个 <code class="rounded bg-default px-1 py-0.5">slug</code> 唯一（如 privacy / terms / about），对应页脚与站内链接。</li>
        <li>草稿与已发布文档可编辑；已发布文档的 slug 保持稳定，保存会立即对学生端生效。</li>
        <li>隐私政策与服务条款建议保持已发布状态，前台在无数据库记录时将自动展示内置版本。</li>
      </ul>
    </div>

    <p
      v-if="loading"
      class="text-sm text-muted"
    >
      正在加载文档…
    </p>
    <p
      v-else-if="error"
      class="text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>

    <ul
      v-else-if="items.length"
      class="space-y-3"
    >
      <li
        v-for="doc in items"
        :key="doc.id"
        class="rounded-xl border border-default bg-default p-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-semibold text-highlighted">
                {{ doc.title }}
              </p>
              <UBadge
                :color="stateLabel[doc.publicationState]?.color ?? 'neutral'"
                variant="soft"
                size="sm"
              >
                {{ stateLabel[doc.publicationState]?.label ?? doc.publicationState }}
              </UBadge>
              <UBadge
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ categoryLabel[doc.category] ?? doc.category }}
              </UBadge>
              <span class="text-xs text-muted">/{{ doc.slug }} · v{{ doc.version }}</span>
            </div>
            <p
              v-if="doc.summary"
              class="mt-1 line-clamp-1 text-xs text-muted"
            >
              {{ doc.summary }}
            </p>
            <p class="mt-1 text-xs text-muted">
              更新于 {{ formatCompactDate(doc.updatedAt ?? doc.publishedAt ?? '') }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span class="text-xs text-muted">ID</span>
            <span class="max-w-[10rem] truncate font-mono text-xs text-muted">{{ doc.id.slice(0, 8) }}…</span>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            :to="`/docs/${doc.slug}`"
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-eye"
            target="_blank"
          >
            预览
          </UButton>
          <UButton
            v-if="doc.allowedActions.includes('EDIT')"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-pencil"
            @click="openEdit(doc)"
          >
            编辑
          </UButton>
          <UButton
            v-if="doc.allowedActions.includes('PUBLISH')"
            size="sm"
            color="primary"
            variant="soft"
            icon="i-lucide-send"
            :loading="actionLoading === doc.id"
            @click="handlePublish(doc)"
          >
            发布
          </UButton>
          <UButton
            v-if="doc.allowedActions.includes('ARCHIVE')"
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-archive"
            :loading="actionLoading === doc.id"
            @click="handleArchive(doc)"
          >
            归档
          </UButton>
        </div>
      </li>
    </ul>

    <UEmpty
      v-else
      icon="i-lucide-files"
      title="暂无文档"
      description="新建“关于我们、隐私政策”等文档，发布后将在前台展示。"
      class="rounded-lg border border-default bg-default py-10"
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          @click="load"
        >
          重新加载
        </UButton>
        <UButton
          color="primary"
          variant="soft"
          icon="i-lucide-plus"
          @click="openCreate"
        >
          新建文档
        </UButton>
      </template>
    </UEmpty>
  </div>
</template>
