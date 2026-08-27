<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { uploadImage } from '@/shared/http/media'
import type { MediaImage } from '@/shared/types/homepage'

/**
 * 封面 / 头图上传（CoverUpload）。
 *
 * 走共享媒体 API（`POST /api/media/upload`，source `docs/api/APIContract.md §3.10`），
 * 产物为 `HomepageImage`（`{ src, alt }`，src 指向已上传媒体 URL），与列表/详情卡片
 * 的 `cover` 字段对齐。上传中显示 loading，失败给出可操作提示，可替换 / 移除。
 */
const props = withDefaults(
  defineProps<{
    modelValue: MediaImage | null
    label?: string
  }>(),
  { label: '封面图' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: MediaImage | null): void
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function pick(): void {
  fileInput.value?.click()
}

function remove(): void {
  emit('update:modelValue', null)
}

function setAlt(value: string): void {
  const current = props.modelValue
  if (!current?.src) return
  emit('update:modelValue', { id: current.id, src: current.src, alt: value })
}

async function onChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await uploadImage(file, 'IMAGE')
    emit('update:modelValue', { id: result.id, src: result.url, alt: props.modelValue?.alt ?? '' })
  } catch {
    toast.add({
      title: '图片上传失败',
      description: '请检查网络后重试，或稍后再试。',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <span class="text-sm font-medium text-highlighted">
      {{ label }}
    </span>

    <div
      class="overflow-hidden rounded-surface border border-default bg-muted/60"
      style="aspect-ratio: 16 / 9"
    >
      <template v-if="modelValue?.src">
        <div class="relative h-full w-full">
          <img
            :src="modelValue.src"
            :alt="modelValue.alt"
            class="h-full w-full object-cover"
          >
          <div class="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/55 p-2 backdrop-blur-sm">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-upload"
              :loading="uploading"
              @click="pick"
            >
              更换
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="移除封面"
              @click="remove"
            >
              移除
            </UButton>
          </div>
        </div>
      </template>

      <template v-else>
        <button
          type="button"
          class="flex h-full w-full flex-col items-center justify-center gap-2 text-muted transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :disabled="uploading"
          @click="pick"
        >
          <UIcon
            :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'"
            class="size-7"
            :class="uploading ? 'animate-spin' : ''"
            aria-hidden="true"
          />
          <span class="text-sm">
            {{ uploading ? '上传中…' : '点击上传封面（16:9）' }}
          </span>
        </button>
      </template>
    </div>

    <UInput
      v-if="modelValue?.src"
      :model-value="modelValue.alt"
      placeholder="图片说明（选填，用于无障碍）"
      @update:model-value="setAlt"
    />

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      aria-hidden="true"
      tabindex="-1"
      @change="onChange"
    >
  </div>
</template>
