<script setup lang="ts">
import { computed } from 'vue'

import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import type { GuideCategory } from '@/shared/types/homepage'
import type { GuideCompetitionOption, GuideEditorDraft } from './types'

const draft = defineModel<GuideEditorDraft>({ required: true })

withDefaults(defineProps<{
  errors?: Record<string, string>
  disabled?: boolean
  competitionOptions?: GuideCompetitionOption[]
  competitionOptionsLoading?: boolean
}>(), {
  errors: () => ({}),
  disabled: false,
  competitionOptions: () => [],
  competitionOptionsLoading: false
})

const categoryOptions = (Object.keys(guideCategoryLabel) as GuideCategory[]).map(value => ({
  label: guideCategoryLabel[value],
  value
}))

const featuredHelp = computed(() => draft.value.isFeatured
  ? '精选内容按排序值从小到大展示。'
  : '开启后可设置精选区排序。')
</script>

<template>
  <fieldset
    class="space-y-6"
    :disabled="disabled"
  >
    <FormSection
      title="基本信息"
      description="标题、分类与摘要会直接用于学生端检索和列表展示"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField
          label="指南标题"
          name="title"
          required
          :error="errors.title"
        >
          <UInput
            v-model="draft.title"
            placeholder="如：组队与协作：从找到队友到高效参赛"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="指南分类"
          name="category"
          :error="errors.category"
        >
          <USelect
            v-model="draft.category"
            :items="categoryOptions"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        label="摘要（选填）"
        name="summary"
        :error="errors.summary"
        help="建议在 80 字内说明读者能解决什么问题。"
      >
        <UTextarea
          v-model="draft.summary"
          :rows="3"
          :maxlength="300"
          placeholder="一句话概述指南内容"
          class="w-full"
        />
      </UFormField>
    </FormSection>

    <FormSection
      title="关联内容"
      description="关联竞赛会在竞赛详情与指南详情之间建立入口；保存时完整保留已有关系"
    >
      <UFormField
        label="关联竞赛（选填）"
        name="competitionIds"
        :error="errors.competitionIds"
        :help="competitionOptionsLoading ? '正在加载竞赛…' : '最多选择 20 个竞赛。'"
      >
        <USelect
          v-model="draft.competitionIds"
          :items="competitionOptions"
          :loading="competitionOptionsLoading"
          multiple
          placeholder="选择相关竞赛"
          class="w-full"
        />
      </UFormField>
    </FormSection>

    <FormSection
      title="正文"
      description="Markdown 编辑与学生端预览共用同一份内容"
    >
      <UFormField
        label="正文（Markdown）"
        name="bodyMd"
        required
        :error="errors.bodyMd"
      >
        <MarkdownEditor
          v-model="draft.bodyMd"
          :height="520"
          :disabled="disabled"
        />
      </UFormField>
    </FormSection>

    <FormSection
      title="展示设置"
      description="精选只影响指南推荐区，不改变发布状态"
    >
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <UFormField
          label="精选指南"
          name="isFeatured"
          :error="errors.isFeatured"
          :help="featuredHelp"
        >
          <USwitch
            v-model="draft.isFeatured"
            label="在指南推荐区展示"
          />
        </UFormField>

        <UFormField
          label="精选排序"
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
