<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  validateCompetition,
  type CompetitionEditorDraft
} from '../lib/opsStore'
import {
  createCompetition,
  publishCompetition,
  updateCompetition as apiUpdateCompetition,
  type OpsCompetition
} from '../api/opsCompetitionApi'
import { AppError } from '@/shared/http/types'
import {
  competitionCategoryLabel,
  competitionLevelLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import CoverUpload from '@/shared/components/upload/CoverUpload.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'
import type {
  CompetitionCategory,
  CompetitionLevel,
  MediaImage,
  ParticipationMode
} from '@/shared/types/homepage'

/** 竞赛编辑 / 发布（FE-090 /ops/competitions）。
 *  结构化字段分组 + 封面媒体上传 + 正文所见即所得 + 卡片化实时预览（桌面双栏 / 移动 编辑↔预览）。
 */
const props = defineProps<{ open: boolean; competition?: OpsCompetition | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const name = ref('')
const edition = ref('')
const category = ref<CompetitionCategory>('OTHER')
const level = ref<CompetitionLevel>('SCHOOL')
const participationMode = ref<ParticipationMode>('INDIVIDUAL')
const registrationStartAt = ref('')
const registrationEndAt = ref('')
const officialUrl = ref('')
const descriptionMd = ref('')
const collegeOrganized = ref(false)
const cover = ref<MediaImage | null>(null)
const suitableGradeMin = ref<number | null>(null)
const suitableGradeMax = ref<number | null>(null)
const direction = ref('')
const summary = ref('')
const suitableForMd = ref('')
const preparationAdviceMd = ref('')
const eventStartAt = ref('')
const eventEndAt = ref('')
const collegeContactName = ref('')
const collegeContactText = ref('')
const registrationUrl = ref('')
const officialNoticeUrl = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const isEdit = computed(() => Boolean(props.competition))

const categoryOptions = (Object.keys(competitionCategoryLabel) as CompetitionCategory[]).map(
  value => ({ label: competitionCategoryLabel[value], value })
)
const levelOptions = (Object.keys(competitionLevelLabel) as CompetitionLevel[]).map(value => ({
  label: competitionLevelLabel[value],
  value
}))
const participationOptions = (Object.keys(participationModeLabel) as ParticipationMode[]).map(
  value => ({ label: participationModeLabel[value], value })
)

watch(
  () => props.open,
  open => {
    if (!open) return
    const competition = props.competition
    name.value = competition?.name ?? ''
    edition.value = competition?.edition ?? ''
    category.value = competition?.category ?? 'OTHER'
    level.value = competition?.level ?? 'SCHOOL'
    participationMode.value = competition?.participationMode ?? 'INDIVIDUAL'
    registrationStartAt.value = competition?.registrationStartAt?.slice(0, 16) ?? ''
    registrationEndAt.value = competition?.registrationEndAt?.slice(0, 16) ?? ''
    officialUrl.value = competition?.officialUrl ?? ''
    descriptionMd.value = competition?.descriptionMd ?? ''
    collegeOrganized.value = competition?.collegeOrganized ?? false
    cover.value = competition?.cover ? { id: null, src: competition.cover.src, alt: competition.cover.alt } : null
    // 3B+ 新增字段回填（若后端返回则带上，否则留空）
    const c = competition as unknown as Record<string, unknown>
    suitableGradeMin.value = (c.suitable_grade_min as number | null) ?? null
    suitableGradeMax.value = (c.suitable_grade_max as number | null) ?? null
    direction.value = (c.direction as string) ?? ''
    summary.value = (c.summary as string) ?? ''
    suitableForMd.value = (c.suitable_for_md as string) ?? ''
    preparationAdviceMd.value = (c.preparation_advice_md as string) ?? ''
    eventStartAt.value = (c.event_start_at as string)?.slice(0, 16) ?? (c.eventStartAt as string)?.slice(0,16) ?? ''
    eventEndAt.value = (c.event_end_at as string)?.slice(0, 16) ?? (c.eventEndAt as string)?.slice(0,16) ?? ''
    collegeContactName.value = (c.college_contact_name as string) ?? ''
    collegeContactText.value = (c.college_contact_text as string) ?? ''
    registrationUrl.value = (c.registration_url as string) ?? ''
    officialNoticeUrl.value = (c.official_notice_url as string) ?? ''
    errors.value = {}
  }
)

function close() {
  emit('update:open', false)
}

/** 后端字段错误 key（蛇形）→ 前端 errors key（驼峰）。 */
const FIELD_MAP: Record<string, string> = {
  name: 'name',
  edition: 'edition',
  description_md: 'descriptionMd',
  registration_end_at: 'registrationEndAt',
  cover_asset_id: 'cover',
  suitable_grade_min: 'suitableGradeMin',
  suitable_grade_max: 'suitableGradeMax',
  registration_url: 'registrationUrl',
  official_notice_url: 'officialNoticeUrl',
  event_start_at: 'eventStartAt',
  event_end_at: 'eventEndAt'
}

function mapFieldErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(fieldErrors)) {
    result[FIELD_MAP[key] ?? key] = value
  }
  return result
}

