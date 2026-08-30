<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
  }>(),
  {}
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const dialogOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

function cancel(): void {
  emit('cancel')
  emit('update:open', false)
}

function confirm(): void {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <UModal
    v-model:open="dialogOpen"
    :title="title"
    :description="description"
    :dismissible="false"
    :close="false"
  >
    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton type="button" color="neutral" variant="outline" @click="cancel">取消</UButton>
        <UButton type="button" color="error" icon="i-lucide-circle-x" @click="confirm">{{ confirmLabel }}</UButton>
      </div>
    </template>
  </UModal>
</template>
