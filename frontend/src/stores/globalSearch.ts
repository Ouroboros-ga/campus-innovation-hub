import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 全局搜索打开状态（FE-012）。
 *
 * 这是跨页面的客户端 UI 状态（AppHeader 搜索按钮、Ctrl/Cmd+K 快捷键与
 * GlobalSearch 弹层共享），符合 AGENTS.md「Pinia 用于跨页面客户端状态」，
 * 而不是把服务端数据堆进 store。
 */
export const useGlobalSearchStore = defineStore('globalSearch', () => {
  const open = ref(false)

  function openSearch() {
    open.value = true
  }

  function closeSearch() {
    open.value = false
  }

  function toggle() {
    open.value = !open.value
  }

  return { open, openSearch, closeSearch, toggle }
})
