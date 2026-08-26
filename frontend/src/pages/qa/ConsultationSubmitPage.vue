<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import {
  consultationTypeOptions,
  submitConsultation,
  validateConsultationDraft
} from '@/features/consultation/lib/consultation'
import type { ConsultationDraft } from '@/features/consultation/types'

/**
 * 提交咨询（FE-051）— /qa/submit
 *
 * 短表单 + 半长度（5 字段），使用专属任务壳与 Nuxt UI FormField/Primitive 样式；
 * 必填校验靠近字段，提交含 loading 状态，成功后展示成功态（mock，无真实后端）。
 */
const toast = useToast()

const type = ref('')
const title = ref('')
const description = ref('')
const related = ref('')
const contact = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)

function resetForm() {
  type.value = ''
  title.value = ''
  description.value = ''
  related.value = ''
  contact.value = ''
  errors.value = {}
}

function submit() {
  const draft: ConsultationDraft = {
    type: type.value,
    title: title.value,
    description: description.value,
    relatedCompetition: related.value,
    contact: contact.value
  }
  const formErrors = validateConsultationDraft(draft)
  errors.value = formErrors
  if (Object.keys(formErrors).length > 0) return

  submitting.value = true
  submitConsultation(draft)
  submitting.value = false
  submitted.value = true
  toast.add({
    title: '咨询已提交',
    description: '我们会尽快处理并答复你的问题。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-2xl">
      <template v-if="submitted">
        <div class="flex flex-col items-center gap-3 rounded-surface border border-default bg-default p-8 text-center">
          <span
            class="grid size-12 place-items-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="size-6"
            />
          </span>
          <h1 class="text-lg font-semibold text-highlighted">
            咨询已提交
          </h1>
          <p class="text-sm text-muted">
            感谢你的反馈，我们会尽快答复。
          </p>
          <UButton
            color="primary"
            variant="outline"
            to="/qa"
            class="mt-2"
          >
            返回咨询与指南
          </UButton>
        </div>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          提交咨询
        </h1>
        <p class="mt-2 text-base text-muted">
          描述你遇到的问题或想咨询的内容，我们会尽快处理。
        </p>

        <form
          class="mt-8 space-y-4"
          novalidate
          @submit.prevent="submit"
        >
          <UFormField
            label="咨询类型"
            name="type"
            required
            :error="errors.type"
          >
            <USelect
              v-model="type"
              :items="consultationTypeOptions"
              placeholder="请选择咨询类型"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="标题"
            name="title"
            required
            :error="errors.title"
          >
            <UInput
              v-model="title"
              placeholder="用一句话概括你的问题"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="详细描述"
            name="description"
            required
            :error="errors.description"
          >
            <UTextarea
              v-model="description"
              :rows="4"
              placeholder="请尽量详细描述你的问题或需求"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="关联竞赛（选填）"
            name="relatedCompetition"
          >
            <UInput
              v-model="related"
              placeholder="如：全国大学生数学建模竞赛"
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

          <div class="flex items-center justify-end gap-2 pt-2">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              @click="resetForm"
            >
              重置
            </UButton>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              icon="i-lucide-send"
              :loading="submitting"
            >
              提交咨询
            </UButton>
          </div>
        </form>
      </template>
    </PageContainer>
  </section>
</template>
