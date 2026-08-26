import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Markdown 渲染（阅读器方案）。
 *
 * 用 marked（轻量）把 markdown 转成 HTML，再以 DOMPurify 显式 allowlist 消毒（防 XSS）。
 * 显式 allowlist 而非 USE_PROFILES，保证标题/表格/图片等稳定保留。
 */
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'del',
  'blockquote', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'figure', 'span', 'div'
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title']

/** 将 markdown 文本渲染为已消毒的 HTML 字符串。 */
export function renderMarkdownToHtml(markdown: string): string {
  const html = marked.parse(markdown ?? '', { gfm: true, breaks: true, async: false })
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
