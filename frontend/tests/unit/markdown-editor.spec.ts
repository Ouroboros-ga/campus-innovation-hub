import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MarkdownEditor from '@/shared/components/editor/MarkdownEditor.vue'

// Vditor 在 happy-dom 测试环境无法初始化（异步加载 CDN 脚本会失败），组件会回退为原生 textarea。
// 单测覆盖该回退路径与 v-model 回传；Vditor 的浏览器端交互由运行时验证。
describe('FE-Alpha MarkdownEditor 文本编辑器', () => {
  it('测试环境回退为原生 textarea', () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: '' },
      global: { plugins: [ui] }
    })

    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('编辑内容通过 update:modelValue 回传', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: '' },
      global: { plugins: [ui] }
    })

    await wrapper.find('textarea').setValue('这是一个组队说明')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('禁用时让测试回退输入框真正只读', () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: '已归档正文', disabled: true },
      global: { plugins: [ui] }
    })

    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined()
  })
})
