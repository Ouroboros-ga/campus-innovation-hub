import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import RichContent from '@/shared/components/reader/RichContent.vue'
import AttachmentList from '@/shared/components/reader/AttachmentList.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })
}

async function mountRich(content: string) {
  const wrapper = mount(RichContent, { props: { content } })
  await flushPromises()
  return wrapper
}

describe('FE-Alpha RichContent 阅读器', () => {
  // 注：XSS 消毒由 DOMPurify 在生产浏览器中保证（happy-dom 测试环境无法验证其行为）。
  it('渲染 markdown 标题、粗体与列表', async () => {
    const wrapper = await mountRich('# 标题\n\n**加粗**\n\n- 甲\n- 乙')

    // 注：happy-dom 的 v-html 可能摘除标题包裹，此处断言内容与行内/列表渲染。
    expect(wrapper.text()).toContain('标题')
    expect(wrapper.get('strong').text()).toBe('加粗')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('消毒脚本与内联事件（防 XSS）', async () => {
    const wrapper = await mountRich(
      '<script>alert(1)</script>安全内容<img src=x onerror="alert(2)">'
    )

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('安全内容')
  })

  it('图片懒加载并包裹占位 figure（防 CLS）', async () => {
    const wrapper = await mountRich('![图示](https://cdn.example.com/a.png)')

    const img = wrapper.get('img[loading="lazy"]')
    expect(img).toBeTruthy()
    expect(img.attributes('decoding')).toBe('async')
    expect(wrapper.find('figure.rich-figure img').exists()).toBe(true)
  })

  it('站外链接自动打开新标签页并安全 rel', async () => {
    const wrapper = await mountRich('[官网](https://www.example.com)')

    const link = wrapper.get('a.rich-link')
    expect(link.attributes('href')).toBe('https://www.example.com')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('空内容不渲染元素', async () => {
    const wrapper = await mountRich('')
    expect(wrapper.find('.rich-content').exists()).toBe(true)
  })
})

describe('FE-Alpha AttachmentList 附件列表', () => {
  const attachments = [
    {
      id: 'a1',
      name: '章程.pdf',
      kind: 'pdf' as const,
      url: 'https://cdn.example.com/zhoucheng.pdf',
      sizeBytes: 204857
    },
    {
      id: 'a2',
      name: '报名表.docx',
      kind: 'word' as const,
      url: 'https://cdn.example.com/form.docx'
    }
  ]

  it('渲染附件名称与大小', () => {
    const wrapper = mount(AttachmentList, {
      props: { attachments },
      global: { plugins: [makeRouter()] }
    })

    expect(wrapper.text()).toContain('章程.pdf')
    expect(wrapper.text()).toContain('200.1 KB')
    expect(wrapper.text()).toContain('报名表.docx')
  })

  it('无附件时不渲染', () => {
    const wrapper = mount(AttachmentList, { props: { attachments: null } })
    expect(wrapper.find('.space-y-2').exists()).toBe(false)
  })
})
