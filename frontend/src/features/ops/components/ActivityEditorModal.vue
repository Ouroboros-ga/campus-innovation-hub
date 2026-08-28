<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  validateActivity,
  type ActivityEditorDraft
} from '../lib/opsStore'
import {
  createActivity,
  createActivityWithAnnouncement,
  publishActivity,
  updateActivity as apiUpdateActivity
} from '../api/opsActivityApi'
import { AppError } from '@/shared/http/types'
import { activityTypeOptions } from '@/features/dynamics/lib/dynamicsFilters'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import type { DynamicsActivity } from '@/features/dynamics/types'
import type { ActivityType, MediaImage } from '@/shared/types/homepage'

/** 活动编辑 / 发布（FE-090 /ops/activities）。
 *  结构化字段分组 + 正文所见即所得 + 实时预览（桌面双栏 / 移动 编辑↔预览），封面走媒体上传。
 */
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
const summary = ref('')
const speaker = ref('')
const notesMd = ref('')
const registrationRequired = ref(false)
const registrationStartAt = ref('')
const registrationEndAt = ref('')
const capacity = ref<number | null>(null)
const descriptionMd = ref('')
const cover = ref<MediaImage | null>(null)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

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
    summary.value = activity?.summary ?? ''
    speaker.value = activity?.speaker ?? ''
    notesMd.value = (activity as unknown as { notesMd?: string | null })?.notesMd ?? ''
    registrationRequired.value = activity?.registrationRequired ?? false
    registrationStartAt.value = activity?.registrationStartAt?.slice(0, 16) ?? ''
    registrationEndAt.value = activity?.registrationEndAt?.slice(0, 16) ?? ''
    capacity.value = activity?.capacity ?? null
    descriptionMd.value = activity?.descriptionMd ?? ''
    cover.value = activity?.cover ? { id: null, src: activity.cover.src, alt: activity.cover.alt } : null
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

/** 后端字段错误 key（蛇形）→ 前端 errors key（驼峰）。 */
const FIELD_MAP: Record<string, string> = {
  title: 'title',
  start_at: 'startAt',
  description_md: 'descriptionMd',
  summary: 'summary',
  speaker: 'speaker',
  notes_md: 'notesMd',
  registration_required: 'registrationRequired',
  registration_start_at: 'registrationStartAt',
  registration_end_at: 'registrationEndAt',
  capacity: 'capacity',
  location: 'location',
  organizer_name: 'organizerName',
  cover_asset_id: 'cover'
}

function mapFieldErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(fieldErrors)) {
    result[FIELD_MAP[key] ?? key] = value
  }
  return result
}

