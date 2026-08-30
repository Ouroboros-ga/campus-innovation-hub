<script setup lang="ts">
import { ref, watch } from 'vue'

import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'
import RichContent from '@/shared/components/reader/RichContent.vue'

const props = withDefaults(defineProps<{ submitting?: boolean; error?: string | null; resetKey?: number }>(), { submitting: false, error: null, resetKey: 0 })
const emit = defineEmits<{ submit: [bodyMd: string] }>()
const bodyMd = ref('')
const clientError = ref<string | null>(null)
watch(() => props.resetKey, () => { bodyMd.value = ''; clientError.value = null })
function submit(): void { clientError.value = bodyMd.value.trim() ? null : '请填写正式回复内容。'; if (!clientError.value) emit('submit', bodyMd.value.trim()) }
</script>

<template>
  <form class="mt-6 border-t border-default pt-5" @submit.prevent="submit">
    <h3 class="text-base font-semibold text-highlighted">发送正式回复</h3>
    <p class="mt-1 text-sm text-muted">回复将追加到答疑历史，不能原地修改；如需更正，请追加一条更正说明。</p>
    <p v-if="error || clientError" class="mt-3 text-sm text-error" role="alert">{{ error ?? clientError }}</p>
    <div class="mt-4 grid gap-5 xl:grid-cols-2"><div><UFormField label="回复内容" required><MarkdownEditor v-model="bodyMd" :height="280" :disabled="submitting" /></UFormField></div><section class="rounded-surface border border-default p-4"><h4 class="text-sm font-semibold text-highlighted">回复预览</h4><RichContent class="mt-3" :content="bodyMd || '尚未填写回复内容。'" /></section></div>
    <div class="mt-4 flex justify-end"><UButton type="submit" color="primary" icon="i-lucide-send" :loading="submitting">发送正式回复</UButton></div>
  </form>
</template>
