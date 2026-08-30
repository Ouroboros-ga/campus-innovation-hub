import { nextTick } from 'vue'
import { type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ConsultationGuidePage from '@/pages/qa/ConsultationGuidePage.vue'
import { routes } from '@/router/routes'
import { mountWithAppContext } from '../utils/mountWithAppContext'

const mounted: VueWrapper[] = []

async function mountPage() {
  const { wrapper } = await mountWithAppContext(ConsultationGuidePage, {
    initialRoute: '/qa',
    routes
  })
  mounted.push(wrapper)

  return wrapper
}

afterEach(() => {
  vi.useRealTimers()
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
    vi.useFakeTimers()
    const wrapper = await mountPage()

    await wrapper
      .find('input[placeholder="搜索问题、指南或关键词"]')
      .setValue('不存在的关键词')
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(wrapper.text()).toContain('没有找到相关内容')
  })
})
