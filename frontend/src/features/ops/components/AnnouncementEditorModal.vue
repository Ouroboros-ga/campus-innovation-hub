<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  validateAnnouncement,
  type AnnouncementEditorDraft
} from '../lib/opsStore'
import {
  createAnnouncement,
  publishAnnouncement,
  updateAnnouncement as apiUpdateAnnouncement
} from '../api/opsAnnouncementApi'
import { AppError } from '@/shared/http/types'
import { announcementScopeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import type {
  AnnouncementLinkedKind,
  AnnouncementPublisherScope,
  DynamicsAnnouncement
} from '@/features/dynamics/types'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

/** 公告编辑 / 发布（FE-090 /ops/activities，公告独立表单字段）。
 *  正文所见即所得 + 实时预览（桌面双栏 / 移动 编辑↔预览）。
 */
const props = defineProps<{ open: boolean; announcement?: DynamicsAnnouncement | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const title = ref('')
const publisherScope = ref<AnnouncementPublisherScope>('ACADEMY')
const bodyMd = ref('')
const externalUrl = ref('')
const hasLinked = ref(false)
const linkedKind = ref<string>('ACTIVITY')
const linkedLabel = ref('')
const linkedPath = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const isEdit = ref(false)

const linkedKindOptions: Array<{ label: string; value: string }> = [
  { label: '竞赛', value: 'COMPETITION' },
  { label: '活动', value: 'ACTIVITY' },
  { label: '组织', value: 'ORGANIZATION' },
  { label: '招新', value: 'RECRUITMENT' }
]

watch(
  () => props.open,
  open => {
    if (!open) return
    const announcement = props.announcement
    isEdit.value = Boolean(announcement)
    title.value = announcement?.title ?? ''
    publisherScope.value = announcement?.publisherScope ?? 'ACADEMY'
    bodyMd.value = announcement?.bodyMd ?? ''
    externalUrl.value = announcement?.externalUrl ?? ''
    hasLinked.value = Boolean(announcement?.linkedObject)
    linkedKind.value = announcement?.linkedObject?.kind ?? 'ACTIVITY'
    linkedLabel.value = announcement?.linkedObject?.label ?? ''
    linkedPath.value = announcement?.linkedObject?.to ?? ''
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

/** 后端字段错误 key（蛇形）→ 前端 errors key（驼峰）。 */
const FIELD_MAP: Record<string, string> = {
  title: 'title',
  body_md: 'bodyMd',
  publisher_scope: 'publisherScope',
  external_url: 'externalUrl'
}

function mapFieldErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(fieldErrors)) {
    result[FIELD_MAP[key] ?? key] = value
  }
  return result
}

async function save() {
  const draft: AnnouncementEditorDraft = {
    title: title.value,
    publisherScope: publisherScope.value,
    bodyMd: bodyMd.value,
    linkedObject: hasLinked.value && linkedLabel.value.trim() && linkedPath.value.trim()
      ? { kind: linkedKind.value as AnnouncementLinkedKind, label: linkedLabel.value.trim(), to: linkedPath.value.trim() }
      : null,
    externalUrl: externalUrl.value
  }
  const formErrors = validateAnnouncement(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    if (isEdit.value && props.announcement) {
      await apiUpdateAnnouncement(props.announcement.id, draft)
    } else {
      const id = await createAnnouncement(draft)
      await publishAnnouncement(id)
    }
    toast.add({
      title: isEdit.value ? '已更新公告' : '已发布公告',
      description: '已保存到服务器。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...mapFieldErrors(err.fieldErrors) }
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
    :ui="{ content: 'max-w-4xl' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ isEdit ? '编辑公告' : '发布公告' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="save"
      >
        <ContentEditorShell preview-title="公告预览">
          <template #form>
            <FormSection
              title="发布信息"
              description="标题与发布来源"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="公告标题"
                  name="title"
                  required
                  :error="errors.title"
                >
                  <UInput
                    v-model="title"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="发布来源">
                  <USelect
                    v-model="publisherScope"
                    :items="announcementScopeOptions"
                    class="w-full"
                  />
                </UFormField>
              </div>
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

            <FormSection
              title="关联与链接"
              description="关联核心业务对象或站外原文（选填）"
            >
              <UFormField label="关联对象（选填）">
                <div class="space-y-2">
                  <UCheckbox
                    v-model="hasLinked"
                    label="关联核心业务对象"
                  />
                  <div
                    v-if="hasLinked"
                    class="grid gap-2 sm:grid-cols-3"
                  >
                    <USelect
                      v-model="linkedKind"
                      :items="linkedKindOptions"
                      class="w-full"
                    />
                    <UInput
                      v-model="linkedLabel"
                      placeholder="对象名称"
                      class="w-full"
                    />
                    <UInput
                      v-model="linkedPath"
                      placeholder="对象路径"
                      class="w-full"
                    />
                  </div>
                </div>
              </UFormField>

              <UFormField label="站外原文链接（选填）">
                <UInput
                  v-model="externalUrl"
                  placeholder="https://example.com"
                  class="w-full"
                />
              </UFormField>
            </FormSection>
          </template>

          <template #preview>
            <h3 class="text-lg font-semibold text-highlighted">
              {{ title || '公告标题' }}
            </h3>
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
          color="primary"
          variant="solid"
          icon="i-lucide-send"
          :loading="submitting"
          @click="save"
        >
          发布
        </UButton>
      </div>
    </template>
  </UModal>
</template>
