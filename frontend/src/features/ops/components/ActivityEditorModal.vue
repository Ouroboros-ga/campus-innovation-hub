<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  addActivity,
  addAnnouncement,
  updateActivity,
  validateActivity,
  type ActivityEditorDraft
} from '../lib/opsStore'
import { activityTypeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import type { DynamicsActivity } from '@/features/dynamics/types'
import type { ActivityType } from '@/shared/types/homepage'

/** 活动编辑 / 发布（FE-090 /ops/activities）。 */
const props = defineProps<{
  open: boolean
  activity?: DynamicsActivity | null
  /** 同步发布关联公告（发布活动并生成公告）。 */
  syncAnnouncement?: boolean
}>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const title = ref('')
const activityType = ref<ActivityType>('TECH_SHARING')
const startAt = ref('')
const endAt = ref('')
const location = ref('')
const organizerName = ref('')
const registrationRequired = ref(false)
const registrationEndAt = ref('')
const capacity = ref<number | null>(null)
const descriptionMd = ref('')
const errors = ref<Record<string, string>>({})

const isEdit = computed(() => Boolean(props.activity))

watch(
  () => props.open,
  open => {
    if (!open) return
    const activity = props.activity
    title.value = activity?.title ?? ''
    activityType.value = activity?.activityType ?? 'TECH_SHARING'
    startAt.value = activity?.startAt?.slice(0, 16) ?? ''
    endAt.value = activity?.endAt?.slice(0, 16) ?? ''
    location.value = activity?.location ?? ''
    organizerName.value = activity?.organizerName ?? ''
    registrationRequired.value = activity?.registrationRequired ?? false
    registrationEndAt.value = activity?.registrationEndAt?.slice(0, 16) ?? ''
    capacity.value = activity?.capacity ?? null
    descriptionMd.value = activity?.descriptionMd ?? ''
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

function save() {
  const draft: ActivityEditorDraft = {
    title: title.value,
    activityType: activityType.value,
    startAt: startAt.value,
    endAt: endAt.value,
    location: location.value,
    organizerName: organizerName.value,
    registrationRequired: registrationRequired.value,
    registrationEndAt: registrationEndAt.value,
    capacity: capacity.value,
    descriptionMd: descriptionMd.value
  }
  const formErrors = validateActivity(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  let created: DynamicsActivity | null = null
  if (isEdit.value && props.activity) {
    updateActivity(props.activity.id, draft)
  } else {
    created = addActivity(draft)
  }

  if (created && props.syncAnnouncement) {
    addAnnouncement({
      title: `${title.value.trim()} 报名开启`,
      publisherScope: 'ACADEMY',
      bodyMd: `「${title.value.trim()}」活动详情与报名方式见活动页。`,
      linkedObject: { kind: 'ACTIVITY', label: title.value.trim(), to: created.detailPath },
      externalUrl: ''
    })
  }

  toast.add({
    title: isEdit.value ? '已更新活动' : '已发布活动',
    description: props.syncAnnouncement ? '活动与关联公告已同步发布。' : '已保存（mock）。',
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
        {{ isEdit ? '编辑活动' : '发布活动' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="save"
      >
        <UFormField
          label="活动名称"
          name="title"
          required
          :error="errors.title"
        >
          <UInput
            v-model="title"
            class="w-full"
          />
        </UFormField>

        <UFormField label="活动类型">
          <USelect
            v-model="activityType"
            :items="activityTypeOptions"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="开始时间"
            name="startAt"
            required
            :error="errors.startAt"
          >
            <UInput
              v-model="startAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
          <UFormField label="结束时间">
            <UInput
              v-model="endAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="地点">
            <UInput
              v-model="location"
              class="w-full"
            />
          </UFormField>
          <UFormField label="主办组织">
            <UInput
              v-model="organizerName"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="需要报名">
          <UCheckbox
            v-model="registrationRequired"
            :label="registrationRequired ? '需要报名' : '无需报名'"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="报名截止">
            <UInput
              v-model="registrationEndAt"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
          <UFormField label="人数限制（选填）">
            <UInputNumber
              v-model="capacity"
              :min="1"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="活动介绍">
          <MarkdownEditor
            v-model="descriptionMd"
            :height="260"
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
          icon="i-lucide-save"
          @click="save"
        >
          保存
        </UButton>
      </div>
    </template>
  </UModal>
</template>
