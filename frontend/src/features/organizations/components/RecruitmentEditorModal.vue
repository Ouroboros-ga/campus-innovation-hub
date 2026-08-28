<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useToast } from '@nuxt/ui/composables'

import {
  createManageRecruitment,
  publishManageRecruitment,
  updateManageRecruitment
} from '@/features/organizations/api/orgManageApi'
import { validateRecruitEditor } from '../lib/orgManagement'
import type { RecruitmentDetail } from '../types'
import { AppError } from '@/shared/http/types'
import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import FormSection from '@/shared/components/form/FormSection.vue'
import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

/** 招新编辑器 — 真实事务接入 DRAFT→PUBLISHED，岗位 sort_order 稳定 */
const props = defineProps<{
  open: boolean
  orgId: string
  recruitment?: RecruitmentDetail | null
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  saved: []
}>()

const toast = useToast()

interface PositionRow {
  id?: string
  name: string
  headcount: number
  description: string
  requirements: string
}

const title = ref('')
const introMd = ref('')
const applyStartAt = ref('')
const applyEndAt = ref('')
const targetGradeMin = ref<number | null>(null)
const targetGradeMax = ref<number | null>(null)
const notesMd = ref('')
const positions = ref<PositionRow[]>([])
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const isEdit = computed(() => Boolean(props.recruitment))

watch(
  () => props.open,
  open => {
    if (!open) return
    const recruitment = props.recruitment
    title.value = recruitment?.title ?? ''
    introMd.value = recruitment?.introMd ?? ''
    applyStartAt.value = recruitment?.applyStartAt?.slice(0, 16) ?? ''
    applyEndAt.value = recruitment?.applyEndAt?.slice(0, 16) ?? ''
    targetGradeMin.value = recruitment?.targetGradeMin ?? null
    targetGradeMax.value = recruitment?.targetGradeMax ?? null
    notesMd.value = recruitment?.notesMd ?? ''
    positions.value = recruitment?.positions.length
      ? recruitment.positions.map(p => ({
          id: p.id,
          name: p.name,
          headcount: p.headcount,
          description: p.description ?? '',
          requirements: p.requirements ?? ''
        }))
      : [emptyPosition()]
    errors.value = {}
  }
)

function emptyPosition(): PositionRow {
  return { name: '', headcount: 1, description: '', requirements: '' }
}

function addPosition() {
  positions.value.push(emptyPosition())
}

function removePosition(index: number) {
  positions.value.splice(index, 1)
}

function close() {
  emit('update:open', false)
}

const FIELD_MAP: Record<string, string> = {
  title: 'title',
  intro_md: 'introMd',
  apply_start_at: 'applyStartAt',
  apply_end_at: 'applyEndAt',
  target_grade_min: 'targetGradeMin',
  target_grade_max: 'targetGradeMax',
  notes_md: 'notesMd',
  positions: 'positions',
  name: 'positions'
}

function mapFieldErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const res: Record<string, string> = {}
  for (const [k, v] of Object.entries(fieldErrors)) res[FIELD_MAP[k] ?? k] = v
  return res
}

