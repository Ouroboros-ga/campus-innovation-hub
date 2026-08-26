<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { renderMarkdownToHtml } from './markdown'

/**
 * 共享 Markdown 阅读器（FE-Alpha / 阅读器方案）。
 *
 * 用于通知 / 活动 / 指南 / 问答 / 动态等详情页渲染 markdown 正文。
 * - 渲染：renderMarkdownToHtml（marked + DOMPurify 消毒）。
 * - 图片：懒加载 + 异步解码 + 约束宽度 + 预留占位，尽量抑制 CLS（布局位移）。
 * - 链接：站外链接自动加 target=_blank + rel=noopener。
 */
const props = defineProps<{
  content?: string | null
}>()

const host = ref<HTMLElement | null>(null)

const rendered = computed(() => renderMarkdownToHtml(props.content ?? ''))

/** 增强已渲染的 DOM：图片防 CLS、站外链接安全。 */
function enhance(): void {
  const root = host.value
  if (!root) return

  // 图片：懒加载 + 预留占位（抑制 CLS）、异步解码
  const images = root.querySelectorAll<HTMLImageElement>('img:not([data-rich-processed])')
  for (const img of images) {
    img.setAttribute('data-rich-processed', 'true')
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
    img.classList.add('rich-img')

    let figure = img.closest('figure') as HTMLElement | null
    if (!figure) {
      figure = document.createElement('figure')
      figure.className = 'rich-figure'
      img.parentNode?.insertBefore(figure, img)
      figure.appendChild(img)
    }
    figure.classList.add('rich-figure')

    const setRatio = () => {
      if (img.naturalWidth && img.naturalHeight) {
        figure.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
        figure.classList.add('rich-figure--ready')
      } else {
        figure.classList.add('rich-figure--ready')
      }
      figure.removeAttribute('data-rich-pending')
    }
    if (img.complete) {
      setRatio()
    } else {
      figure.setAttribute('data-rich-pending', 'true')
      img.addEventListener('load', setRatio, { once: true })
      img.addEventListener('error', setRatio, { once: true })
    }
  }

  // 站外链接：新标签页 + 安全 rel
  const links = root.querySelectorAll<HTMLAnchorElement>('a:not([data-rich-processed])')
  for (const a of links) {
    a.setAttribute('data-rich-processed', 'true')
    a.classList.add('rich-link')
    const href = a.getAttribute('href') ?? ''
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    }
  }
}

onMounted(() => nextTick(enhance))
watch(rendered, () => nextTick(enhance))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- 内容已由 DOMPurify 显式 allowlist 消毒（生产浏览器可靠） -->
  <div
    ref="host"
    class="rich-content text-[0.9375rem] leading-7 text-toned"
    v-html="rendered"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.rich-content :deep(p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.rich-content :deep(:is(h1, h2, h3, h4)) {
  margin: 1.25rem 0 0.625rem;
  color: var(--ui-text-highlighted);
  font-weight: 600;
  line-height: 1.4;
}
.rich-content :deep(h1) {
  font-size: 1.375rem;
}
.rich-content :deep(h2) {
  font-size: 1.1875rem;
}
.rich-content :deep(h3) {
  font-size: 1.0625rem;
}
.rich-content :deep(h4) {
  font-size: 1rem;
}
.rich-content :deep(ul),
.rich-content :deep(ol) {
  margin: 0.625rem 0;
  padding-left: 1.5rem;
}
.rich-content :deep(ul) {
  list-style: disc;
}
.rich-content :deep(ol) {
  list-style: decimal;
}
.rich-content :deep(li) {
  margin: 0.25rem 0;
}
.rich-content :deep(blockquote) {
  margin: 0.875rem 0;
  border-left: 3px solid var(--ui-border-accented);
  padding: 0.375rem 0 0.375rem 1rem;
  color: var(--ui-text-muted);
}
.rich-content :deep(code) {
  border-radius: 0.25rem;
  background: var(--ui-bg-muted);
  padding: 0.125rem 0.375rem;
  font-size: 0.875em;
  font-family: var(--font-mono);
}
.rich-content :deep(pre) {
  margin: 0.875rem 0;
  overflow-x: auto;
  border-radius: 0.625rem;
  background: var(--ui-bg-muted);
  padding: 0.875rem 1rem;
}
.rich-content :deep(pre code) {
  border-radius: 0;
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
}
.rich-content :deep(table) {
  width: 100%;
  margin: 0.875rem 0;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.rich-content :deep(th),
.rich-content :deep(td) {
  border: 1px solid var(--ui-border);
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.rich-content :deep(th) {
  background: var(--ui-bg-muted);
  color: var(--ui-text-highlighted);
  font-weight: 600;
}
.rich-content :deep(hr) {
  margin: 1.25rem 0;
  border: 0;
  border-top: 1px solid var(--ui-border);
}

/* 图片：约束宽度 + 预留占位，抑制 CLS */
.rich-content :deep(.rich-figure) {
  position: relative;
  width: 100%;
  margin: 0.875rem 0;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 0.625rem;
  background: var(--ui-bg-muted);
  /* 占位比例：加载后依据真实宽高校正，尽量减小布局位移 */
  aspect-ratio: 16 / 10;
}
.rich-content :deep(.rich-img) {
  display: block;
  width: 100%;
  height: auto;
  max-height: 28rem;
  object-fit: contain;
}
.rich-content :deep(.rich-figure--ready) {
  background: transparent;
}

/* 站外链接 */
.rich-content :deep(.rich-link) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
