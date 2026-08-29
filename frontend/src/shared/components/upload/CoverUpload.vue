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

async function compressImage(file: File): Promise<File> {
  // 前端预压：最长边 1920，jpeg 0.78，弱网先降体积，服务端仍做权威重编码
  if (file.size < 300 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const longSide = Math.max(width, height)
    const maxSide = 1920
    let w = width, h = height
    if (longSide > maxSide) {
      const scale = maxSide / longSide
      w = Math.round(width * scale)
      h = Math.round(height * scale)
    } else if (file.size < 800 * 1024) {
      bitmap.close?.()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

async function onChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const compressed = await compressImage(file)
    const result = await uploadImage(compressed, 'IMAGE')
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

async function onDrop(event: globalThis.DragEvent): Promise<void> {
  const file = event.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    toast.add({ title: '请拖入图片文件', color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  uploading.value = true
  try {
    const compressed = await compressImage(file)
    const result = await uploadImage(compressed, 'IMAGE')
    emit('update:modelValue', { id: result.id, src: result.url, alt: props.modelValue?.alt ?? '' })
    toast.add({ title: '图片已上传', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: '图片上传失败', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-highlighted">
        {{ label }}
      </span>
      <span class="text-xs text-muted">16:9 · JPG/PNG · ≤5MB</span>
    </div>

    <div
      class="group relative overflow-hidden rounded-xl border-2 border-dashed bg-gradient-to-b from-muted/40 to-muted/20 transition-all"
      :class="uploading ? 'border-primary-300 bg-primary-50/50' : 'border-default hover:border-primary-300 hover:bg-primary-50/30'"
      style="aspect-ratio: 16 / 9"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <template v-if="modelValue?.src">
        <div class="relative h-full w-full">
          <img
            :src="modelValue.src"
            :alt="modelValue.alt"
            class="h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/60 p-3 backdrop-blur-md">
            <span class="truncate text-xs text-white/90">已上传 · 点击更换或移除</span>
            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                color="neutral"
                variant="solid"
                icon="i-lucide-upload"
                :loading="uploading"
                @click="pick"
              >
                更换
              </UButton>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                class="text-white hover:text-white hover:bg-white/20"
                aria-label="移除封面"
                @click="remove"
              >
                移除
              </UButton>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <button
          type="button"
          class="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center transition-colors focus-visible:outline-none"
          :disabled="uploading"
          @click="pick"
        >
          <span class="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950">
            <UIcon
              :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'"
              class="size-6"
              :class="uploading ? 'animate-spin' : ''"
              aria-hidden="true"
            />
          </span>
          <div class="space-y-1">
            <p class="text-sm font-medium text-highlighted">
              {{ uploading ? '上传中…' : '拖动图片至此处，或点击上传' }}
            </p>
            <p class="text-xs text-muted">
              支持拖拽 · 建议 1920×1080 · 自动裁切居中
            </p>
          </div>
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
