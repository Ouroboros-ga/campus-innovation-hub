<script setup lang="ts">
import { ref, watch } from 'vue'

import { validateRecruitmentDraft } from '../lib/organizationApplication'
import type {
  OrganizationPosition,
  RecruitmentApplicationDraft
} from '../types'

/**
 * 招新申请 Modal（FE-042）。
 *
 * 设计来源：FrontendDesign §27（短申请适合 Modal）、§26（表单规则：
 * 标签在字段上方、必填清晰、校验信息靠近字段）、§43（按钮陈述事实）。
 * Phone 上的长表单改用独立任务页；此处为 5 字段短表单，Modal 可承载。
 */
const props = defineProps<{
  open: boolean
  recruitmentId: string
  positions: OrganizationPosition[]
  defaultPositionId?: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  submit: [draft: RecruitmentApplicationDraft]
}>()

const positionId = ref('')
const selfIntro = ref('')
const skills = ref('')
const experience = ref('')
const motivation = ref('')
const errors = ref<Record<string, string>>({})

const positionItems = props.positions.map(position => ({
  label: position.name,
  value: position.id
}))

/** 打开时重置表单，并预选默认岗位。 */
watch(
  () => props.open,
  (open) => {
    if (open) {
      positionId.value =
        props.defaultPositionId && positionItems.some(item => item.value === props.defaultPositionId)
          ? props.defaultPositionId
          : (positionItems[0]?.value ?? '')
      selfIntro.value = ''
      skills.value = ''
      experience.value = ''
      motivation.value = ''
      errors.value = {}
    }
  }
)

function close() {
  emit('update:open', false)
}

function submit() {
  const formErrors = validateRecruitmentDraft({
    positionId: positionId.value,
    selfIntro: selfIntro.value,
    motivation: motivation.value
  })
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  emit('submit', {
    recruitmentId: props.recruitmentId,
    positionId: positionId.value,
    selfIntro: selfIntro.value.trim(),
    skills: skills.value.trim(),
    experience: experience.value.trim(),
    motivation: motivation.value.trim()
  })
}
</script>

<template>
  <UModal
    :open="open"
    :ui="{ content: 'max-w-lg' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        申请加入
      </h2>
    </template>

    <template #content>
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="submit"
      >
        <UFormField
          label="申请岗位"
          name="positionId"
          :error="errors.positionId"
        >
          <USelect
            v-model="positionId"
            :items="positionItems"
            placeholder="选择岗位"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="自我介绍"
          name="selfIntro"
          required
          :error="errors.selfIntro"
        >
          <UTextarea
            v-model="selfIntro"
            :rows="3"
            placeholder="简要介绍你自己"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="技能"
          name="skills"
        >
          <UInput
            v-model="skills"
            placeholder="如：Python、数据分析、视频剪辑"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="相关经历"
          name="experience"
        >
          <UTextarea
            v-model="experience"
            :rows="3"
            placeholder="如有相关项目或经历，请简述"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="为什么想加入"
          name="motivation"
          required
          :error="errors.motivation"
        >
          <UTextarea
            v-model="motivation"
            :rows="3"
            placeholder="说说你希望在这里收获什么"
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
          @click="submit"
        >
          提交申请
        </UButton>
      </div>
    </template>
  </UModal>
</template>
