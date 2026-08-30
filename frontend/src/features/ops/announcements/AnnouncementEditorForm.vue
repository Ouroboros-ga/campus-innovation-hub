<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { AnnouncementLinkedKind, AnnouncementPublisherScope } from '@/features/dynamics/types'
import type { AnnouncementEditorDraft, AnnouncementRelation } from './types'

const draft = defineModel<AnnouncementEditorDraft>({ required: true })
withDefaults(defineProps<{ errors?: Record<string, string>; disabled?: boolean }>(), { errors: () => ({}), disabled: false })

const publisherScopes: Array<{ label: string; value: AnnouncementPublisherScope }> = [
  { label: '平台', value: 'PLATFORM' }, { label: '人工智能学院', value: 'ACADEMY' }, { label: '学校', value: 'UNIVERSITY' }
]
const relationKinds: Array<{ label: string; value: AnnouncementLinkedKind }> = [
  { label: '竞赛', value: 'COMPETITION' }, { label: '活动', value: 'ACTIVITY' }, { label: '组织', value: 'ORGANIZATION' }, { label: '招新', value: 'RECRUITMENT' }
]
const relationKind = ref<AnnouncementLinkedKind>(draft.value.relation?.kind ?? 'COMPETITION')
const relationId = ref(draft.value.relation?.id ?? '')
const relationTitle = ref(draft.value.relation?.title ?? '')
const relationPath = ref(draft.value.relation?.path ?? '')
const hasRelation = computed(() => draft.value.relation !== null)

watch(() => draft.value.relation, relation => {
  relationKind.value = relation?.kind ?? 'COMPETITION'
  relationId.value = relation?.id ?? ''
  relationTitle.value = relation?.title ?? ''
  relationPath.value = relation?.path ?? ''
})

function syncRelation(): void {
  if (!relationId.value.trim()) { draft.value.relation = null; return }
  const fallbackPath = relationKind.value === 'COMPETITION' ? `/competitions/${relationId.value.trim()}` : relationKind.value === 'ACTIVITY' ? `/activities/${relationId.value.trim()}` : relationKind.value === 'ORGANIZATION' ? `/organizations/${relationId.value.trim()}` : `/organizations/recruitments/${relationId.value.trim()}`
  const relation: AnnouncementRelation = {
    kind: relationKind.value,
    id: relationId.value.trim(),
    title: relationTitle.value.trim() || '已关联内容',
    path: relationPath.value.trim() || fallbackPath
  }
  draft.value.relation = relation
}

function clearRelation(): void {
  relationId.value = ''; relationTitle.value = ''; relationPath.value = ''; draft.value.relation = null
}
</script>

<template>
  <fieldset class="space-y-6" :disabled="disabled">
    <FormSection title="发布信息" description="标题、摘要与发布主体会直接用于学生端公告列表">
      <UFormField label="公告标题" name="title" required :error="errors.title">
        <UInput v-model="draft.title" placeholder="如：竞赛报名时间调整通知" :maxlength="160" class="w-full" />
      </UFormField>
      <UFormField label="摘要（选填）" name="summary" :error="errors.summary">
        <UTextarea v-model="draft.summary" :rows="3" :maxlength="300" placeholder="一句话说明公告重点" class="w-full" />
      </UFormField>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="发布主体" name="publisherScope" :error="errors.publisherScope">
          <USelect v-model="draft.publisherScope" :items="publisherScopes" class="w-full" />
        </UFormField>
        <UFormField label="信息来源（选填）" name="sourceName" :error="errors.sourceName">
          <UInput v-model="draft.sourceName" placeholder="如：竞赛官网" :maxlength="160" class="w-full" />
        </UFormField>
        <UFormField label="原文链接（选填）" name="externalUrl" :error="errors.externalUrl">
          <UInput v-model="draft.externalUrl" placeholder="https://example.edu/notice" class="w-full" />
        </UFormField>
      </div>
    </FormSection>

    <FormSection title="公告正文" description="Markdown 编辑与学生端预览共用同一份内容">
      <UFormField label="正文（Markdown）" name="bodyMd" required :error="errors.bodyMd">
        <MarkdownEditor v-model="draft.bodyMd" :height="500" :disabled="disabled" />
      </UFormField>
    </FormSection>

    <FormSection title="关联内容" description="可关联一个核心业务对象；保存时会完整保留其类型与标识">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="关联类型" name="relation">
          <USelect v-model="relationKind" :items="relationKinds" class="w-full" @update:model-value="syncRelation" />
        </UFormField>
        <UFormField label="关联对象 ID" name="relation" :error="errors.relation">
          <UInput v-model="relationId" placeholder="输入已存在对象的 UUID" class="w-full" @blur="syncRelation" />
        </UFormField>
        <UFormField label="关联对象标题" name="relation">
          <UInput v-model="relationTitle" placeholder="用于编辑页确认关联内容" class="w-full" @blur="syncRelation" />
        </UFormField>
        <UFormField label="学生端路径（选填）" name="relation">
          <UInput v-model="relationPath" placeholder="留空则按类型生成默认路径" class="w-full" @blur="syncRelation" />
        </UFormField>
      </div>
      <div v-if="hasRelation" class="mt-3 flex items-center justify-between rounded-surface border border-default bg-muted px-3 py-2 text-sm">
        <span>{{ draft.relation?.title }}（{{ draft.relation?.kind }}）</span>
        <UButton type="button" size="xs" color="neutral" variant="ghost" icon="i-lucide-x" @click="clearRelation">移除</UButton>
      </div>
    </FormSection>

    <FormSection title="展示设置" description="置顶与首页推荐影响不同区域，不改变发布状态">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="置顶公告" name="isPinned" :error="errors.isPinned">
          <USwitch v-model="draft.isPinned" label="在公告列表优先展示" />
        </UFormField>
        <UFormField label="首页推荐" name="isHomeFeatured" :error="errors.isHomeFeatured">
          <USwitch v-model="draft.isHomeFeatured" label="在首页公告区展示" />
        </UFormField>
      </div>
    </FormSection>
  </fieldset>
</template>
