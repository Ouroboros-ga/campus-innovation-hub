import ui from '@nuxt/ui/vue-plugin'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, type Component } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw
} from 'vue-router'

const RoutePlaceholder = defineComponent({ template: '<div />' })
const TooltipStub = defineComponent({ template: '<span><slot /></span>' })
const IconStub = defineComponent({
  props: { name: { type: String, default: '' } },
  template: '<span data-test="ui-icon-stub" :data-icon="name" aria-hidden="true" />'
})

interface MountWithAppContextOptions {
  initialRoute?: string
  routes?: RouteRecordRaw[]
  props?: Record<string, unknown>
  slots?: Record<string, string>
  stubs?: Record<string, boolean | Component>
  attachTo?: Element | string
  beforeMount?: (context: {
    pinia: ReturnType<typeof createPinia>
    router: ReturnType<typeof createRouter>
  }) => void | Promise<void>
}

/**
 * 以每个用例独立的应用上下文挂载页面，避免 Pinia、Router 和全局组件相互污染。
 */
export async function mountWithAppContext(
  component: Component,
  options: MountWithAppContextOptions = {}
) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: options.routes ?? [
      { path: '/:pathMatch(.*)*', component: RoutePlaceholder }
    ]
  })
  await router.push(options.initialRoute ?? '/')
  await router.isReady()
  await options.beforeMount?.({ pinia, router })

  const wrapper = mount(component as never, {
    attachTo: options.attachTo ?? document.body,
    props: options.props as never,
    slots: options.slots,
    global: {
      plugins: [pinia, router, ui],
      stubs: {
        Tooltip: TooltipStub,
        UTooltip: TooltipStub,
        UIcon: IconStub,
        Icon: IconStub,
        ...options.stubs
      }
    }
  })

  return { wrapper: wrapper as VueWrapper, pinia, router }
}
