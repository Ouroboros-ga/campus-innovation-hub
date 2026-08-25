<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useGlobalSearchStore } from '@/stores/globalSearch'
import { buildSearchIndex } from '../lib/searchIndex'

/**
 * 全局搜索外壳（FE-012）。
 *
 * 设计来源：
 * - FrontendDesign.md §30：UModal + UCommandPalette；触发为搜索图标 + Ctrl/Cmd+K；
 *   结果行紧凑、显示结果类型，不做卡片墙；
 * - §43：占位文案为具体名词，避免营销词。
 */
const store = useGlobalSearchStore()
const router = useRouter()

/** 把纯索引条目映射为 CommandPalette 可用项，选择时路由跳转并关闭弹层。 */
const groups = computed(() =>
  buildSearchIndex().map(group => ({
    ...group,
    items: group.items.map(item => ({
      label: item.label,
      description: item.description,
      icon: item.icon,
      onSelect: () => {
        store.closeSearch()
        void router.push(item.to)
      }
    }))
  }))
)

/** 快捷键事件的结构化类型（避免依赖浏览器全局，便于单测与 lint）。 */
interface ShortcutEvent {
  ctrlKey: boolean
  metaKey: boolean
  key: string
  preventDefault: () => void
}

function onKeydown(event: ShortcutEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    store.toggle()
  }
}

function isBrowser() {
  return typeof globalThis !== 'undefined' && typeof globalThis.addEventListener === 'function'
}

onMounted(() => {
  if (isBrowser()) {
    globalThis.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (isBrowser()) {
    globalThis.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <UModal
    v-model:open="store.open"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #content>
      <UCommandPalette
        :groups="groups"
        :close="true"
        autofocus
        placeholder="搜索竞赛、组织、组队、活动、指南、公告……"
        :ui="{ viewport: 'max-h-[60vh]', content: 'h-auto' }"
        @update:open="store.open = $event"
      />
    </template>
  </UModal>
</template>
