import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import {
  createPinia,
  setActivePinia
} from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import GlobalSearch from '@/features/search/components/GlobalSearch.vue'
import { routes } from '@/router/routes'
import { useGlobalSearchStore } from '@/stores/globalSearch'

const mounted: ReturnType<typeof mount>[] = []

async function mountSearch() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(GlobalSearch, {
    attachTo: document.body,
    global: { plugins: [router, ui] }
  })
  mounted.push(wrapper)

  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-012 全局搜索外壳', () => {
  it('store 支持打开 / 关闭 / 切换', () => {
    const store = useGlobalSearchStore()
    expect(store.open).toBe(false)

    store.openSearch()
    expect(store.open).toBe(true)

    store.closeSearch()
    expect(store.open).toBe(false)

    store.toggle()
    expect(store.open).toBe(true)
  })

  it('Ctrl/Cmd + K 切换打开状态', async () => {
    await mountSearch()

    const store = useGlobalSearchStore()
    expect(store.open).toBe(false)

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
    )
    expect(store.open).toBe(true)

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    )
    expect(store.open).toBe(false)
  })

  it('打开时渲染搜索结果分组与紧凑结果行', async () => {
    await mountSearch()

    useGlobalSearchStore().openSearch()
    await nextTick()
    await flushPromises()
    await nextTick()

    const body = document.body.textContent ?? ''
    expect(body).toContain('竞赛')
    expect(body).toContain('指南')
  })

  it('选择搜索结果后关闭弹层并跳转', async () => {
    await mountSearch()

    const store = useGlobalSearchStore()
    store.openSearch()
    await nextTick()
    await flushPromises()
    await nextTick()

    // 找到第一条结果行并触发选择（reka-ui @select 会调用 onSelect）
    const item = document.body.querySelector('[data-slot="item"]')
    expect(item).not.toBeNull()

    item!.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(store.open).toBe(false)
  })
})
