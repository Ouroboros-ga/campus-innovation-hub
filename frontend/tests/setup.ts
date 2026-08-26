import { config } from '@vue/test-utils'

config.global.renderStubDefaultSlot = true

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
