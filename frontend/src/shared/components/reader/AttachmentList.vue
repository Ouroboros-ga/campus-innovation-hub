<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * 共享附件列表（阅读器方案）。
 *
 * 用于通知 / 活动 / 指南 / 问答等详情的 PDF / Word / 图片附件。
 * - PDF：桌面端可内联预览（<iframe>，浏览器原生查看器），移动端仅下载。
 * - Word / 其他：仅下载（浏览器无法原生渲染 docx，不做内联解析）。
 * - 图片：打开下载，或在新标签页查看。
 */
export interface ReaderAttachment {
  id: string
  name: string
  kind: 'pdf' | 'word' | 'image' | 'other'
  url: string
  /** 字节数；可选。 */
  sizeBytes?: number | null
}

const props = defineProps<{
  attachments: ReaderAttachment[] | null | undefined
}>()

const previewedId = ref<string | null>(null)

const hasAttachments = computed(() => (props.attachments?.length ?? 0) > 0)

const kindIcon: Record<ReaderAttachment['kind'], string> = {
  pdf: 'i-lucide-file-text',
  word: 'i-lucide-file-text',
  image: 'i-lucide-image',
  other: 'i-lucide-file'
}

const kindLabel: Record<ReaderAttachment['kind'], string> = {
  pdf: 'PDF',
  word: 'Word',
  image: '图片',
  other: '文件'
}

function formatSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function togglePreview(id: string, url: string) {
  // 仅 PDF 支持内联预览
  if (previewedId.value === id) {
    previewedId.value = null
  } else if (/\.pdf(\?.*)?$/i.test(url)) {
    previewedId.value = id
  }
}
</script>

<template>
  <div
    v-if="hasAttachments"
    class="space-y-2"
  >
    <div
      v-for="att in attachments"
      :key="att.id"
      class="overflow-hidden rounded-card border border-default"
    >
      <div class="flex items-center gap-3 p-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-subtle text-muted"
          aria-hidden="true"
        >
          <UIcon
            :name="kindIcon[att.kind]"
            class="size-4.5"
          />
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ att.name }}
          </p>
          <p class="mt-0.5 text-xs text-muted">
            {{ kindLabel[att.kind] }}
            <template v-if="formatSize(att.sizeBytes)">
              · {{ formatSize(att.sizeBytes) }}
            </template>
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <UButton
            v-if="att.kind === 'pdf'"
            :aria-label="previewedId === att.id ? '收起预览' : '预览 ' + att.name"
            color="neutral"
            variant="ghost"
            icon="i-lucide-eye"
            size="sm"
            @click="togglePreview(att.id, att.url)"
          />
          <UButton
            :to="att.url"
            download
            :aria-label="'下载 ' + att.name"
            color="neutral"
            variant="ghost"
            icon="i-lucide-download"
            size="sm"
          />
        </div>
      </div>

      <div
        v-if="att.kind === 'pdf' && previewedId === att.id"
        class="border-t border-default"
      >
        <iframe
          :src="att.url"
          :title="att.name"
          class="h-[480px] w-full"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>