async function save(publish = false) {
  const draft = {
    title: title.value,
    introMd: introMd.value,
    applyStartAt: applyStartAt.value,
    applyEndAt: applyEndAt.value,
    targetGradeMin: targetGradeMin.value,
    targetGradeMax: targetGradeMax.value,
    notesMd: notesMd.value,
    positions: positions.value.map((p, idx) => ({
      ...(p.id ? { id: p.id } : {}),
      name: p.name,
      headcount: p.headcount,
      description: p.description,
      requirements: p.requirements,
      sort_order: idx
    }))
  }
  // 前端校验（靠近字段）
  const formErrors = validateRecruitEditor({
    title: draft.title,
    introMd: draft.introMd,
    applyStartAt: draft.applyStartAt,
    applyEndAt: draft.applyEndAt,
    targetGradeMin: draft.targetGradeMin,
    targetGradeMax: draft.targetGradeMax,
    notesMd: draft.notesMd,
    positions: draft.positions.map(p => ({ name: p.name, headcount: p.headcount, description: p.description ?? '', requirements: p.requirements ?? '' })) as never
  })
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  try {
    const payload = {
      title: draft.title.trim(),
      intro_md: draft.introMd.trim(),
      apply_start_at: draft.applyStartAt ? new Date(draft.applyStartAt).toISOString() : null,
      apply_end_at: new Date(draft.applyEndAt).toISOString(),
      target_grade_min: draft.targetGradeMin,
      target_grade_max: draft.targetGradeMax,
      notes_md: draft.notesMd.trim() || null,
      positions: draft.positions.map(p => ({
        ...(p.id ? { id: p.id } : {}),
        name: p.name.trim(),
        headcount: p.headcount,
        description_md: p.description?.trim() || null,
        requirements_md: p.requirements?.trim() || null,
        sort_order: p.sort_order
      }))
    }

    let targetId: string | null = null
    if (isEdit.value && props.recruitment) {
      const pub = (props.recruitment as unknown as { publicationState?: string }).publicationState
      if (pub && pub !== 'DRAFT') throw new AppError('已发布内容不可直接修改，请通过草稿编辑后发布。', { status: 409, code: 'CONFLICT' })
      const updated = await updateManageRecruitment(props.orgId, props.recruitment.id, payload)
      targetId = updated.id
    } else {
      const created = await createManageRecruitment(props.orgId, payload as never)
      targetId = created.id
    }
    if (publish && targetId) await publishManageRecruitment(props.orgId, targetId)

    toast.add({
      title: publish ? '已发布招新' : isEdit.value ? '已保存草稿' : '已创建草稿',
      description: publish ? '已发布到站内可见。' : '已保存到服务器（草稿）。',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    close()
    emit('saved')
  } catch (err) {
    if (err instanceof AppError && err.fieldErrors) {
      errors.value = { ...errors.value, ...mapFieldErrors(err.fieldErrors) }
    } else {
      const msg = err instanceof AppError ? err.message : '保存失败，请稍后重试。'
      toast.add({ title: '保存失败', description: msg, color: 'error', icon: 'i-lucide-alert-circle' })
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
        {{ isEdit ? '编辑招新' : '新建招新' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-6"
        novalidate
        @submit.prevent="() => save(false)"
      >
        <ContentEditorShell preview-title="招新预览">
          <template #form>
            <FormSection
              title="基本信息"
              description="标题、时间与面向年级"
            >
              <UFormField
                label="标题"
                name="title"
                required
                :error="errors.title"
              >
                <UInput
                  v-model="title"
                  placeholder="如：人工智能协会 2026 秋季招新"
                  class="w-full"
                />
              </UFormField>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="开始时间"
                  name="applyStartAt"
                  :error="errors.applyStartAt"
                >
                  <UInput
                    v-model="applyStartAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="截止时间"
                  name="applyEndAt"
                  required
                  :error="errors.applyEndAt"
                >
                  <UInput
                    v-model="applyEndAt"
                    type="datetime-local"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField label="面向年级（最低）">
                  <UInputNumber
                    v-model="targetGradeMin"
                    :min="1"
                    :max="4"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="面向年级（最高）">
                  <UInputNumber
                    v-model="targetGradeMax"
                    :min="1"
                    :max="4"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </FormSection>

            <FormSection
              title="招新介绍"
              description="使用 Markdown 编辑，实时预览渲染效果"
            >
              <UFormField
                label="介绍"
                name="introMd"
                required
                :error="errors.introMd"
              >
                <MarkdownEditor
                  v-model="introMd"
                  :height="260"
                />
              </UFormField>
            </FormSection>

            <FormSection
              title="岗位与说明"
              description="招募岗位列表与补充说明（拖序以 sort_order 固化）"
            >
              <UFormField
                label="招募岗位"
                name="positions"
                required
                :error="errors.positions"
              >
                <div class="space-y-3">
                  <div
                    v-for="(position, index) in positions"
                    :key="index"
                    class="rounded-surface border border-default p-3"
                  >
                    <div class="flex items-start gap-2">
                      <div class="grid flex-1 gap-2 sm:grid-cols-2">
                        <UInput
                          v-model="position.name"
                          placeholder="岗位名称"
                        />
                        <UInputNumber
                          v-model="position.headcount"
                          :min="1"
                          placeholder="招募人数"
                        />
                      </div>
                      <UButton
                        type="button"
                        size="sm"
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-trash-2"
                        aria-label="删除岗位"
                        @click="removePosition(index)"
                      />
                    </div>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                      <UInput
                        v-model="position.description"
                        placeholder="岗位说明"
                      />
                      <UInput
                        v-model="position.requirements"
                        placeholder="要求"
                      />
                    </div>
                  </div>
                  <UButton
                    type="button"
                    size="sm"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-plus"
                    @click="addPosition"
                  >
                    添加岗位
                  </UButton>
                </div>
              </UFormField>

              <UFormField label="其他说明">
                <UTextarea
                  v-model="notesMd"
                  :rows="2"
                  class="w-full"
                />
              </UFormField>
            </FormSection>
          </template>

          <template #preview>
            <h3 class="text-lg font-semibold text-highlighted">
              {{ title || '招新标题' }}
            </h3>
            <RichContent :content="introMd" />
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
