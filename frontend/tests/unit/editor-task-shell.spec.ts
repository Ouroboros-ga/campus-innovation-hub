import ui from '@nuxt/ui/vue-plugin'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import EditorActionBar from '@/shared/components/editor/EditorActionBar.vue'
import EditorStatusBanner from '@/shared/components/editor/EditorStatusBanner.vue'
import EditorTaskShell from '@/shared/components/editor/EditorTaskShell.vue'
import UnsavedChangesDialog from '@/shared/components/editor/UnsavedChangesDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('EditorTaskShell', () => {
  it('展示任务标题、返回入口、状态区，并且只有一个主操作', () => {
    const wrapper = mount(EditorTaskShell, {
      props: {
        title: '编辑竞赛',
        subtitle: '2026 中国大学生计算机设计大赛',
        backLabel: '返回竞赛列表',
        primaryLabel: '保存更新'
      },
      slots: {
        status: '<p data-test="status-slot">已发布：保存后立即生效</p>',
        form: '<form data-test="form-slot">竞赛表单</form>',
        preview: '<article>学生端预览</article>'
      },
      global: { plugins: [ui] }
    })

    expect(wrapper.get('h1').text()).toBe('编辑竞赛')
    expect(wrapper.text()).toContain('2026 中国大学生计算机设计大赛')
    expect(wrapper.get('[data-test="editor-back-action"]').text()).toContain('返回竞赛列表')
    expect(wrapper.get('[data-test="status-slot"]').text()).toContain('保存后立即生效')
    expect(wrapper.findAll('[data-test="editor-primary-action"]')).toHaveLength(1)
    expect(wrapper.get('[data-test="form-slot"]').text()).toBe('竞赛表单')
  })

  it('页面级错误使用可操作的 inline alert，加载和加载失败有独立区域', async () => {
    const wrapper = mount(EditorTaskShell, {
      props: {
        title: '编辑竞赛',
        primaryLabel: '发布',
        formError: '保存失败，请检查网络后重试。'
      },
      slots: {
        form: '<div data-test="form-slot">表单</div>',
        loading: '<div data-test="loading-slot">正在加载竞赛</div>',
        error: '<div data-test="error-slot">竞赛加载失败</div>'
      },
      global: { plugins: [ui] }
    })

    expect(wrapper.get('[data-test="editor-form-error"]').attributes('role')).toBe('alert')
    expect(wrapper.get('[data-test="editor-form-error"]').text()).toContain('检查网络后重试')

    await wrapper.setProps({ loading: true, formError: null })
    expect(wrapper.get('[data-test="loading-slot"]').text()).toBe('正在加载竞赛')
    expect(wrapper.find('[data-test="form-slot"]').exists()).toBe(false)

    await wrapper.setProps({ loading: false, loadError: 'LOAD_FAILED' })
    expect(wrapper.get('[data-test="error-slot"]').text()).toBe('竞赛加载失败')
    expect(wrapper.find('[data-test="form-slot"]').exists()).toBe(false)
  })

  it('主操作因业务校验禁用时仍允许 secondary 保存草稿', () => {
    const wrapper = mount(EditorTaskShell, {
      props: {
        title: '新建竞赛',
        primaryLabel: '发布',
        primaryDisabled: true
      },
      slots: {
        form: '<div>表单</div>',
        'secondary-actions': '<button data-test="save-draft" type="button">保存草稿</button>'
      },
      global: { plugins: [ui] }
    })

    expect(wrapper.get('[data-test="editor-primary-action"]').attributes()).toHaveProperty('disabled')
    expect((wrapper.get('fieldset').element as HTMLFieldSetElement).disabled).toBe(false)
  })
})

describe('EditorStatusBanner', () => {
  it('只呈现调用方传入的状态与影响文案', () => {
    const wrapper = mount(EditorStatusBanner, {
      props: {
        statusLabel: '已发布',
        impact: '保存后立即对学生生效',
        detail: '最后保存于今天 14:28',
        tone: 'success'
      },
      global: { plugins: [ui] }
    })

    expect(wrapper.text()).toContain('已发布')
    expect(wrapper.text()).toContain('保存后立即对学生生效')
    expect(wrapper.text()).toContain('最后保存于今天 14:28')
  })
})

describe('EditorActionBar', () => {
  it('提供移动端安全区操作栏，禁用时不触发主操作', async () => {
    const wrapper = mount(EditorActionBar, {
      props: { primaryLabel: '发布', primaryDisabled: true, cancelLabel: '返回列表' },
      global: { plugins: [ui] }
    })

    const bar = wrapper.get('[data-test="editor-action-bar"]')
    expect(bar.classes()).toContain('sticky')
    expect(bar.classes()).toContain('bottom-0')
    const primary = wrapper.get('[data-test="editor-primary-action"]')
    expect(primary.attributes()).toHaveProperty('disabled')
    await primary.trigger('click')
    expect(wrapper.emitted('primary')).toBeUndefined()
  })

  it('提交中显示明确状态且只保留一个 primary button', () => {
    const wrapper = mount(EditorActionBar, {
      props: { primaryLabel: '保存更新', submitting: true },
      slots: { secondary: '<button type="button">归档</button>' },
      global: { plugins: [ui] }
    })

    expect(wrapper.findAll('[data-test="editor-primary-action"]')).toHaveLength(1)
    expect(wrapper.get('[data-test="editor-primary-action"]').text()).toContain('保存中')
    expect(wrapper.text()).toContain('归档')
  })

  it('加载、失败或提交期间禁用 secondary 写操作', () => {
    const wrapper = mount(EditorActionBar, {
      props: { primaryLabel: '保存更新', secondaryDisabled: true },
      slots: { secondary: '<button data-test="archive-action" type="button">归档</button>' },
      global: { plugins: [ui] }
    })

    expect(wrapper.get('fieldset').attributes()).toHaveProperty('disabled')
    expect((wrapper.get('fieldset').element as HTMLFieldSetElement).disabled).toBe(true)
  })
})

describe('UnsavedChangesDialog', () => {
  it('把继续编辑与放弃更改作为两个明确动作', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(UnsavedChangesDialog, {
      props: { open: true },
      attachTo: document.body,
      global: { plugins: [ui, router] }
    })
    await flushPromises()

    expect(document.body.textContent).toContain('有尚未保存的更改')
    expect(document.body.querySelectorAll('[role="dialog"], [role="alertdialog"]')).toHaveLength(1)
    const dialog = document.body.querySelector('[role="dialog"], [role="alertdialog"]')
    expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy()
    let buttons = Array.from(document.body.querySelectorAll('button'))
    const continueButton = buttons.find(button => button.textContent?.includes('继续编辑'))
    expect(continueButton).toBeTruthy()

    continueButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    await wrapper.setProps({ open: true })
    await flushPromises()
    buttons = Array.from(document.body.querySelectorAll('button'))
    const discardButton = buttons.find(button => button.textContent?.includes('放弃更改'))
    expect(discardButton).toBeTruthy()
    discardButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
})
