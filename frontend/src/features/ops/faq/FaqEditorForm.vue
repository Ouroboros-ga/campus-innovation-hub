<script setup lang="ts">
import { computed } from 'vue'

import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import type { GuideCategory } from '@/shared/types/homepage'
import type { FaqEditorDraft } from './types'

const draft = defineModel<FaqEditorDraft>({ required: true })

withDefaults(defineProps<{
  errors?: Record<string, string>
  disabled?: boolean
}>(), {
  errors: () => ({}),
  disabled: false
})

const categoryOptions = (Object.keys(guideCategoryLabel) as GuideCategory[]).map(value => ({
  label: guideCategoryLabel[value],
  value
}))
const featuredHelp = computed(() => draft.value.isFeatured
  ? '推荐内容按推荐排序从小到大展示。'
  : '开启后可设置首页 FAQ 推荐顺序。')
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection
      title="基本信息"
      description="问题与分类会用于学生端检索和 FAQ 列表展示"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="分类" name="category" :error="errors.category">
          <USelect v-model="draft.category" :items="categoryOptions" class="w-full" />
        </UFormField>
        <UFormField
          label="列表排序"
          name="sortOrder"
          :error="errors.sortOrder"
          help="数字越小越靠前"
        >
          <UInputNumber v-model="draft.sortOrder" :min="0" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="问题" name="question" required :error="errors.question">
        <UInput
          v-model="draft.question"
          placeholder="如：报名流程是什么？"
          :maxlength="300"
          class="w-full"
        />
      </UFormField>
    </FormSection>

    <FormSection title="答案" description="Markdown 编辑与学生端预览共用同一份内容">
      <UFormField label="答案（Markdown）" name="answerMd" required :error="errors.answerMd">
        <MarkdownEditor v-model="draft.answerMd" :height="460" :disabled="disabled" />
      </UFormField>
    </FormSection>

    <FormSection title="展示设置" description="推荐只影响首页展示，不改变发布状态">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <UFormField
          label="首页推荐"
          name="isFeatured"
          :error="errors.isFeatured"
          :help="featuredHelp"
        >
          <USwitch v-model="draft.isFeatured" label="在首页 FAQ 区展示" />
        </UFormField>
        <UFormField
          label="推荐排序"
          name="featuredOrder"
          :error="errors.featuredOrder"
          help="数字越小越靠前"
        >
          <UInputNumber
            v-model="draft.featuredOrder"
            :min="0"
            :disabled="!draft.isFeatured"
            class="w-full"
          />
        </UFormField>
      </div>
    </FormSection>
  </fieldset>
</template>
