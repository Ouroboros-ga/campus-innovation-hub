/**
 * 校园动态展示格式化（Pure functions）
 *
 * - `formatActivityRange`：参考设计稿的「05.25 (周日) 14:00–16:30」风格，
 *   用于活动卡与列表行的日程展示；
 * - `activityExcerpt` / `announcementExcerpt`：从 Markdown 正文安全降级为纯文本摘要
 *   （用于桌面公告表格的「摘要」列），不引入 marked/DOMPurify。
 */

import type {
  DynamicsActivity,
  DynamicsAnnouncement
} from '../types'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

function toDate(value: string | null | undefined): Date | null {
  if (value == null) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * 活动日程范围，如「05.25 (周日) 14:00–16:30」。
 * 无结束时间时只给开始时间；无有效时间返回空字符串。
 */
export function formatActivityRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined
): string {
  const start = toDate(startAt)
  if (!start) return ''

  const datePart = `${pad(start.getMonth() + 1)}.${pad(start.getDate())} (${WEEKDAYS[start.getDay()]})`
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`

  const end = toDate(endAt)
  if (end) {
    const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`
    return `${datePart} ${startTime}–${endTime}`
  }
  return `${datePart} ${startTime}`
}

/** 活动摘要：优先 `summary`，否则从正文降级为纯文本并截断。 */
export function activityExcerpt(activity: DynamicsActivity, maxLength = 60): string {
  const source = activity.summary ?? mdToPlainText(activity.descriptionMd)
  return truncate(source, maxLength)
}

/** 公告摘要：从 Markdown 正文降级为纯文本并截断。 */
export function announcementExcerpt(
  announcement: DynamicsAnnouncement,
  maxLength = 60
): string {
  return truncate(mdToPlainText(announcement.bodyMd), maxLength)
}

function truncate(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

/** 把受支持的 Markdown 子集安全降级为纯文本（保留换行，去掉强调/标题/列表标记）。 */
function mdToPlainText(md: string | null): string {
  if (!md) return ''
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
}
