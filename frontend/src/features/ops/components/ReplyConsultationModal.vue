<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import { replyQuestion, validateReply } from '../lib/opsStore'
import type { ConsultQaPost } from '@/features/consultation/types'

/** 回复咨询（FE-090 /ops/questions）。 */
const props = defineProps<{ open: boolean; question: ConsultQaPost | null }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; saved: [] }>()
const toast = useToast()

const answer = ref('')
const error = ref('')

watch(
  () => props.open,
  open => {
    if (!open) return
    answer.value = ''
    error.value = ''
  }
)

function close() {
  emit('update:open', false)
}

function save() {
  if (!props.question) return
  const message = validateReply(answer.value)
  if (message) {
    error.value = message
    return
  }
  replyQuestion(props.question.id, answer.value)
  toast.add({
    title: '已回复',
    description: '该咨询已标记为已回复。',
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
    :ui="{ content: 'max-w-lg' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        回复咨询
      </h2>
    </template>

    <template #content>
      <div class="space-y-4">
        <p class="rounded-surface border border-default bg-default p-3 text-sm text-toned">
          {{ props.question?.question }}
        </p>

        <UFormField
          label="回复内容"
          :error="error"
        >
          <UTextarea
            v-model="answer"
            :rows="4"
            placeholder="填写回复内容"
            class="w-full"
          />
        </UFormField>
      </div>
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
          回复
        </UButton>
      </div>
    </template>
  </UModal>
</template>
