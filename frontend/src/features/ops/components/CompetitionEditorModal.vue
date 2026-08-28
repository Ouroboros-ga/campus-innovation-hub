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
    :ui="{ content: 'max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col', header: 'shrink-0 border-b border-default bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-950/20' }"
    @update:open="close"
  >
    <template #header>
      <div class="flex items-start gap-3">
        <span class="grid size-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
          <UIcon :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-plus'" class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-highlighted">
            {{ isEdit ? '编辑竞赛' : '新建竞赛' }}
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-muted">
            {{ isEdit ? '更新竞赛信息，保存后需重新发布' : '创建后为草稿，发布后学生可见' }}
          </p>
        </div>
        <UBadge v-if="isEdit" :color="props.competition?.publicationState==='PUBLISHED' ? 'success' : 'warning'" variant="soft" size="xs">
          {{ props.competition?.publicationState==='PUBLISHED' ? '已发布' : props.competition?.publicationState==='ARCHIVED' ? '已归档' : '草稿' }}
        </UBadge>
      </div>
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
            <div class="overflow-hidden rounded-xl border border-default bg-default shadow-sm">
              <div class="aspect-video overflow-hidden bg-gradient-to-br from-primary-50 to-muted dark:from-primary-950/30">
                <img
                  v-if="cover?.src"
                  :src="cover.src"
                  :alt="cover.alt"
                  class="h-full w-full object-cover"
                >
                <div v-else class="grid h-full w-full place-items-center p-6 text-center">
                  <div class="space-y-2">
                    <span class="mx-auto grid size-10 place-items-center rounded-full bg-default text-muted">
                      <UIcon name="i-lucide-image" class="size-5" aria-hidden="true" />
                    </span>
                    <p class="text-xs text-muted">封面预览 · 16:9</p>
                  </div>
                </div>
              </div>
              <div class="space-y-3 p-4">
                <div>
                  <h3 class="text-base font-semibold leading-snug text-highlighted">
                    {{ name || '竞赛名称' }}
                  </h3>
                  <p class="mt-1 text-xs text-muted">
                    {{ [edition || '年份', competitionLevelLabel[level], competitionCategoryLabel[category]].filter(Boolean).join(' · ') }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <UBadge color="neutral" variant="soft" size="xs">
                    {{ participationModeLabel[participationMode] }}
                  </UBadge>
                  <UBadge v-if="collegeOrganized" color="primary" variant="soft" size="xs">学院主办</UBadge>
                  <UBadge v-if="registrationEndAt" color="warning" variant="soft" size="xs">报名截止 {{ registrationEndAt.slice(0,10) }}</UBadge>
                </div>
                <p v-if="summary" class="rounded-lg bg-muted p-3 text-sm leading-relaxed text-toned">
                  {{ summary }}
                </p>
                <a
                  v-if="officialUrl"
                  :href="officialUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <UIcon name="i-lucide-external-link" class="size-3.5" aria-hidden="true" />
                  查看官网
                </a>
                <div class="prose prose-sm max-w-none dark:prose-invert">
                  <RichContent :content="descriptionMd || '竞赛介绍预览…'" />
                </div>
              </div>
            </div>
          </template>
        </ContentEditorShell>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3 border-t border-default bg-muted/20 px-1 py-1">
        <p class="hidden text-xs text-muted sm:block">
          草稿仅自己可见，发布后全校可见
        </p>
        <div class="ml-auto flex items-center gap-2">
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
      </div>
    </template>
  </UModal>
</template>