async function save(publish = false) {
  const draft: ActivityEditorDraft = {
    title: title.value,
    activityType: activityType.value,
    startAt: startAt.value,
    endAt: endAt.value,
    location: location.value,
    organizerName: organizerName.value,
    summary: summary.value,
    speaker: speaker.value,
    notesMd: notesMd.value,
    registrationRequired: registrationRequired.value,
    registrationStartAt: registrationStartAt.value,
    registrationEndAt: registrationEndAt.value,
    capacity: capacity.value,
    descriptionMd: descriptionMd.value,
    cover: cover.value
  }
  const formErrors = validateActivity(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    const coverAssetId = cover.value?.id ?? null
    let targetId: string | null = props.activity?.id ?? null
    if (isEdit.value && props.activity) {
      await apiUpdateActivity(props.activity.id, draft, coverAssetId)
    } else if (props.syncAnnouncement) {
      const res = await createActivityWithAnnouncement(
        draft,
        coverAssetId,
        {
          title: `${draft.title.trim()} 报名开启`,
          publisherScope: 'ACADEMY',
          bodyMd: `「${draft.title.trim()}」活动详情与报名方式见活动页。`,
          externalUrl: ''
        },
        false
      )
      targetId = (res as unknown as { activity: { id: string } })?.activity?.id ?? null
      if (publish && targetId) await publishActivity(targetId)
      toast.add({
        title: publish ? '已发布' : '已创建草稿',
        description: publish ? '活动与公告已发布。' : '活动与关联公告已保存为草稿，需发布后可见。',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
      close()
      emit('saved')
      return
    } else {
      targetId = await createActivity(draft, coverAssetId)
    }
    if (publish && targetId) {
      await publishActivity(targetId)
      toast.add({ title: '已发布', description: '活动已发布，学生可见。', color: 'success', icon: 'i-lucide-check-circle' })
    } else {
      toast.add({
        title: isEdit.value ? '已保存草稿' : '已创建草稿',
        description: '草稿已保存，需发布后才对学生可见。',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...mapFieldErrors(err.fieldErrors) }
    } else {
      const message = err instanceof AppError ? err.message : '保存失败，请稍后重试。'
      toast.add({
        title: publish ? '发布失败' : '保存失败',
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
    :ui="{ content: 'max-w-5xl' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ isEdit ? '编辑活动' : '发布活动' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="() => save(false)"
      >
        <ContentEditorShell preview-title="活动预览">
          <template #form>
            <CoverUpload
              v-model="cover"
              label="活动封面（选填）"
            />

            <FormSection
              title="基本信息"
              description="名称、类型与封面"
            >
              <div class="grid gap-4 sm:grid-cols-2">
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
              </div>
            </FormSection>

            <FormSection
              title="时间与地点"
              description="活动起止时间与地点"
            >
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
            </FormSection>

            <FormSection
              title="补充信息"
              description="简介 / 主讲人 / 备注（PRD 可选字段）"
            >
              <UFormField label="活动简介（summary）" :error="errors.summary">
                <UTextarea v-model="summary" :rows="2" placeholder="一句话简介，列表页展示" class="w-full" />
              </UFormField>
              <UFormField label="主讲人 / 嘉宾（speaker）" :error="errors.speaker">
                <UInput v-model="speaker" placeholder="如 张教授 / 特邀嘉宾" class="w-full" />
              </UFormField>
              <UFormField label="备注 / 注意事项（notes_md）" :error="errors.notesMd">
                <UTextarea v-model="notesMd" :rows="3" placeholder="支持 Markdown，展示在详情页注意事项" class="w-full" />
              </UFormField>
            </FormSection>

            <FormSection
              title="报名与人数"
              description="报名控制与容量"
            >
              <UFormField label="需要报名">
                <UCheckbox
                  v-model="registrationRequired"
                  :label="registrationRequired ? '需要报名' : '无需报名'"
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="报名开始" :error="errors.registrationStartAt">
                  <UInput
                    v-model="registrationStartAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="报名截止" :error="errors.registrationEndAt">
                  <UInput
                    v-model="registrationEndAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="人数限制（选填）" class="sm:col-span-2">
                  <UInputNumber
                    v-model="capacity"
                    :min="1"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </FormSection>

            <FormSection
              title="活动介绍"
              description="使用 Markdown 编辑，右侧/预览页实时查看渲染效果"
            >
              <UFormField
                name="descriptionMd"
                :error="errors.descriptionMd"
              >
                <MarkdownEditor
                  v-model="descriptionMd"
                  :height="280"
                />
              </UFormField>
            </FormSection>
          </template>

          <template #preview>
            <div
              v-if="cover?.src"
              class="mb-4 aspect-video overflow-hidden rounded-surface border border-default"
            >
              <img
                :src="cover.src"
                :alt="cover.alt"
                class="h-full w-full object-cover"
              >
            </div>
            <h3 class="text-lg font-semibold text-highlighted">
              {{ title || '活动标题' }}
            </h3>
            <RichContent :content="descriptionMd" />
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
          icon="i-lucide-save"
          :loading="submitting"
          @click="save(false)"
        >
          保存草稿
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-rocket"
          :loading="submitting"
          @click="save(true)"
        >
          保存并发布
        </UButton>
      </div>
    </template>
  </UModal>
</template>
