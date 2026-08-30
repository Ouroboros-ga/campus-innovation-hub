<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    primaryLabel: string
    primaryIcon?: string
    primaryDisabled?: boolean
    primaryVisible?: boolean
    submitting?: boolean
    secondaryDisabled?: boolean
    cancelLabel?: string
    cancelDisabled?: boolean
  }>(),
  {
    primaryIcon: 'i-lucide-save',
    primaryDisabled: false,
    primaryVisible: true,
    submitting: false,
    secondaryDisabled: false,
    cancelLabel: '取消',
    cancelDisabled: false
  }
)

const emit = defineEmits<{
  primary: []
  cancel: []
}>()

const primaryText = computed(() => props.submitting ? '保存中…' : props.primaryLabel)

function emitPrimary(): void {
  if (!props.primaryDisabled && !props.submitting) emit('primary')
}
</script>

<template>
  <footer
    data-test="editor-action-bar"
    class="sticky bottom-0 z-20 mt-8 border-t border-default bg-default/95 px-4 pt-3 backdrop-blur-sm sm:px-6 lg:px-8"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom));"
    aria-label="编辑操作"
  >
    <div class="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        :disabled="cancelDisabled || submitting"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </UButton>

      <div class="flex min-w-0 items-center justify-end gap-2">
        <fieldset
          class="contents"
          :disabled="secondaryDisabled"
        >
          <slot name="secondary" />
        </fieldset>
        <UButton
          v-if="primaryVisible"
          data-test="editor-primary-action"
          type="button"
          color="primary"
          :icon="primaryIcon"
          :loading="submitting"
          :disabled="primaryDisabled || submitting"
          class="min-h-11 min-w-28 justify-center"
          @click="emitPrimary"
        >
          {{ primaryText }}
        </UButton>
      </div>
    </div>
  </footer>
</template>
