import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ContentEditorShell from '@/shared/components/editor/ContentEditorShell.vue'
import FormSection from '@/shared/components/form/FormSection.vue'

/**
 * ContentEditorShell（FE-Alpha 编辑预览壳）：
 * - 移动端（< lg）默认单列，仅显示「编辑」面板，预览面板隐藏，用段选开关切换；
 * - 桌面端（lg+）为 form / preview 双栏（容器带 `lg:grid`）。
 * CSS 断点行为由运行时验证；此处验证移动端的段选切换逻辑。
 */
describe('FE-Alpha ContentEditorShell 编辑预览壳', () => {
  const slots = {
    navigation: '<nav data-test="section-navigation">基本信息</nav>',
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

  it('移动端 tab 暴露明确选中态和 tabpanel 关系', () => {
    const wrapper = mountShell()
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.attributes('aria-selected')).toBe('true')
    expect(tabs[0]?.attributes('tabindex')).toBe('0')
    expect(tabs[1]?.attributes('aria-selected')).toBe('false')
    expect(tabs[1]?.attributes('tabindex')).toBe('-1')
    expect(wrapper.get('[data-test="content-editor-edit"]').attributes('role')).toBe('tabpanel')
    expect(wrapper.get('[data-test="content-editor-preview"]').attributes('role')).toBe('tabpanel')
  })

  it('方向键切换 tab 时同步移动键盘焦点', async () => {
    const wrapper = mount(ContentEditorShell, {
      props: { previewTitle: '实时预览' },
      slots,
      attachTo: document.body,
      global: { plugins: [ui] }
    })
    const tabs = wrapper.findAll('[role="tab"]')
    const editTab = tabs[0]!.element as HTMLElement
    const previewTab = tabs[1]!.element as HTMLElement

    editTab.focus()
    await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })

    expect(tabs[1]!.attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(previewTab)
    wrapper.unmount()
  })

  it('桌面端使用小节导航、表单、手机预览三栏，预览拥有独立滚动', () => {
    const wrapper = mountShell()
    expect(wrapper.get('[data-test="section-navigation"]').text()).toBe('基本信息')
    expect(wrapper.get('[data-test="content-editor-navigation"]').classes()).toContain('xl:block')
    expect(wrapper.get('[data-test="content-editor-layout"]').classes()).toContain('lg:grid')
    expect(wrapper.get('[data-test="content-editor-preview"]').classes()).toContain('lg:sticky')
    expect(wrapper.get('[data-test="content-editor-preview-scroll"]').classes()).toContain('overflow-y-auto')
  })
})

describe('FormSection', () => {
  it('使用语义 section 和分隔线，不再生成 sparkles 装饰卡片', () => {
    const wrapper = mount(FormSection, {
      props: { title: '基本信息', description: '学生首先看到的内容' },
      slots: { default: '<label>竞赛名称<input /></label>' },
      global: { plugins: [ui] }
    })

    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('aria-labelledby')).toBeTruthy()
    expect(wrapper.find('[class*="i-lucide-sparkles"]').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('shadow-sm')
    expect(wrapper.text()).toContain('学生首先看到的内容')
  })
})
