import { describe, expect, it } from 'vitest'

import { findTeamDetail } from '@/features/teams/lib/teamDetail'

describe('FE-031 组队详情查询', () => {
  it('返回完整详情（含方向 / 成员 / 投入 / 发布者资料）', () => {
    const detail = findTeamDetail('team-algo-01')
    expect(detail).not.toBeNull()
    expect(detail!.title).toBe('智能算法突破小队')
    expect(detail!.direction).toBeTruthy()
    expect(detail!.currentMembers).toBeTruthy()
    expect(detail!.expectedEffort).toBeTruthy()
    expect(detail!.intro).toBeTruthy()
  })

  it('未知 id 返回 null', () => {
    expect(findTeamDetail('does-not-exist')).toBeNull()
  })
})
