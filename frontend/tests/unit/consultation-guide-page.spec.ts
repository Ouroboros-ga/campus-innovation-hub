import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ConsultationGuidePage from '@/pages/qa/ConsultationGuidePage.vue'
import { routes } from '@/router/routes'

const mounted: ReturnType<typeof mount>[] = []

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  await router.push('/qa')
  await router.isReady()

  const wrapper = mount(ConsultationGuidePage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui]
    }
  })
  mounted.push(wrapper)

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-050 咨询与指南页', () => {
  it('渲染标题、三个区块与相关内容', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('咨询与指南')
    expect(wrapper.text()).toContain('常见问题')
    expect(wrapper.text()).toContain('指南')
    expect(wrapper.text()).toContain('公开问答')
    expect(wrapper.text()).toContain('如何报名参加学科竞赛？')
    expect(wrapper.text()).toContain('科创竞赛报名与参赛流程指南')
    expect(wrapper.text()).toContain('蓝桥杯省赛和国赛可以同时参加吗？')
    expect(wrapper.text()).toContain('提交咨询')
  })

  it('搜索无结果时展示空状态', async () => {
    const wrapper = await mountPage()

    await wrapper
      .find('input[placeholder="搜索问题、指南或关键词"]')
      .setValue('不存在的关键词')
    await flushPromises()

    expect(wrapper.text()).toContain('没有找到相关内容')
  })
})
