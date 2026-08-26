<script setup lang="ts">
import { ref, watch } from 'vue'

import { validateTeamApplicationDraft } from '../lib/teamApplication'
import type { TeamApplicationDraft } from '../types'

/**
 * 组队申请 Modal（FE-031）。
 *
 * 设计来源：FrontendDesign §27（短申请适合 Modal）、§26（表单规则：
 * 标签在字段上方、必填清晰、校验信息靠近字段）、§43（按钮陈述事实）。
 * 为 6 字段短表单，Modal 可承载；Phone 长表单另走独立任务页（此处字段已精简）。
 */
const props = defineProps<{
  open: boolean
  teamId: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  submit: [draft: TeamApplicationDraft]
}>()

const selfIntro = ref('')
const skills = ref('')
const experience = ref('')
const motivation = ref('')
const weeklyCommitment = ref('')
const contact = ref('')
const errors = ref<Record<string, string>>({})

/** 打开时重置表单。 */
watch(
  () => props.open,
  open => {
    if (open) {
      selfIntro.value = ''
      skills.value = ''
      experience.value = ''
      motivation.value = ''
      weeklyCommitment.value = ''
      contact.value = ''
      errors.value = {}
    }
  }
)

function close() {
  emit('update:open', false)
}

function submit() {
  const formErrors = validateTeamApplicationDraft({
    selfIntro: selfIntro.value,
    motivation: motivation.value,
    weeklyCommitment: weeklyCommitment.value,
    contact: contact.value
  })
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  emit('submit', {
    teamId: props.teamId,
    selfIntro: selfIntro.value,
    skills: skills.value,
    experience: experience.value,
    motivation: motivation.value,
    weeklyCommitment: weeklyCommitment.value,
    contact: contact.value
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
          label="简单介绍"
          name="selfIntro"
          required
          :error="errors.selfIntro"
        >
          <UTextarea
            v-model="selfIntro"
            :rows="2"
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
            placeholder="如：Python、数据分析、前端开发"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="相关经历"
          name="experience"
        >
          <UTextarea
            v-model="experience"
            :rows="2"
            placeholder="如有相关项目或参赛经历，请简述"
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
            :rows="2"
            placeholder="说说你希望在这里收获什么"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="每周投入"
          name="weeklyCommitment"
          required
          :error="errors.weeklyCommitment"
        >
          <UInput
            v-model="weeklyCommitment"
            placeholder="如：每周 6–8 小时"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="联系方式"
          name="contact"
          required
          :error="errors.contact"
        >
          <UInput
            v-model="contact"
            placeholder="微信 / 手机号 / 邮箱"
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
