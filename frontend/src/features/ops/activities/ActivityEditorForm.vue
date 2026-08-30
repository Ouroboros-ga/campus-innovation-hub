<script setup lang="ts">
import { computed } from 'vue'

import { activityTypeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import type { ActivityAnnouncementIntent, ActivityEditorDraft } from './types'

const draft = defineModel<ActivityEditorDraft>({ required: true })
const announcement = defineModel<ActivityAnnouncementIntent>('announcement', { required: true })
withDefaults(defineProps<{ errors?: Record<string, string>; disabled?: boolean; isNew?: boolean }>(), {
  errors: () => ({}), disabled: false, isNew: false
})
const registrationHelp = computed(() => draft.value.registrationRequired ? '设置报名时段和容量；容量不得小于已报名人数。' : '关闭后不会提交报名时间和容量。')
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection title="基本信息" description="标题、类型、地点和封面会直接展示在学生端。">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="活动名称" name="title" required :error="errors.title"><UInput v-model="draft.title" placeholder="如：AI 前沿技术分享会" class="w-full" /></UFormField>
        <UFormField label="活动类型" name="activityType" :error="errors.activityType"><USelect v-model="draft.activityType" :items="activityTypeOptions" class="w-full" /></UFormField>
        <UFormField label="活动地点" name="location" required :error="errors.location"><UInput v-model="draft.location" placeholder="如：信息楼报告厅" class="w-full" /></UFormField>
        <UFormField label="主办方名称" name="organizerName" :error="errors.organizerName"><UInput v-model="draft.organizerName" class="w-full" /></UFormField>
        <UFormField label="主讲人（选填）" name="speaker" :error="errors.speaker"><UInput v-model="draft.speaker" class="w-full" /></UFormField>
        <UFormField label="摘要（选填）" name="summary" :error="errors.summary"><UInput v-model="draft.summary" :maxlength="300" class="w-full" /></UFormField>
      </div>
      <UFormField label="活动封面" name="cover" :error="errors.cover" class="mt-4"><CoverUpload v-model="draft.cover" label="建议 16:9 图片" /></UFormField>
    </FormSection>

    <FormSection title="时间与报名" description="报名逻辑与活动时间独立；关闭报名仍通过单独动作处理。">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="开始时间" name="startAt" required :error="errors.startAt"><UInput v-model="draft.startAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="结束时间" name="endAt" :error="errors.endAt"><UInput v-model="draft.endAt" type="datetime-local" class="w-full" /></UFormField>
      </div>
      <UFormField label="需要报名" name="registrationRequired" :error="errors.registrationRequired" :help="registrationHelp" class="mt-4"><USwitch v-model="draft.registrationRequired" label="学生需报名参加" /></UFormField>
      <div v-if="draft.registrationRequired" class="mt-4 grid gap-4 sm:grid-cols-3">
        <UFormField label="报名开始" name="registrationStartAt" :error="errors.registrationStartAt"><UInput v-model="draft.registrationStartAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="报名截止" name="registrationEndAt" :error="errors.registrationEndAt"><UInput v-model="draft.registrationEndAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="报名容量" name="capacity" :error="errors.capacity"><UInputNumber v-model="draft.capacity" :min="1" class="w-full" /></UFormField>
      </div>
    </FormSection>

    <FormSection title="正文与备注" description="正文使用 Markdown；备注只展示给活动参与者时也请避免包含敏感信息。">
      <UFormField label="活动正文" name="descriptionMd" required :error="errors.descriptionMd"><MarkdownEditor v-model="draft.descriptionMd" :height="440" :disabled="disabled" /></UFormField>
      <UFormField label="补充备注（选填）" name="notesMd" :error="errors.notesMd" class="mt-4"><UTextarea v-model="draft.notesMd" :rows="4" class="w-full" /></UFormField>
    </FormSection>

    <FormSection v-if="isNew" title="关联公告" description="启用后，活动和公告会由服务端在一次事务中创建，避免只创建其中一条。">
      <USwitch v-model="announcement.enabled" label="同时创建活动公告" />
      <div v-if="announcement.enabled" class="mt-4 grid gap-4">
        <UFormField label="公告标题" name="announcementTitle"><UInput v-model="announcement.title" class="w-full" /></UFormField>
        <UFormField label="公告正文" name="announcementBody"><UTextarea v-model="announcement.bodyMd" :rows="4" class="w-full" /></UFormField>
        <UFormField label="公告外链（选填）" name="announcementExternalUrl"><UInput v-model="announcement.externalUrl" placeholder="https://…" class="w-full" /></UFormField>
      </div>
    </FormSection>
  </fieldset>
</template>
