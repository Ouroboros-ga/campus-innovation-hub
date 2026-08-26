import { describe, expect, it } from 'vitest'

import { teamPosts } from '@/mocks/fixtures/teams'
import {
  filterTeamPosts,
  paginateTeamPosts,
  teamCompetitionOptions,
  teamPostTypeOptions,
  teamStatusOptions
} from '@/features/teams/lib/teamFilters'

describe('FE-030 组队筛选逻辑', () => {
  it('筛选选项覆盖信息类型与状态', () => {
    expect(teamPostTypeOptions.map(o => o.value)).toEqual([
      'TEAM_RECRUITING',
      'PERSON_LOOKING'
    ])
    expect(teamStatusOptions.map(o => o.value)).toEqual([
      'RECRUITING',
      'FULL',
      'CLOSED'
    ])
  })

  it('按关联竞赛 / 信息类型 / 状态分别筛选', () => {
    expect(filterTeamPosts(teamPosts, {})).toHaveLength(teamPosts.length)
    expect(
      filterTeamPosts(teamPosts, { competition: 'mcm' }).every(
        p => p.competitionId === 'mcm'
      )
    ).toBe(true)
    expect(
      filterTeamPosts(teamPosts, { postType: 'PERSON_LOOKING' }).every(
        p => p.postType === 'PERSON_LOOKING'
      )
    ).toBe(true)
    expect(
      filterTeamPosts(teamPosts, { status: 'FULL' }).every(
        p => p.status === 'FULL'
      )
    ).toBe(true)

    // 组合筛选
    const combined = filterTeamPosts(teamPosts, {
      competition: 'iflytek',
      postType: 'TEAM_RECRUITING',
      status: 'RECRUITING'
    })
    expect(combined.map(p => p.id)).toEqual(['team-aiapp-03'])
  })

  it('关联竞赛选项按去重派生', () => {
    const options = teamCompetitionOptions(teamPosts)
    const values = options.map(o => o.value)
    expect(values).toContain('mcm')
    expect(values).toContain('iflytek')
    expect(new Set(values).size).toBe(values.length)
  })

  it('分页返回切片与元信息，并夹逼页码', () => {
    const all = filterTeamPosts(teamPosts, {})
    const page1 = paginateTeamPosts(all, 1, 6)
    expect(page1.items).toHaveLength(6)
    expect(page1.total).toBe(teamPosts.length)
    expect(page1.totalPages).toBe(2)
    expect(page1.page).toBe(1)

    const page2 = paginateTeamPosts(all, 2, 6)
    expect(page2.items).toHaveLength(4)

    expect(paginateTeamPosts(all, 99, 6).page).toBe(2)
    expect(paginateTeamPosts(all, 0, 6).page).toBe(1)
  })
})
