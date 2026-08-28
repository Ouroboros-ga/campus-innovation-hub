<script setup lang="ts">
import { ref } from 'vue'

import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import type { MediaImage } from '@/shared/types/homepage'

const props = defineProps<{
  label: string
  field: string
  type: 'markdown' | 'image' | 'select' | 'text'
  // 预览值
  modelValue?: string | MediaImage | null
  // select 选项
  options?: Array<{ label: string; value: string }>
  // 文本占位
  placeholder?: string
  // 是否可编辑（权限）
  editable?: boolean
}>()
const emit = defineEmits<{ (e: 'save', value: string | MediaImage | null, field: string): void }>()

const open = ref(false)
const draftText = ref('')
const draftImage = ref<MediaImage | null>(null)
const draftSelect = ref('')

function onClick() {
  if (props.editable === false) return
  if (props.type === 'markdown' || props.type === 'text') {
    draftText.value = (props.modelValue as string) ?? ''
  } else if (props.type === 'image') {
    draftImage.value = (props.modelValue as MediaImage | null) ?? null
  } else if (props.type === 'select') {
    draftSelect.value = (props.modelValue as string) ?? ''
  }
  open.value = true
}

function onSave() {
  if (props.type === 'markdown' || props.type === 'text') emit('save', draftText.value, props.field)
  else if (props.type === 'image') emit('save', draftImage.value, props.field)
  else if (props.type === 'select') emit('save', draftSelect.value, props.field)
  open.value = false
}
</script>

<template>
  <div
    :data-editor-field="field"
    class="group relative rounded-sm"
    :class="editable!==false ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-primary-400 focus-within:outline focus-within:outline-1 focus-within:outline-primary-500' : ''"
    tabindex="editable!==false ? 0 : -1"
    role="button"
    :aria-label="editable!==false ? `编辑${label}` : undefined"
    @click="onClick"
    @keydown.enter.prevent="onClick"
  >
    <slot />
    <span
      v-if="editable!==false"
      class="pointer-events-none absolute right-1 top-1 hidden items-center gap-1 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] leading-none text-white shadow group-hover:flex"
    >
      <UIcon name="i-lucide-pencil" class="size-3" /> {{ label }}
    </span>

    <UModal v-model:open="open" :title="`编辑${label}`" :ui="{ content: 'sm:max-w-[640px]' }">
      <template #body>
        <div class="space-y-3">
          <MarkdownEditor
            v-if="type==='markdown'"
            v-model="draftText"
            :height="260"
          />
          <UTextarea
            v-else-if="type==='text'"
            v-model="draftText"
            :rows="4"
            :placeholder="placeholder"
          />
          <CoverUpload
            v-else-if="type==='image'"
            v-model="draftImage"
            :label="label"
          />
          <USelect
            v-else-if="type==='select'"
            v-model="draftSelect"
            :items="options"
            class="w-full"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="open=false">取消</UButton>
          <UButton @click="onSave">保存</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
