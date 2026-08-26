import { describe, expect, it } from 'vitest'

import {
  deriveRecruitmentPhase,
  findOrganizationDetail,
  findRecruitmentDetail,
  recruitmentCanApply
} from '@/features/organizations/lib/organizationDetail'

describe('FE-041 组织详情查找', () => {
  it('按 id 找到组织详情（含方向/负责人/近期活动/当前招新）', () => {
    const detail = findOrganizationDetail('ai-union')
    expect(detail).toBeDefined()
    expect(detail?.name).toBe('人工智能协会')
    expect(detail?.direction).toContain('机器学习')
    expect(detail?.leaderName).toBe('张同学')
    expect(detail?.currentRecruitments.length).toBe(1)
    expect(detail?.recentActivities[0]?.detailPath).toBe('/activities/ai-sharing-4')
  })

  it('未知 id 返回 undefined', () => {
    expect(findOrganizationDetail('nope')).toBeUndefined()
  })

  it('按组织 id + 招新 id 找到招新详情，且校验组织归属', () => {
    const detail = findRecruitmentDetail('ai-union', 'ai-union-fall-2026')
    expect(detail?.title).toBe('人工智能协会 2026 秋季招新')
    expect(detail?.positions.length).toBe(3)
    // 组织不匹配时视为未找到
    expect(findRecruitmentDetail('robot-lab', 'ai-union-fall-2026')).toBeUndefined()
  })
})

describe('FE-042 招新阶段派生（§11.1）', () => {
  it('报名窗口内 -> OPEN', () => {
    const detail = findRecruitmentDetail('ai-union', 'ai-union-fall-2026')!
    expect(
      deriveRecruitmentPhase(detail, new Date('2026-08-26T00:00:00+08:00'))
    ).toBe('OPEN')
  })

  it('未到报名开始 -> UPCOMING', () => {
    const detail = findRecruitmentDetail('robot-lab', 'robot-lab-fall-2026')!
    expect(
      deriveRecruitmentPhase(detail, new Date('2026-08-26T00:00:00+08:00'))
    ).toBe('UPCOMING')
  })

  it('已过截止 -> CLOSED', () => {
    const detail = findRecruitmentDetail('ai-union', 'ai-union-fall-2026')!
    expect(
      deriveRecruitmentPhase(detail, new Date('2026-09-10T00:00:00+08:00'))
    ).toBe('CLOSED')
  })

  it('completed_at 非空 -> COMPLETED；CANCELLED -> CANCELLED', () => {
    const opened = findRecruitmentDetail('ai-union', 'ai-union-fall-2026')!
    expect(
      deriveRecruitmentPhase(
        { ...opened, completedAt: '2026-09-08T00:00:00+08:00' },
        new Date('2026-08-26T00:00:00+08:00')
      )
    ).toBe('COMPLETED')
    expect(
      deriveRecruitmentPhase(
        { ...opened, publicationState: 'CANCELLED' },
        new Date('2026-08-26T00:00:00+08:00')
      )
    ).toBe('CANCELLED')
  })

  it('仅 OPEN 阶段可申请', () => {
    expect(recruitmentCanApply('OPEN')).toBe(true)
    expect(recruitmentCanApply('UPCOMING')).toBe(false)
    expect(recruitmentCanApply('CLOSED')).toBe(false)
  })
})
