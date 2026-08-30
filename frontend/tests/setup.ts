import { config } from '@vue/test-utils'

config.global.renderStubDefaultSlot = true
const UiIconStub = {
  props: ['name'],
  template: '<span data-test="ui-icon-stub" :data-icon="name" aria-hidden="true" />'
}

config.global.stubs = {
  ...config.global.stubs,
  // Nuxt UI 以 UIcon 注册，组件本身的 name 为 Icon；两者同时 stub
  // 才能覆盖直接挂载与安装 Nuxt UI plugin 的两种测试路径。
  UIcon: UiIconStub,
  Icon: UiIconStub
}

// —— 响应式外壳测试的确定性断点控制 ——
// 测试可通过 `setViewportWidth(<px>)` 指定宽度，默认 1024（Desktop）。
// 基于 CSS media query 特性检测，与 FrontendDesign.md §34 / §13.2 一致，不依赖 user-agent。
const viewportGlobal = globalThis as unknown as {
  __viewportWidth: number
}
viewportGlobal.__viewportWidth = 1024

function mediaMatches(query: string): boolean {
  const width = viewportGlobal.__viewportWidth
  if (query.includes('max-width: 767px')) return width < 768
  if (query.includes('min-width: 768px') && query.includes('max-width: 1023px')) {
    return width >= 768 && width < 1024
  }
  if (query.includes('min-width: 1024px')) return width >= 1024
  return false
}

if (typeof window !== 'undefined') {
  window.matchMedia = ((query: string) => {
    const matches = mediaMatches(query)
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as MediaQueryList
  }) as typeof window.matchMedia
}
