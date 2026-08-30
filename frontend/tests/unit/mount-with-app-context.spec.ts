import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { mountWithAppContext } from '../utils/mountWithAppContext'

const ContextConsumer = defineComponent({
  setup() {
    const route = useRoute()
    const auth = useAuthStore()
    return { route, auth }
  },
  template: `
    <main>
      <span data-test="route">{{ route.fullPath }}</span>
      <span data-test="auth">{{ auth.status }}</span>
      <UIcon name="i-lucide-check" />
    </main>
  `
})

describe('mountWithAppContext', () => {
  it('为页面安装隔离的 Pinia、Router、Nuxt UI 和统一图标 stub', async () => {
    const { wrapper } = await mountWithAppContext(ContextConsumer, {
      initialRoute: '/context-check?source=test',
      routes: [{ path: '/context-check', component: ContextConsumer }]
    })

    expect(wrapper.get('[data-test="route"]').text()).toBe('/context-check?source=test')
    expect(wrapper.get('[data-test="auth"]').text()).toBe('idle')
    expect(wrapper.get('[data-test="ui-icon-stub"]').attributes('data-icon')).toBe('i-lucide-check')

    wrapper.unmount()
  })
})
