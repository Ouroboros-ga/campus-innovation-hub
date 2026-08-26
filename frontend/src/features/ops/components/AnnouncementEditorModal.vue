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
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'

/** 公告编辑 / 发布（FE-090 /ops/activities，公告独立表单字段）。 */
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
    :ui="{ content: 'max-w-2xl' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        发布公告
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="save"
      >
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