async function save(publish = false) {
  const draft: CompetitionEditorDraft = {
    name: name.value,
    edition: edition.value,
    category: category.value,
    level: level.value,
    participationMode: participationMode.value,
    registrationStartAt: registrationStartAt.value,
    registrationEndAt: registrationEndAt.value,
    officialUrl: officialUrl.value,
    descriptionMd: descriptionMd.value,
    collegeOrganized: collegeOrganized.value,
    cover: cover.value,
    suitableGradeMin: suitableGradeMin.value,
    suitableGradeMax: suitableGradeMax.value,
    direction: direction.value,
    summary: summary.value,
    suitableForMd: suitableForMd.value,
    preparationAdviceMd: preparationAdviceMd.value,
    eventStartAt: eventStartAt.value,
    eventEndAt: eventEndAt.value,
    collegeContactName: collegeContactName.value,
    collegeContactText: collegeContactText.value,
    registrationUrl: registrationUrl.value,
    officialNoticeUrl: officialNoticeUrl.value
  }
  const formErrors = validateCompetition(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    const coverAssetId = cover.value?.id ?? null
    let targetId: string | null = props.competition?.id ?? null
    if (isEdit.value && props.competition) {
      if (props.competition.publicationState !== 'DRAFT') {
        throw new AppError('已发布内容不可直接修改，请通过草稿编辑后发布。', { status: 409, code: 'INVALID_STATE' })
      }
      await apiUpdateCompetition(props.competition.id, draft, coverAssetId)
    } else {
      targetId = await createCompetition(draft, coverAssetId)
    }
    if (publish && targetId) {
      await publishCompetition(targetId)
      toast.add({ title: '已发布', description: '竞赛已发布，学生可见。', color: 'success', icon: 'i-lucide-check-circle' })
    } else {
      toast.add({
        title: publish ? '已发布' : isEdit.value ? '已保存草稿' : '已创建草稿',
        description: publish ? '已发布。' : '草稿已保存，需发布后才对学生可见。',
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
        {{ isEdit ? '编辑竞赛' : '新建竞赛' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="() => save(false)"
      >
        <ContentEditorShell preview-title="竞赛预览">
          <template #form>
            <CoverUpload
              v-model="cover"
              label="竞赛封面（选填）"
            />

            <FormSection
              title="基本信息"
              description="名称、年份与类型"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="竞赛名称"
                  name="name"
                  required
                  :error="errors.name"
                >
                  <UInput
                    v-model="name"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="年份"
                  name="edition"
                  required
                  :error="errors.edition"
                >
                  <UInput
                    v-model="edition"
                    placeholder="如：2026"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="分类">
                  <USelect
                    v-model="category"
                    :items="categoryOptions"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="级别">
                  <USelect
                    v-model="level"
                    :items="levelOptions"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="参赛形式">
                <USelect
                  v-model="participationMode"
                  :items="participationOptions"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="主办方">
                <UCheckbox
                  v-model="collegeOrganized"
                  :label="collegeOrganized ? '学院主办' : '非学院主办'"
                />
              </UFormField>
            </FormSection>

            <FormSection
              title="适合人群与方向"
              description="年级、方向、简介与贴士（3B+ 新增，可选）"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="适合年级下限"
                  :error="errors.suitableGradeMin"
                >
                  <UInput
                    v-model.number="suitableGradeMin"
                    type="number"
                    :min="1"
                    :max="4"
                    placeholder="1-4"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="适合年级上限"
                  :error="errors.suitableGradeMax"
                >
                  <UInput
                    v-model.number="suitableGradeMax"
                    type="number"
                    :min="1"
                    :max="4"
                    placeholder="1-4"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UFormField label="方向">
                <UInput
                  v-model="direction"
                  placeholder="如：人工智能/机器人"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="一句话简介">
                <UInput
                  v-model="summary"
                  maxlength="300"
                  placeholder="300 字内"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="适合人群说明">
                <UTextarea
                  v-model="suitableForMd"
                  :rows="3"
                  placeholder="适合人群 Markdown"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="备赛建议">
                <UTextarea
                  v-model="preparationAdviceMd"
                  :rows="3"
                  placeholder="备赛建议 Markdown"
                  class="w-full"
                />
              </UFormField>
            </FormSection>

            <FormSection
              title="报名与链接"
              description="报名时间窗、赛事日程与官网"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="报名开始">
                  <UInput
                    v-model="registrationStartAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="报名截止"
                  name="registrationEndAt"
                  required
                  :error="errors.registrationEndAt"
                >
                  <UInput
                    v-model="registrationEndAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <UFormField label="官网链接">
                <UInput
                  v-model="officialUrl"
                  placeholder="https://example.com"
                  class="w-full"
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="报名入口链接"
                  :error="errors.registrationUrl"
                >
                  <UInput
                    v-model="registrationUrl"
                    placeholder="https://报名入口"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="官方通知链接"
                  :error="errors.officialNoticeUrl"
                >
                  <UInput
                    v-model="officialNoticeUrl"
                    placeholder="https://通知"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="赛事开始"
                  :error="errors.eventStartAt"
                >
                  <UInput
                    v-model="eventStartAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="赛事结束"
                  :error="errors.eventEndAt"
                >
                  <UInput
                    v-model="eventEndAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="校内联系人">
                  <UInput
                    v-model="collegeContactName"
                    placeholder="如：张老师"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="联系方式">
                  <UInput
                    v-model="collegeContactText"
                    placeholder="邮箱/电话"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </FormSection>

            <FormSection
              title="竞赛介绍"
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
              {{ name || '竞赛名称' }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              {{ [edition, competitionLevelLabel[level], competitionCategoryLabel[category]].filter(Boolean).join(' · ') }}
            </p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800">
                {{ participationModeLabel[participationMode] }}
              </span>
              <span
                v-if="registrationEndAt"
                class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
              >
                报名截止 {{ registrationEndAt }}
              </span>
            </div>
            <a
              v-if="officialUrl"
              :href="officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <UIcon
                name="i-lucide-external-link"
                class="size-3.5"
                aria-hidden="true"
              />
              查看官网
            </a>
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
