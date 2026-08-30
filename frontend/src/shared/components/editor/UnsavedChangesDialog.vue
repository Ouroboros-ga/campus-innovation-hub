<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
  }>(),
  {
    title: '有尚未保存的更改',
    description: '离开后，本次修改将不会保留。'
  }
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
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          @click="cancel"
        >
          继续编辑
        </UButton>
        <UButton
          type="button"
          color="error"
          icon="i-lucide-trash-2"
          @click="confirm"
        >
          放弃更改
        </UButton>
      </div>
    </template>
  </UModal>
</template>
