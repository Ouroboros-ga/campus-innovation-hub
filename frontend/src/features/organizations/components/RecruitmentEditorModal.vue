<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useToast } from '@nuxt/ui/composables'

import {
  addRecruitment,
  updateRecruitment,
  validateRecruitEditor,
  type RecruitEditorDraft
} from '../lib/orgManagement'
import type { OrganizationPosition, RecruitmentDetail } from '../types'

/**
 * 招新编辑器（FE-080 / PageMap §新建/编辑招新）。
 * 基本字段 + 岗位编辑器（添加/删除）；校验靠近字段；保存后持久化到内存 store。
 */
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
      ? recruitment.positions.map(position => ({
          name: position.name,
          headcount: position.headcount,
          description: position.description ?? '',
          requirements: position.requirements ?? ''
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

function draft(): RecruitEditorDraft {
  return {
    title: title.value,
    introMd: introMd.value,
    applyStartAt: applyStartAt.value,
    applyEndAt: applyEndAt.value,
    targetGradeMin: targetGradeMin.value,
    targetGradeMax: targetGradeMax.value,
    notesMd: notesMd.value,
    positions: positions.value.map(position => ({
      name: position.name,
      headcount: position.headcount,
      description: position.description,
      requirements: position.requirements
    })) as Array<Omit<OrganizationPosition, 'id'>>
  }
}

function save() {
  const value = draft()
  const formErrors = validateRecruitEditor(value)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  if (isEdit.value && props.recruitment) {
    updateRecruitment(props.orgId, props.recruitment.id, value)
  } else {
    addRecruitment(props.orgId, value)
  }
  toast.add({
    title: isEdit.value ? '已更新招新' : '已新建招新',
    description: '招新信息已保存（mock）。',
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
        {{ isEdit ? '编辑招新' : '新建招新' }}
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="save"
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

        <UFormField
          label="介绍"
          name="introMd"
          required
          :error="errors.introMd"
        >
          <UTextarea
            v-model="introMd"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="开始时间"
            name="applyStartAt"
            required
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

        <UFormField label="其他说明">
          <UTextarea
            v-model="notesMd"
            :rows="2"
            class="w-full"
          />
        </UFormField>

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
