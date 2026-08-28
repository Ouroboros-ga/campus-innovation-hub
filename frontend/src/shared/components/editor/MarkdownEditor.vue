<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
// 将 Vditor 自带的简体中文语言包打进本地 bundle，运行时不再从 unpkg 拉取 i18n（该 CDN 路径在部分环境 404）。
import 'vditor/dist/js/i18n/zh_CN.js'

import { useToast } from '@nuxt/ui/composables'

import { uploadImage } from '@/shared/http/media'

/**
 * 共享 Markdown 文本编辑器（Vditor 封装）。
 *
 * 用于任何需要编辑文本的场景（平台运营发布公告/动态、咨询回复、学生组队/招新发布等）。
 * - 所见即所得（wysiwyg）编辑，产出的值始终是 Markdown（与后端 *_md 字段及 RichContent 阅读器对齐）；
 * - 支持插入图片（读文件转 base64，客户端可靠，生产可换真实上传端点）、超链接（Vditor 内置 link）；
 * - 支持导入 .md / .markdown 文件（覆盖式载入编辑）；
 * - 自动随应用暗色模式切换主题。
 * 字号以 heading 等级表达（Markdown 语义），不追求 Word 级任意 px 字号。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    height?: number
    disabled?: boolean
  }>(),
  { placeholder: '请输入内容…', height: 360, disabled: false }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const toast = useToast()
const el = ref<HTMLDivElement | null>(null)
const markdownFile = ref<HTMLInputElement | null>(null)
const imageFile = ref<HTMLInputElement | null>(null)
let editor: Vditor | null = null
let themeObserver: MutationObserver | null = null
/** 当 Vditor 初始化失败（如异常 / happy-dom 测试环境，其异步加载 CDN 脚本会失败）时回退为原生 textarea。 */
const fallback = ref(import.meta.env.MODE === 'test')

const TOOLBAR: string[] = [
  'undo',
  'redo',
  '|',
  'headings',
  'bold',
  'italic',
  'strike',
  'underline',
  '|',
  'list',
  'ordered-list',
  'outdent',
  'indent',
  '|',
  'link',
  'quote',
  'code',
  'inline-code',
  'table',
  'check',
  '|',
  'edit-mode'
]

function isDark(): boolean {
  return typeof document !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : false
}

function applyTheme(): void {
  editor?.setTheme(isDark() ? 'dark' : 'classic')
}

function onEditorInput(value: string): void {
  emit('update:modelValue', value)
}

function onImportMarkdownClick(): void {
  markdownFile.value?.click()
}

function onImportMarkdownChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && editor) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      editor?.setValue(text)
      emit('update:modelValue', text)
    }
    reader.readAsText(file)
  }
  input.value = ''
}

function onInsertImageClick(): void {
  imageFile.value?.click()
}

function insertMarkdownImage(url: string): void {
  if (!editor) return
  editor.insertValue(`![](${url})`)
  emit('update:modelValue', editor.getValue() ?? '')
}

async function onInsertImageChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && editor) {
    try {
      const result = await uploadImage(file, 'IMAGE')
      insertMarkdownImage(result.url)
    } catch (err) {
      const message = err instanceof Error ? err.message : '图片上传失败，请检查网络或文件大小后重试。'
      toast.add({
        title: '图片上传失败',
        description: message,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
  }
  input.value = ''
}

onMounted(() => {
  if (!el.value) return
  try {
    editor = new Vditor(el.value, {
      mode: 'wysiwyg',
      value: props.modelValue ?? '',
      height: props.height,
      placeholder: props.placeholder,
      cache: { enable: false },
      theme: isDark() ? 'dark' : 'classic',
      counter: { enable: true },
      // 使用本地打包的中文语言包，避免运行时从 CDN 加载 i18n 造成 404。
      lang: 'zh_CN',
      i18n: window.VditorI18n,
      toolbar: TOOLBAR,
      input: onEditorInput
    })

    // 随应用暗色模式切换 Vditor 主题
    themeObserver = new MutationObserver(() => applyTheme())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  } catch {
    fallback.value = true
  }
})

watch(
  () => props.modelValue,
  value => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value ?? '')
    }
  }
)

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  editor?.destroy()
  editor = null
})
</script>

<template>
  <div class="markdown-editor">
    <UTextarea
      v-if="fallback"
      :model-value="modelValue"
      :rows="8"
      :placeholder="placeholder"
      class="w-full"
      @update:model-value="v => emit('update:modelValue', v as string)"
    />

    <template v-else>
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-upload"
          aria-label="插入图片"
          :disabled="disabled"
          @click="onInsertImageClick"
        >
          插入图片
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-file-up"
          aria-label="导入 Markdown 文件"
          :disabled="disabled"
          @click="onImportMarkdownClick"
        >
          导入 Markdown
        </UButton>
        <span class="text-xs text-muted">
          支持 Markdown，可插入图片 / 链接
        </span>
      </div>

      <div
        ref="el"
        class="vditor-host"
      />

      <input
        ref="markdownFile"
        type="file"
        accept=".md,.markdown,.txt"
        class="hidden"
        aria-hidden="true"
        tabindex="-1"
        @change="onImportMarkdownChange"
      >
      <input
        ref="imageFile"
        type="file"
        accept="image/*"
        class="hidden"
        aria-hidden="true"
        tabindex="-1"
        @change="onInsertImageChange"
      >
    </template>
  </div>
</template>

<style scoped>
.markdown-editor :deep(.vditor-host) {
  width: 100%;
}
.markdown-editor :deep(.vditor) {
  border-radius: 0.625rem;
}
</style>
