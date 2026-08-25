/**
 * 共享日期 / 时间工具（FrontendArchitecture.md「Dates and Times」）
 *
 * 职责：
 * - 集中解析 ISO 8601 时间戳；
 * - 派生截止时间的剩余天数、紧迫度与展示文本；
 * - 派生报名生命周期与赛事 / 活动阶段。
 *
 * 原则（database-design.md §1.3 / §36）：
 * - 组件绝不硬编码已格式化日期字符串；
 * - 可推导的展示文本在此处运行时派生，而非写入 fixture / 数据库。
 *
 * 所有函数接受可选的 `now`，以便在测试中保持确定性。
 */

import type {
  DeadlineUrgency,
  EventPhase,
  RegistrationState
} from '@/shared/types/homepage'

const MS_PER_DAY = 86_400_000

/** 允许为空的截止时间输入（无截止时间的条目）。 */
export type DeadlineLike = string | null | undefined

function toDate(value: string | null | undefined): Date | null {
  if (value == null) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 取本地时区当天 0 点的时间戳，用于按「自然日」计算天数差。 */
function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * 距离截止还剩多少个自然日（本地时区）。
 *
 * - 未来：正数；
 * - 今天：0；
 * - 已过：负数；
 * - 无 / 无效截止时间：null。
 */
export function daysUntil(
  deadlineAt: DeadlineLike,
  now: Date
): number | null {
  const deadline = toDate(deadlineAt)
  if (!deadline) return null
  const diff = startOfLocalDay(deadline) - startOfLocalDay(now)
  return Math.round(diff / MS_PER_DAY)
}

/**
 * 截止紧迫度：
 * - 已过 → EXPIRED；
 * - 剩余天数 <= urgentWithinDays → URGENT；
 * - 其余（含无截止时间）→ NORMAL。
 */
export function deadlineUrgency(
  deadlineAt: DeadlineLike,
  now: Date,
  urgentWithinDays = 3
): DeadlineUrgency {
  const remaining = daysUntil(deadlineAt, now)
  if (remaining == null) return 'NORMAL'
  if (remaining < 0) return 'EXPIRED'
  if (remaining <= urgentWithinDays) return 'URGENT'
  return 'NORMAL'
}

/**
 * 截止信息派生态。
 *
 * `label` 是简体中文展示文本（如「还有 3 天截止」），仅用于展示，
 * 不是存储字段。无截止时间时不产生展示文本。
 */
export interface DeadlineInfo {
  remainingDays: number | null
  urgency: DeadlineUrgency
  label: string
}

export function getDeadlineInfo(
  deadlineAt: DeadlineLike,
  now: Date,
  urgentWithinDays = 3
): DeadlineInfo {
  const remainingDays = daysUntil(deadlineAt, now)

  if (remainingDays == null) {
    return { remainingDays: null, urgency: 'NORMAL', label: '' }
  }

  let label: string
  if (remainingDays < 0) {
    label = '已截止'
  } else if (remainingDays === 0) {
    label = '今天截止'
  } else if (remainingDays === 1) {
    label = '明天截止'
  } else {
    label = `还有 ${remainingDays} 天截止`
  }

  return {
    remainingDays,
    urgency: deadlineUrgency(deadlineAt, now, urgentWithinDays),
    label
  }
}

/**
 * 派生报名生命周期（§12.1 竞赛 / §14.1 活动）。
 *
 * - `required === false`（活动免报名）→ NOT_REQUIRED；
 * - 无起止时间 → NOT_AVAILABLE；
 * - 尚未到开始 → UPCOMING；
 * - 已过截止 → CLOSED；
 * - 窗口内 → OPEN。
 */
export function deriveRegistrationState(input: {
  required?: boolean
  startAt?: string | null
  endAt?: string | null
  now: Date
}): RegistrationState {
  const { required, startAt, endAt, now } = input
  if (required === false) return 'NOT_REQUIRED'
  if (startAt == null && endAt == null) return 'NOT_AVAILABLE'

  const nowMs = now.getTime()
  const startMs = startAt ? toDate(startAt)?.getTime() ?? null : null
  const endMs = endAt ? toDate(endAt)?.getTime() ?? null : null

  if (startMs != null && nowMs < startMs) return 'UPCOMING'
  if (endMs != null && nowMs > endMs) return 'CLOSED'
  if (startMs != null && nowMs >= startMs) return 'OPEN'
  if (endMs != null && nowMs <= endMs) return 'OPEN'
  return 'OPEN'
}

/**
 * 派生赛事 / 活动时间阶段（§12.1 / §14.1 event_phase）。
 *
 * - 未到开始时间 → UPCOMING；
 * - 已过结束时间 → ENDED；
 * - 处于期间（或无结束时间但已开始）→ IN_PROGRESS。
 */
export function deriveEventPhase(input: {
  startAt?: string | null
  endAt?: string | null
  now: Date
}): EventPhase {
  const nowMs = input.now.getTime()
  const startMs = input.startAt
    ? toDate(input.startAt)?.getTime() ?? null
    : null
  const endMs = input.endAt ? toDate(input.endAt)?.getTime() ?? null : null

  if (startMs != null && nowMs < startMs) return 'UPCOMING'
  if (endMs != null && nowMs > endMs) return 'ENDED'
  if (startMs != null && nowMs >= startMs) return 'IN_PROGRESS'
  return 'UPCOMING'
}

/**
 * 格式化日期为简体中文展示。
 *
 * 使用浏览器 `Intl.DateTimeFormat`，不为简单格式化引入大型日期库。
 * 无 / 无效输入返回空字符串。
 */
export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'zh-CN'
): string {
  const date = toDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/** 中文长日期，如「2026 年 9 月 1 日」。 */
export function formatFullDate(value: string | null | undefined): string {
  return formatDate(value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
