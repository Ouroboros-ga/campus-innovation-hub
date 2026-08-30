<script setup lang="ts">
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { RecruitmentEditorDraft, RecruitmentPositionDraft } from './types'

const draft = defineModel<RecruitmentEditorDraft>({ required: true })
withDefaults(defineProps<{ errors?: Record<string, string>; disabled?: boolean }>(), { errors: () => ({}), disabled: false })
const grades = [{ label: '不限', value: null }, { label: '一年级', value: 1 }, { label: '二年级', value: 2 }, { label: '三年级', value: 3 }, { label: '四年级', value: 4 }]
function addPosition(): void { draft.value.positions.push({ name: '', headcount: 1, descriptionMd: '', requirementsMd: '' }) }
function removePosition(index: number): void { draft.value.positions.splice(index, 1) }
function positionKey(position: RecruitmentPositionDraft, index: number): string { return position.id ?? `new-${index}` }
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection title="基本信息" description="招新标题、窗口和对象会直接展示给学生。">
      <UFormField label="招新标题" name="title" required :error="errors.title"><UInput v-model="draft.title" data-test="recruitment-title" placeholder="如：人工智能协会 2026 秋季招新" class="w-full" /></UFormField>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <UFormField label="申请开始" name="applyStartAt" :error="errors.applyStartAt"><UInput v-model="draft.applyStartAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="申请截止" name="applyEndAt" required :error="errors.applyEndAt"><UInput v-model="draft.applyEndAt" data-test="recruitment-apply-end" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="目标年级下限" name="targetGradeMin" :error="errors.targetGradeMin"><USelect v-model="draft.targetGradeMin" :items="grades" class="w-full" /></UFormField>
        <UFormField label="目标年级上限" name="targetGradeMax" :error="errors.targetGradeMax"><USelect v-model="draft.targetGradeMax" :items="grades" class="w-full" /></UFormField>
      </div>
    </FormSection>
    <FormSection title="招新介绍" description="用 Markdown 说明组织、岗位和申请期望。">
      <UFormField label="介绍正文" name="introMd" required :error="errors.introMd"><MarkdownEditor v-model="draft.introMd" :height="420" :disabled="disabled" /></UFormField>
      <UFormField label="补充说明" name="notesMd" :error="errors.notesMd" class="mt-4"><UTextarea v-model="draft.notesMd" :rows="4" class="w-full" /></UFormField>
    </FormSection>
    <FormSection title="岗位设置" description="岗位数组会完整回填并保存；已有申请的岗位删除会由服务端拒绝。">
      <p v-if="errors.positions" class="mb-3 text-sm text-error">{{ errors.positions }}</p>
      <div class="space-y-4">
        <div v-for="(position, index) in draft.positions" :key="positionKey(position, index)" class="rounded-surface border border-default p-4">
          <div class="flex items-center justify-between gap-3"><h3 class="text-sm font-semibold text-highlighted">岗位 {{ index + 1 }}</h3><UButton type="button" color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" :disabled="draft.positions.length === 1" @click="removePosition(index)">移除</UButton></div>
          <div class="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]"><UFormField label="岗位名称"><UInput v-model="position.name" data-test="recruitment-position-name" class="w-full" /></UFormField><UFormField label="招募人数"><UInputNumber v-model="position.headcount" :min="1" class="w-full" /></UFormField></div>
          <div class="mt-3 grid gap-4 sm:grid-cols-2"><UFormField label="岗位说明"><UTextarea v-model="position.descriptionMd" :rows="3" class="w-full" /></UFormField><UFormField label="岗位要求"><UTextarea v-model="position.requirementsMd" :rows="3" class="w-full" /></UFormField></div>
        </div>
      </div>
      <UButton type="button" color="neutral" variant="outline" icon="i-lucide-plus" class="mt-4" @click="addPosition">添加岗位</UButton>
    </FormSection>
  </fieldset>
</template>
