import { describe, expect, it } from 'vitest'

import {
  daysUntil,
  deadlineUrgency,
  deriveEventPhase,
  deriveRegistrationState,
  formatFullDate,
  getDeadlineInfo
} from '@/shared/lib/date'

/**
 * 统一使用 +08:00（Asia/Shanghai 语义）的确定性时间点。
 * daysUntil / getDeadlineInfo 按「本地自然日」计算，与项目时区语义一致。
 */
const NOW = new Date('2026-08-25T12:00:00+08:00')

describe('daysUntil（剩余自然日）', () => {
  it('返回未来截止的剩余天数', () => {
    expect(daysUntil('2026-09-01T23:59:59+08:00', NOW)).toBe(7)
  })

  it('当天截止返回 0', () => {
    expect(daysUntil('2026-08-25T23:59:59+08:00', NOW)).toBe(0)
  })

  it('已过截止返回负数', () => {
    expect(daysUntil('2026-08-20T00:00:00+08:00', NOW)).toBe(-5)
  })

  it('无截止时间返回 null', () => {
    expect(daysUntil(null, NOW)).toBeNull()
    expect(daysUntil('not-a-date', NOW)).toBeNull()
  })
})

describe('deadlineUrgency（紧迫度）', () => {
  it('剩余天数超过阈值时为 NORMAL', () => {
    expect(deadlineUrgency('2026-09-01T23:59:59+08:00', NOW)).toBe('NORMAL')
  })

  it('剩余天数在阈值内时为 URGENT', () => {
    expect(deadlineUrgency('2026-08-28T18:00:00+08:00', NOW)).toBe('URGENT')
  })

  it('已过截止时为 EXPIRED', () => {
    expect(deadlineUrgency('2026-08-20T00:00:00+08:00', NOW)).toBe('EXPIRED')
  })

  it('无截止时间时为 NORMAL', () => {
    expect(deadlineUrgency(null, NOW)).toBe('NORMAL')
  })

  it('支持自定义紧迫阈值', () => {
    expect(deadlineUrgency('2026-08-29T23:59:59+08:00', NOW, 7)).toBe('URGENT')
  })
})

describe('getDeadlineInfo（截止派生态）', () => {
  it('未来且不紧迫：正剩余天数 + NORMAL + 中文标签', () => {
    const info = getDeadlineInfo('2026-09-01T23:59:59+08:00', NOW)
    expect(info.remainingDays).toBe(7)
    expect(info.urgency).toBe('NORMAL')
    expect(info.label).toBe('还有 7 天截止')
  })

  it('明天截止', () => {
    const info = getDeadlineInfo('2026-08-26T09:00:00+08:00', NOW)
    expect(info.remainingDays).toBe(1)
    expect(info.label).toBe('明天截止')
    expect(info.urgency).toBe('URGENT')
  })

  it('今天截止', () => {
    const info = getDeadlineInfo('2026-08-25T23:59:59+08:00', NOW)
    expect(info.remainingDays).toBe(0)
    expect(info.label).toBe('今天截止')
  })

  it('已截止', () => {
    const info = getDeadlineInfo('2026-08-20T00:00:00+08:00', NOW)
    expect(info.remainingDays).toBe(-5)
    expect(info.urgency).toBe('EXPIRED')
    expect(info.label).toBe('已截止')
  })

  it('无截止时间：不产生展示文本', () => {
    expect(getDeadlineInfo(null, NOW)).toEqual({
      remainingDays: null,
      urgency: 'NORMAL',
      label: ''
    })
  })
})

describe('deriveRegistrationState（报名生命周期）', () => {
  it('免报名活动为 NOT_REQUIRED', () => {
    expect(
      deriveRegistrationState({
        required: false,
        startAt: '2026-08-29T14:00:00+08:00',
        endAt: '2026-08-29T23:59:59+08:00',
        now: NOW
      })
    ).toBe('NOT_REQUIRED')
  })

  it('无起止时间为 NOT_AVAILABLE', () => {
    expect(deriveRegistrationState({ now: NOW })).toBe('NOT_AVAILABLE')
  })

  it('未到开始时间为 UPCOMING', () => {
    expect(
      deriveRegistrationState({
        startAt: '2026-09-01T00:00:00+08:00',
        endAt: '2026-09-10T23:59:59+08:00',
        now: NOW
      })
    ).toBe('UPCOMING')
  })

  it('处于窗口内为 OPEN', () => {
    expect(
      deriveRegistrationState({
        startAt: '2026-08-20T00:00:00+08:00',
        endAt: '2026-08-31T23:59:59+08:00',
        now: NOW
      })
    ).toBe('OPEN')
  })

  it('已过截止为 CLOSED', () => {
    expect(
      deriveRegistrationState({
        startAt: '2026-08-01T00:00:00+08:00',
        endAt: '2026-08-20T23:59:59+08:00',
        now: NOW
      })
    ).toBe('CLOSED')
  })
})

describe('deriveEventPhase（时间阶段）', () => {
  it('未到开始为 UPCOMING', () => {
    expect(
      deriveEventPhase({
        startAt: '2026-09-02T19:00:00+08:00',
        endAt: '2026-09-02T21:00:00+08:00',
        now: NOW
      })
    ).toBe('UPCOMING')
  })

  it('处于期间为 IN_PROGRESS', () => {
    expect(
      deriveEventPhase({
        startAt: '2026-08-25T10:00:00+08:00',
        endAt: '2026-08-25T22:00:00+08:00',
        now: NOW
      })
    ).toBe('IN_PROGRESS')
  })

  it('已过结束为 ENDED', () => {
    expect(
      deriveEventPhase({
        startAt: '2026-08-20T10:00:00+08:00',
        endAt: '2026-08-20T12:00:00+08:00',
        now: NOW
      })
    ).toBe('ENDED')
  })

  it('已开始但无结束时间视为进行中', () => {
    expect(
      deriveEventPhase({ startAt: '2026-08-25T10:00:00+08:00', now: NOW })
    ).toBe('IN_PROGRESS')
  })
})

describe('formatFullDate（中文日期展示）', () => {
  it('格式化 ISO 为中文长日期', () => {
    expect(formatFullDate('2026-09-01T23:59:59+08:00')).toContain('2026')
  })

  it('无效输入返回空字符串', () => {
    expect(formatFullDate('not-a-date')).toBe('')
  })
})
