<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  createGuide,
  publishGuide,
  updateGuide as apiUpdateGuide,
  validateGuide,
  type GuideEditorDraft,
  type OpsGuide
} from '../api/opsGuideApi'
import { AppError } from '@/shared/http/types'
import { guideCategoryLabel } from '@/shared/lib/domain-labels'
import type { GuideCategory } from '@/shared/types/homepage'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import { firstFieldErrors } from '@/shared/lib/form-errors'

/** 指南编辑 / 发布（FE-090 /ops/guides）。
 *  结构化字段分组 + 正文所见即所得 + 实时预览（桌面双栏 / 移动 编辑↔预览）。
 */
const props = defineProps<{ open: boolean; guide?: OpsGuide | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const title = ref('')
const category = ref<GuideCategory>('COMPETITION')
const summary = ref('')
const bodyMd = ref('')
const isFeatured = ref(false)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const isEdit = ref(false)

const categoryOptions = (Object.keys(guideCategoryLabel) as GuideCategory[]).map(value => ({
  label: guideCategoryLabel[value],
  value
}))

watch(
  () => props.open,
  open => {
    if (!open) return
    const guide = props.guide
    isEdit.value = Boolean(guide)
    title.value = guide?.title ?? ''
    category.value = guide?.category ?? 'COMPETITION'
    summary.value = guide?.summary ?? ''
    bodyMd.value = guide?.bodyMd ?? ''
    isFeatured.value = guide?.isFeatured ?? false
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

/** 后端字段错误 key（蛇形）→ 前端 errors key（驼峰）。 */
const FIELD_MAP: Record<string, string> = {
  title: 'title',
  category: 'category',
  body_md: 'bodyMd',
  summary: 'summary',
  is_featured: 'isFeatured'
}

async function save(publish = false) {
  const draft: GuideEditorDraft = {
    title: title.value,
    category: category.value,
    summary: summary.value,
    bodyMd: bodyMd.value,
    competitionIds: props.guide?.competitionIds ?? [],
    isFeatured: isFeatured.value,
    featuredOrder: props.guide?.featuredOrder ?? 0
  }
  const formErrors = validateGuide(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    let targetId: string | null = null
    if (isEdit.value && props.guide) {
      const pubState = (props.guide as unknown as { publicationState?: string }).publicationState
      if (pubState && pubState !== 'DRAFT') {
        throw new AppError('已发布内容不可直接修改，请通过草稿编辑后发布。', { status: 409, code: 'CONFLICT' })
      }
      await apiUpdateGuide(props.guide.id, draft)
      targetId = props.guide.id
    } else {
      targetId = (await createGuide(draft)).id
    }
    if (publish && targetId) {
      await publishGuide(targetId)
    }
    const action = publish ? '已发布指南' : isEdit.value ? '已保存草稿' : '已创建草稿'
    toast.add({
      title: action,
      description: publish ? '已发布到站内可见。' : '已保存到服务器（草稿）。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...firstFieldErrors(err.fieldErrors, FIELD_MAP) }
    } else {
      const message = err instanceof AppError ? err.message : '保存失败，请稍后重试。'
      toast.add({
        title: '保存失败',
        description: message,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :ui="{ content: 'max-w-4xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden', header: 'shrink-0 border-b border-default', body: 'flex-1 overflow-y-auto min-h-0 p-4 sm:p-6', footer: 'shrink-0 border-t border-default bg-muted/20' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ isEdit ? '编辑指南' : '发布指南' }}
      </h2>
    </template>

    <template #body>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="() => save(false)"
      >
        <ContentEditorShell preview-title="指南预览">
          <template #form>
            <FormSection
              title="基本信息"
              description="标题、分类与摘要"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="指南标题"
                  name="title"
                  required
                  :error="errors.title"
                >
                  <UInput
                    v-model="title"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="指南分类">
                  <USelect
                    v-model="category"
                    :items="categoryOptions"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="摘要（选填）">
                <UInput
                  v-model="summary"
                  placeholder="一句话概述指南内容"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="精选">
                <UCheckbox
                  v-model="isFeatured"
                  :label="isFeatured ? '在指南区块置顶 / 精选' : '普通指南'"
                />
              </UFormField>
            </FormSection>

            <FormSection
              title="正文"
              description="使用 Markdown 编辑，实时预览渲染效果"
            >
              <UFormField
                label="正文（Markdown）"
                name="bodyMd"
                required
                :error="errors.bodyMd"
              >
                <MarkdownEditor
                  v-model="bodyMd"
                  :height="280"
                />
              </UFormField>
            </FormSection>
          </template>

          <template #preview>
            <p class="text-xs text-muted">
              {{ guideCategoryLabel[category] }}
            </p>
            <h3 class="mt-1 text-lg font-semibold text-highlighted">
              {{ title || '指南标题' }}
            </h3>
            <p
              v-if="summary"
              class="mt-2 text-sm text-muted"
            >
              {{ summary }}
            </p>
            <RichContent :content="bodyMd" />
          </template>
        </ContentEditorShell>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click="close"
        >
          取消
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :loading="submitting"
          @click="save(false)"
        >
          保存草稿
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-send"
          :loading="submitting"
          @click="save(true)"
        >
          保存并发布
        </UButton>
      </div>
    </template>
  </UModal>
</template>
