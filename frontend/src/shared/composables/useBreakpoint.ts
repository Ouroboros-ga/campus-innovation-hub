import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 响应式设备分级（FrontendDesign.md §34 / FrontendArchitecture.md Device Classes）。
 *
 * 这是基于 CSS media query 的特性检测（feature detection），不是机型或 user-agent
 * 指纹。设备分级只决定布局外壳，不代表运行平台（FrontendArchitecture.md §Device Classes）。
 *
 * 分级：
 * - Phone   < 768px
 * - Tablet  768–1023px
 * - Desktop >= 1024px
 */

export type Breakpoint = 'phone' | 'tablet' | 'desktop'

const PHONE_QUERY = '(max-width: 767px)'
const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)'
const DESKTOP_QUERY = '(min-width: 1024px)'

function resolveKind(): Breakpoint {
  // SSR / 测试环境兜底：缺少 matchMedia 时按桌面处理，保证外壳可渲染。
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'desktop'
  }
  if (window.matchMedia(PHONE_QUERY).matches) return 'phone'
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet'
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop'
  return 'desktop'
}

export function useBreakpoint() {
  const kind = ref<Breakpoint>(resolveKind())

  const isPhone = computed(() => kind.value === 'phone')
  const isTablet = computed(() => kind.value === 'tablet')
  const isDesktop = computed(() => kind.value === 'desktop')

  let phoneQuery: MediaQueryList | null = null
  let tabletQuery: MediaQueryList | null = null
  let desktopQuery: MediaQueryList | null = null

  const update = () => {
    kind.value = resolveKind()
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    phoneQuery = window.matchMedia(PHONE_QUERY)
    tabletQuery = window.matchMedia(TABLET_QUERY)
    desktopQuery = window.matchMedia(DESKTOP_QUERY)

    phoneQuery.addEventListener('change', update)
    tabletQuery.addEventListener('change', update)
    desktopQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    phoneQuery?.removeEventListener('change', update)
    tabletQuery?.removeEventListener('change', update)
    desktopQuery?.removeEventListener('change', update)
  })

  return { kind, isPhone, isTablet, isDesktop }
}
