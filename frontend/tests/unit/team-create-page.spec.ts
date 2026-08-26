import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TeamCreatePage from '@/pages/teams/TeamCreatePage.vue'

const mounted: ReturnType<typeof mount>[] = []

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/teams/create', component: TeamCreatePage }]
  })
  await router.push('/teams/create')
  await router.isReady()

  const wrapper = mount(TeamCreatePage, {
    attachTo: document.body,
    global: {
      plugins: [router, ui],
      stubs: { RouterLink: true }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('FE-032 发布组队表单', () => {
  it('渲染表单字段', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('发布组队')
    expect(wrapper.text()).toContain('关联竞赛')
    expect(wrapper.text()).toContain('信息类型')
    expect(wrapper.text()).toContain('标题')
    expect(wrapper.text()).toContain('项目 / 方向简介')
    expect(wrapper.text()).toContain('招募岗位')
    expect(wrapper.text()).toContain('预计投入时间')
    expect(wrapper.text()).toContain('联系方式')
  })

  it('点击发布校验必填字段', async () => {
    const wrapper = await mountPage()

    const submitButton = wrapper
      .findAll('button')
      .find(b => b.text() === '发布')
    await submitButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('请选择关联竞赛')
    expect(wrapper.text()).toContain('请选择信息类型')
    expect(wrapper.text()).toContain('请填写标题')
    expect(wrapper.text()).toContain('请填写项目 / 方向简介')
    expect(wrapper.text()).toContain('请至少填写一个招募岗位')
    expect(wrapper.text()).toContain('请填写联系方式')
  })
})
