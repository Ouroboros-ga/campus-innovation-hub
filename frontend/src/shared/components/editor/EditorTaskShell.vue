<script setup lang="ts">
import ContentEditorShell from './ContentEditorShell.vue'
import EditorActionBar from './EditorActionBar.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    backLabel?: string
    primaryLabel: string
    primaryIcon?: string
    primaryDisabled?: boolean
    primaryVisible?: boolean
    submitting?: boolean
    loading?: boolean
    loadError?: string | null
    formError?: string | null
    previewTitle?: string
  }>(),
  {
    subtitle: '',
    backLabel: '返回列表',
    primaryIcon: 'i-lucide-save',
    primaryDisabled: false,
    primaryVisible: true,
    submitting: false,
    loading: false,
    loadError: null,
    formError: null,
    previewTitle: '学生端预览'
  }
)

const emit = defineEmits<{
  back: []
  primary: []
  retry: []
}>()
</script>

<template>
  <div class="flex min-h-full flex-col bg-canvas">
    <header class="border-b border-default bg-default px-4 py-4 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <UButton
            data-test="editor-back-action"
            type="button"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="emit('back')"
          >
            {{ backLabel }}
          </UButton>
          <div class="min-w-0">
            <h1 class="text-xl font-bold text-highlighted sm:text-2xl">
              {{ title }}
            </h1>
            <p
              v-if="subtitle"
              class="mt-0.5 truncate text-sm text-muted"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
        <slot name="header-actions" />
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
      <div
        v-if="$slots.status"
        class="mb-5"
      >
        <slot name="status" />
      </div>

      <slot
        v-if="loading"
        name="loading"
      >
        <div
          class="space-y-4"
          aria-label="正在加载编辑内容"
        >
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-96 w-full" />
        </div>
      </slot>

      <slot
        v-else-if="loadError"
        name="error"
      >
        <div
          class="rounded-surface border border-error/30 bg-error/10 p-5"
          role="alert"
        >
          <p class="font-semibold text-error">
            编辑内容加载失败
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ loadError }}
          </p>
          <UButton
            class="mt-4"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            @click="emit('retry')"
          >
            重新加载
          </UButton>
        </div>
      </slot>

      <template v-else>
        <div
          v-if="formError"
          data-test="editor-form-error"
          role="alert"
          class="mb-5 flex items-start gap-3 rounded-surface border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
        >
          <UIcon
            name="i-lucide-circle-alert"
            class="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <p>{{ formError }}</p>
        </div>

        <ContentEditorShell :preview-title="previewTitle">
          <template
            v-if="$slots.navigation"
            #navigation
          >
            <slot name="navigation" />
          </template>
          <template #form>
            <slot name="form" />
          </template>
          <template #preview>
            <slot name="preview" />
          </template>
        </ContentEditorShell>
      </template>
    </main>

    <EditorActionBar
      :primary-label="primaryLabel"
      :primary-icon="primaryIcon"
      :primary-disabled="primaryDisabled || loading || Boolean(loadError)"
      :primary-visible="primaryVisible"
      :secondary-disabled="loading || Boolean(loadError) || submitting"
      :submitting="submitting"
      :cancel-label="backLabel"
      @cancel="emit('back')"
      @primary="emit('primary')"
    >
      <template
        v-if="$slots['secondary-actions']"
        #secondary
      >
        <slot name="secondary-actions" />
      </template>
    </EditorActionBar>
  </div>
</template>
