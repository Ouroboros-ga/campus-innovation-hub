<script setup lang="ts">
/* eslint-disable no-undef -- tab 聚焦导航（HTMLElement / KeyboardEvent）是浏览器组件的合法依赖 */
import { ref } from 'vue'

import type { DynamicsTab } from '../types'

/**
 * 校园动态 tab（全部 / 活动 / 公告）。
 *
 * - 选中态可见（下划线 + 主色文字），不只靠颜色；
 * - 键盘可达：ArrowLeft / ArrowRight 移动并选中，Home / End 跳到首尾；
 * - 由父级通过 `v-model` 与 URL query 绑定。
 *
 * 设计来源：FE-050（tab 具备可见选中态与键盘可达性）、FrontendDesign.md §34。
 */
const props = defineProps<{ modelValue: DynamicsTab }>()
const emit = defineEmits<{ 'update:modelValue': [value: DynamicsTab] }>()

const tabItems: Array<{ value: DynamicsTab; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'activities', label: '活动' },
  { value: 'announcements', label: '公告' }
]

const tablist = ref<HTMLElement | null>(null)

function onTabkeydown(event: KeyboardEvent, index: number) {
  const count = tabItems.length
  let nextIndex: number | null = null

  if (event.key === 'ArrowRight') nextIndex = (index + 1) % count
  else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + count) % count
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = count - 1

  if (nextIndex == null) return
  event.preventDefault()

  const tabs = tablist.value?.querySelectorAll<HTMLElement>('[role="tab"]')
  const nextTab = tabs?.[nextIndex]
  nextTab?.focus()
  emit('update:modelValue', tabItems[nextIndex]!.value)
}
</script>

<template>
  <div
    ref="tablist"
    role="tablist"
    aria-label="校园动态分类"
    class="flex overflow-x-auto border-b border-default"
  >
    <button
      v-for="(item, index) in tabItems"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="props.modelValue === item.value"
      :tabindex="props.modelValue === item.value ? 0 : -1"
      class="-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
      :class="
        props.modelValue === item.value
          ? 'border-primary text-primary'
          : 'border-transparent text-muted hover:text-highlighted'
      "
      @click="emit('update:modelValue', item.value)"
      @keydown="onTabkeydown($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
