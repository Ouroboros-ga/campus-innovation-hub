<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  addAnnouncement,
  validateAnnouncement,
  type AnnouncementEditorDraft
} from '../lib/opsStore'
import { announcementScopeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import type { AnnouncementLinkedKind, AnnouncementPublisherScope } from '@/features/dynamics/types'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

/** 公告编辑 / 发布（FE-090 /ops/activities，公告独立表单字段）。
 *  正文所见即所得 + 实时预览（桌面双栏 / 移动 编辑↔预览）。
 */
const props = defineProps<{ open: boolean }>()
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
    title.value = ''
    publisherScope.value = 'ACADEMY'
    bodyMd.value = ''
    externalUrl.value = ''
    hasLinked.value = false
    linkedKind.value = 'ACTIVITY'
    linkedLabel.value = ''
    linkedPath.value = ''
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

function save() {
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

  addAnnouncement(draft)
  toast.add({
    title: '已发布公告',
    description: '公告已保存（mock）。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  close()
  emit('saved')
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
        发布公告
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
          @click="save"
        >
          发布
        </UButton>
      </div>
    </template>
  </UModal>
</template>
