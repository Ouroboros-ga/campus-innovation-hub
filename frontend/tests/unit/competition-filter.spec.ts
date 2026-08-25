import { describe, expect, it } from 'vitest'

import { competitions } from '@/mocks/fixtures/competitions'
import {
  applyCompetitionFilters,
  competitionCategoryOptions,
  competitionFormatOptions,
  competitionStatusOptions,
  deriveCompetitionState,
  paginate,
  type CompetitionQuery
} from '@/features/competitions/lib/competitionFilters'

const NOW = new Date('2026-08-26T12:00:00+08:00')

function run(partial: CompetitionQuery) {
  return applyCompetitionFilters(competitions, partial, NOW)
}

describe('FE-020 竞赛筛选逻辑', () => {
  it('无筛选时返回全部，筛选选项覆盖状态/分类/形式', () => {
    expect(run({})).toHaveLength(12)

    expect(competitionStatusOptions.map(o => o.value)).toEqual([
      'OPEN',
      'UPCOMING',
      'CLOSED'
    ])
    expect(competitionCategoryOptions.length).toBeGreaterThanOrEqual(6)
    expect(competitionFormatOptions.map(o => o.value)).toEqual([
      'TEAM',
      'INDIVIDUAL'
    ])
  })

  it('按状态 / 分类 / 形式 / 关键词分别筛选', () => {
    expect(run({ status: 'OPEN' })).toHaveLength(6)
    expect(run({ category: 'PROGRAMMING' })).toHaveLength(4)
    expect(run({ format: 'TEAM' })).toHaveLength(9)
    expect(run({ q: '数学' })).toHaveLength(2)

    // 组合筛选
    expect(run({ status: 'OPEN', category: 'PROGRAMMING' })).toHaveLength(3)
  })

  it('派生状态覆盖报名中 / 即将开始 / 已截止', () => {
    const byId = Object.fromEntries(competitions.map(c => [c.id, c]))
    expect(deriveCompetitionState(byId['csdc-2026']!, NOW)).toBe('OPEN')
    expect(deriveCompetitionState(byId['challenge-cup-2026']!, NOW)).toBe('UPCOMING')
    expect(deriveCompetitionState(byId['robot-cup-2026']!, NOW)).toBe('CLOSED')
  })

  it('分页返回切片与元信息，并夹逼页码', () => {
    const all = run({})
    const page1 = paginate(all, 1, 6)
    expect(page1.items).toHaveLength(6)
    expect(page1.total).toBe(12)
    expect(page1.totalPages).toBe(2)
    expect(page1.page).toBe(1)

    const page2 = paginate(all, 2, 6)
    expect(page2.items).toHaveLength(6)

    expect(paginate(all, 99, 6).page).toBe(2)
    expect(paginate(all, 0, 6).page).toBe(1)
  })
})
