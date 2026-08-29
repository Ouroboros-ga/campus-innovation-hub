<script setup lang="ts">
import { ref } from 'vue'

/**
 * 发布动态（FE-090）类型选择器。
 * 明确选择：发布活动 / 发布公告 / 同步发布二者（活动 + 公告独立字段与表单）。
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [type: 'ACTIVITY' | 'ANNOUNCEMENT' | 'BOTH']
}>()

const type = ref<'ACTIVITY' | 'ANNOUNCEMENT' | 'BOTH'>('ACTIVITY')

const options = [
  { value: 'ACTIVITY', label: '发布活动', description: '活动拥有独立表、独立 API 与独立表单字段。' },
  { value: 'ANNOUNCEMENT', label: '发布公告', description: '公告拥有独立表、独立 API 与独立表单字段。' },
  { value: 'BOTH', label: '同步发布二者', description: '发布活动并同步生成关联公告，由后端一个事务完成。' }
] as const

function close() {
  emit('update:open', false)
}

function confirm() {
  emit('select', type.value)
  close()
}
</script>

<template>
  <UModal
    :open="props.open"
    :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6', footer: 'shrink-0' }"
    @update:open="close"
  >
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        选择发布类型
      </h2>
    </template>

    <template #body>
      <div
        role="radiogroup"
        aria-label="发布动态类型"
        class="space-y-3"
      >
        <button
          v-for="item in options"
          :key="item.value"
          type="button"
          role="radio"
          :aria-checked="type === item.value"
          class="flex w-full items-start gap-3 rounded-surface border p-3 text-left transition-colors"
          :class="type === item.value
            ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950'
            : 'border-default hover:border-primary-300 dark:hover:border-primary-700'"
          @click="type = item.value"
        >
          <span
            class="mt-0.5 grid size-4 place-items-center rounded-full border"
            :class="type === item.value
              ? 'border-primary-600'
              : 'border-neutral-300 dark:border-neutral-600'"
            aria-hidden="true"
          >
            <span
              v-if="type === item.value"
              class="size-2 rounded-full bg-primary-600"
            />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-highlighted">
              {{ item.label }}
            </span>
            <span class="mt-0.5 block text-xs text-muted">
              {{ item.description }}
            </span>
          </span>
        </button>
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
          :icon="type === 'BOTH' ? 'i-lucide-link' : 'i-lucide-plus'"
          @click="confirm"
        >
          下一步
        </UButton>
      </div>
    </template>
  </UModal>
</template>
