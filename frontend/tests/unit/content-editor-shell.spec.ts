import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'

/**
 * ContentEditorShell（FE-Alpha 编辑预览壳）：
 * - 移动端（< lg）默认单列，仅显示「编辑」面板，预览面板隐藏，用段选开关切换；
 * - 桌面端（lg+）为 form / preview 双栏（容器带 `lg:grid`）。
 * CSS 断点行为由运行时验证；此处验证移动端的段选切换逻辑。
 */
describe('FE-Alpha ContentEditorShell 编辑预览壳', () => {
  const slots = {
    form: '<p class="form-slot">编辑内容</p>',
    preview: '<p class="preview-slot">预览内容</p>'
  }

  function mountShell() {
    return mount(ContentEditorShell, {
      props: { previewTitle: '实时预览' },
      slots,
      global: { plugins: [ui] }
    })
  }

  it('默认展示编辑面板，预览面板隐藏（移动端单列）', () => {
    const wrapper = mountShell()

    const editPane = wrapper.get('[data-test="content-editor-edit"]')
    const previewPane = wrapper.get('[data-test="content-editor-preview"]')

    expect(editPane.classes()).not.toContain('hidden')
    expect(previewPane.classes()).toContain('hidden')
    expect(wrapper.get('.form-slot').text()).toBe('编辑内容')
  })

  it('点击「预览」切换到预览面板', async () => {
    const wrapper = mountShell()
    const previewToggle = wrapper.findAll('button').find(btn => btn.text().includes('预览'))

    expect(previewToggle).toBeTruthy()
    await previewToggle!.trigger('click')

    expect(wrapper.get('[data-test="content-editor-preview"]').classes()).not.toContain('hidden')
    expect(wrapper.get('[data-test="content-editor-edit"]').classes()).toContain('hidden')
    expect(wrapper.get('.preview-slot').text()).toBe('预览内容')
  })

  it('桌面端容器为双栏布局', () => {
    const wrapper = mountShell()
    const grid = wrapper.find('.lg\\:grid')
    expect(grid.exists()).toBe(true)
  })
})
