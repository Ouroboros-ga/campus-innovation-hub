<script setup lang="ts">
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import { competitionCategoryLabel, competitionLevelLabel, participationModeLabel } from '@/shared/lib/domain-labels'
import type { CompetitionCategory, CompetitionLevel, ParticipationMode } from '@/shared/types/homepage'
import type { CompetitionEditorDraft, CompetitionTimelineEvent } from './types'

const draft = defineModel<CompetitionEditorDraft>({ required: true })

withDefaults(defineProps<{
  errors?: Record<string, string>
  disabled?: boolean
  timeline?: CompetitionTimelineEvent[]
}>(), { errors: () => ({}), disabled: false, timeline: () => [] })

const categoryOptions = (Object.keys(competitionCategoryLabel) as CompetitionCategory[])
  .map(value => ({ label: competitionCategoryLabel[value], value }))
const levelOptions = (Object.keys(competitionLevelLabel) as CompetitionLevel[])
  .map(value => ({ label: competitionLevelLabel[value], value }))
const participationOptions = (Object.keys(participationModeLabel) as ParticipationMode[])
  .map(value => ({ label: participationModeLabel[value], value }))
const gradeOptions = [
  { label: '不限', value: null }, { label: '一年级', value: 1 },
  { label: '二年级', value: 2 }, { label: '三年级', value: 3 }, { label: '四年级', value: 4 }
]
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection title="基本信息" description="名称、届次、分类与封面会用于学生端检索和列表展示。">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="竞赛名称" name="name" required :error="errors.name">
          <UInput v-model="draft.name" placeholder="如：蓝桥杯全国软件和信息技术专业人才大赛" class="w-full" />
        </UFormField>
        <UFormField label="竞赛届次" name="edition" required :error="errors.edition">
          <UInput v-model="draft.edition" placeholder="如：第十七届" class="w-full" />
        </UFormField>
        <UFormField label="竞赛分类" name="category" :error="errors.category">
          <USelect v-model="draft.category" :items="categoryOptions" class="w-full" />
        </UFormField>
        <UFormField label="竞赛级别" name="level" :error="errors.level">
          <USelect v-model="draft.level" :items="levelOptions" class="w-full" />
        </UFormField>
        <UFormField label="参赛形式" name="participationMode" :error="errors.participationMode">
          <USelect v-model="draft.participationMode" :items="participationOptions" class="w-full" />
        </UFormField>
        <UFormField label="校内统一组织" name="collegeOrganized" :error="errors.collegeOrganized">
          <USwitch v-model="draft.collegeOrganized" label="由学院统一组织报名或指导" />
        </UFormField>
      </div>
      <UFormField label="竞赛封面" name="cover" :error="errors.cover" class="mt-4">
        <CoverUpload v-model="draft.cover" label="建议 16:9 图片" />
      </UFormField>
      <UFormField label="摘要（选填）" name="summary" :error="errors.summary" class="mt-4">
        <UTextarea v-model="draft.summary" :rows="3" :maxlength="300" placeholder="一句话说明竞赛价值和适合的人群" class="w-full" />
      </UFormField>
    </FormSection>

    <FormSection title="时间与链接" description="填写真实日期；学生端会据此计算报名和赛事状态。">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="报名开始" name="registrationStartAt" :error="errors.registrationStartAt"><UInput v-model="draft.registrationStartAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="报名截止" name="registrationEndAt" :error="errors.registrationEndAt"><UInput v-model="draft.registrationEndAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="赛事开始" name="eventStartAt" :error="errors.eventStartAt"><UInput v-model="draft.eventStartAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="赛事结束" name="eventEndAt" :error="errors.eventEndAt"><UInput v-model="draft.eventEndAt" type="datetime-local" class="w-full" /></UFormField>
        <UFormField label="官方网站" name="officialUrl" :error="errors.officialUrl"><UInput v-model="draft.officialUrl" placeholder="https://…" class="w-full" /></UFormField>
        <UFormField label="报名链接" name="registrationUrl" :error="errors.registrationUrl"><UInput v-model="draft.registrationUrl" placeholder="https://…" class="w-full" /></UFormField>
        <UFormField label="官方通知链接" name="officialNoticeUrl" :error="errors.officialNoticeUrl"><UInput v-model="draft.officialNoticeUrl" placeholder="https://…" class="w-full" /></UFormField>
        <UFormField label="分类标签" name="direction" :error="errors.direction" help="多个标签请用顿号或逗号分隔，最多 10 个。"><UInput v-model="draft.direction" placeholder="人工智能、程序设计" class="w-full" /></UFormField>
      </div>
    </FormSection>

    <FormSection title="正文与参与建议" description="Markdown 正文将直接在竞赛详情展示。">
      <UFormField label="竞赛介绍" name="descriptionMd" required :error="errors.descriptionMd">
        <MarkdownEditor v-model="draft.descriptionMd" :height="440" :disabled="disabled" />
      </UFormField>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <UFormField label="适合人群说明" name="suitableForMd" :error="errors.suitableForMd"><UTextarea v-model="draft.suitableForMd" :rows="5" class="w-full" /></UFormField>
        <UFormField label="备赛建议" name="preparationAdviceMd" :error="errors.preparationAdviceMd"><UTextarea v-model="draft.preparationAdviceMd" :rows="5" class="w-full" /></UFormField>
      </div>
    </FormSection>

    <FormSection title="面向年级与联系人" description="年级上下限需同时填写；联系人仅在需要校内协助时展示。">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="适合年级下限" name="suitableGradeMin" :error="errors.suitableGradeMin"><USelect v-model="draft.suitableGradeMin" :items="gradeOptions" class="w-full" /></UFormField>
        <UFormField label="适合年级上限" name="suitableGradeMax" :error="errors.suitableGradeMax"><USelect v-model="draft.suitableGradeMax" :items="gradeOptions" class="w-full" /></UFormField>
        <UFormField label="校内联系人" name="collegeContactName" :error="errors.collegeContactName"><UInput v-model="draft.collegeContactName" class="w-full" /></UFormField>
        <UFormField label="联系方式" name="collegeContactText" :error="errors.collegeContactText"><UInput v-model="draft.collegeContactText" class="w-full" /></UFormField>
      </div>
    </FormSection>

    <FormSection title="关键时间线" description="时间线独立保存，已有节点不会因为保存基本信息而丢失。">
      <p v-if="!timeline.length" class="text-sm text-muted">保存竞赛后可在此管理阶段节点；当前尚无节点。</p>
      <ol v-else class="space-y-2">
        <li v-for="item in timeline" :key="item.id" class="rounded-surface border border-default px-3 py-2 text-sm">
          <p class="font-medium text-highlighted">{{ item.title }}</p>
          <p class="mt-1 text-xs text-muted">{{ item.eventAt }}{{ item.endAt ? ` 至 ${item.endAt}` : '' }}</p>
        </li>
      </ol>
    </FormSection>
  </fieldset>
</template>
