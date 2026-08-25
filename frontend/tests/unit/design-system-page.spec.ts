import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/runtime/components/App.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DevDesignSystemPage from '@/pages/dev/design-system/DevDesignSystemPage.vue'

const mountedWrappers: ReturnType<typeof mount>[] = []

function mountDesignSystem() {
  const wrapper = mount(
    {
      components: { DevDesignSystemPage, UApp },
      template: '<UApp><DevDesignSystemPage /></UApp>'
    },
    {
      attachTo: document.body,
      global: {
        plugins: [ui]
      }
    }
  )
  mountedWrappers.push(wrapper)

  return wrapper
}

afterEach(() => {
  mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('开发设计系统页面', () => {
  it('以真实语义控件覆盖 FE-003 的视觉参考范围', () => {
    const wrapper = mountDesignSystem()

    expect(wrapper.get('h1').text()).toBe('设计系统活体参考')
    expect(wrapper.text()).toContain('排版与色彩')
    expect(wrapper.text()).toContain('按钮与状态')
    expect(wrapper.text()).toContain('表单控件')
    expect(wrapper.text()).toContain('反馈与浮层')
    expect(wrapper.text()).toContain('加载与空状态')
    expect(wrapper.text()).toContain('Lucide 图标')
    expect(wrapper.text()).toContain('当前没有待处理内容')

    const nameLabel = wrapper
      .findAll('label')
      .find(label => label.text().includes('示例名称'))
    const nameInput = wrapper.get('input[name="design-system-name"]')
    const noteLabel = wrapper
      .findAll('label')
      .find(label => label.text().includes('补充说明'))
    const noteInput = wrapper.get('textarea[name="design-system-note"]')

    expect(nameLabel?.attributes('for')).toBe(nameInput.attributes('id'))
    expect(noteLabel?.attributes('for')).toBe(noteInput.attributes('id'))
    expect(wrapper.get('button[aria-label="查看提示示例"]')).toBeTruthy()
    expect(wrapper.get('[data-design-system="skeleton"]')).toBeTruthy()
  })

  it('可以打开 modal、drawer 并显示 toast 反馈', async () => {
    const wrapper = mountDesignSystem()

    await wrapper.get('button[aria-label="打开确认对话框"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('确认示例操作')

    await wrapper.get('button[aria-label="打开侧边抽屉"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('抽屉组件示例')

    await wrapper.get('button[aria-label="显示操作反馈"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('设置已保存')
  })
})
