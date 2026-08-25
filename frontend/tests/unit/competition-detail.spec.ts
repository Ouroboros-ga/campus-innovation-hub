import { describe, expect, it } from 'vitest'

import { findCompetitionDetail } from '@/features/competitions/lib/competitionDetail'

describe('FE-021 竞赛详情查询', () => {
  it('返回完整详情（含简介 / 时间线 / 关联数据）', () => {
    const detail = findCompetitionDetail('csdc-2026')
    expect(detail).not.toBeNull()
    expect(detail!.intro).toContain('中国大学生计算机设计大赛')
    expect(detail!.timeline.length).toBeGreaterThanOrEqual(3)
    expect(detail!.relatedGuides.length).toBeGreaterThan(0)
    expect(detail!.whoShouldJoin.teamNeeded).toBe(true)
  })

  it('无专门详情时由摘要派生兜底详情（时间线由日期生成）', () => {
    const detail = findCompetitionDetail('ai-innovation-2026')
    expect(detail).not.toBeNull()
    expect(detail!.intro).toBeTruthy()
    expect(detail!.timeline.some(n => n.title === '报名开始')).toBe(true)
  })

  it('未知 id 返回 null', () => {
    expect(findCompetitionDetail('does-not-exist')).toBeNull()
  })
})
