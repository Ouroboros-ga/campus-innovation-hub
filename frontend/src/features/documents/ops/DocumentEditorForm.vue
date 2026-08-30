<script setup lang="ts">
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import {
  documentCategoryLabel,
  type DocumentCategory,
  type DocumentEditorDraft
} from './types'

const draft = defineModel<DocumentEditorDraft>({ required: true })
const props = withDefaults(defineProps<{
  errors?: Record<string, string>
  disabled?: boolean
  slugDisabled?: boolean
  isNew?: boolean
}>(), {
  errors: () => ({}),
  disabled: false,
  slugDisabled: false,
  isNew: false
})

const categoryOptions = (Object.keys(documentCategoryLabel) as DocumentCategory[]).map(value => ({
  label: documentCategoryLabel[value],
  value
}))
const presetSlugs: Record<DocumentCategory, string> = {
  ABOUT: 'about',
  CONTACT: 'contact',
  HELP: 'help',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  OTHER: ''
}

function onCategoryChange(value: DocumentCategory): void {
  if (props.isNew && !draft.value.slug) draft.value.slug = presetSlugs[value]
}
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection
      title="基本信息"
      description="文档标识对应公开 URL；已发布文档的标识不可修改"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="文档标识（slug）"
          name="slug"
          required
          :error="errors.slug"
          :help="slugDisabled ? '文档已发布，标识不可修改。' : '仅允许小写字母、数字与连字符。'"
        >
          <UInput
            v-model="draft.slug"
            placeholder="如 privacy"
            :disabled="slugDisabled"
            class="w-full"
          />
        </UFormField>
        <UFormField label="分类" name="category" :error="errors.category">
          <USelect
            v-model="draft.category"
            :items="categoryOptions"
            class="w-full"
            @update:model-value="onCategoryChange"
          />
        </UFormField>
      </div>

      <UFormField label="文档标题" name="title" required :error="errors.title">
        <UInput v-model="draft.title" placeholder="如：隐私政策" :maxlength="160" class="w-full" />
      </UFormField>

      <UFormField label="摘要（选填）" name="summary" :error="errors.summary">
        <UTextarea v-model="draft.summary" :rows="3" :maxlength="300" placeholder="一句话概述文档" class="w-full" />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="版本号" name="version" :error="errors.version" help="如 1.0 / 2026-08">
          <UInput v-model="draft.version" placeholder="1.0" :maxlength="20" class="w-full" />
        </UFormField>
        <UFormField label="列表排序" name="sortOrder" :error="errors.sortOrder" help="数字越小越靠前">
          <UInputNumber v-model="draft.sortOrder" :min="0" class="w-full" />
        </UFormField>
      </div>
    </FormSection>

    <FormSection title="正文" description="Markdown 编辑与学生端预览共用同一份内容">
      <UFormField label="正文（Markdown）" name="bodyMd" required :error="errors.bodyMd">
        <MarkdownEditor v-model="draft.bodyMd" :height="500" :disabled="disabled" />
      </UFormField>
    </FormSection>
  </fieldset>
</template>
