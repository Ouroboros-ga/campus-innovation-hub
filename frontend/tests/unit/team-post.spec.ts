import { afterEach, describe, expect, it } from 'vitest'

import {
  resetTeamPosts,
  submitTeamPost,
  teamPostCompetitionOptions,
  teamPostTypeOptions,
  validateTeamPostDraft
} from '@/features/teams/lib/teamPost'
import type { TeamPostDraft } from '@/features/teams/types'

afterEach(() => resetTeamPosts())

type Editable = Pick<
  TeamPostDraft,
  | 'competitionId'
  | 'postType'
  | 'title'
  | 'direction'
  | 'baseMemberCount'
  | 'targetMemberCount'
  | 'roles'
  | 'goal'
  | 'expectedEffort'
  | 'contact'
>

function pick(over: Partial<Editable>): Editable {
  return {
    competitionId: over.competitionId ?? 'lanqiao-2026',
    postType: over.postType ?? 'TEAM_RECRUITING',
    title: over.title ?? '一起冲省赛',
    direction: over.direction ?? '图像识别',
    baseMemberCount: over.baseMemberCount ?? 1,
    targetMemberCount: over.targetMemberCount ?? 3,
    roles: over.roles ?? ['前端'],
    goal: over.goal ?? '冲击省奖',
    expectedEffort: over.expectedEffort ?? '每周 6 小时',
    contact: over.contact ?? 'wx: test'
  }
}

describe('FE-032 创建组队帖子', () => {
  it('校验必填字段', () => {
    const errors = validateTeamPostDraft(
      pick({
        competitionId: '',
        postType: '' as TeamPostDraft['postType'],
        title: '',
        direction: '',
        baseMemberCount: 0,
        targetMemberCount: 0,
        roles: [],
        goal: '',
        expectedEffort: '',
        contact: ''
      })
    )
    expect(errors.competitionId).toBeTruthy()
    expect(errors.postType).toBeTruthy()
    expect(errors.title).toBeTruthy()
    expect(errors.direction).toBeTruthy()
    expect(errors.baseMemberCount).toBeTruthy()
    expect(errors.targetMemberCount).toBeTruthy()
    expect(errors.roles).toBeTruthy()
    expect(errors.goal).toBeTruthy()
    expect(errors.expectedEffort).toBeTruthy()
    expect(errors.contact).toBeTruthy()
  })

  it('计划人数少于当前人数时报错', () => {
    const errors = validateTeamPostDraft(
      pick({ baseMemberCount: 3, targetMemberCount: 1 })
    )
    expect(errors.targetMemberCount).toBeTruthy()
  })

  it('提交返回创建成功的帖子', async () => {
    const post = await submitTeamPost({
      ...pick({}),
      teamName: '冲锋队',
      currentMembers: '2 名后端',
      skills: ['Python'],
      notes: '欢迎加入'
    })

    expect(post.isOwned).toBe(true)
    expect(post.status).toBe('RECRUITING')
    expect(post.title).toBe('一起冲省赛')
    expect(post.competitionName).toBeTruthy()
  })

  it('提供信息类型与关联竞赛选项', () => {
    expect(teamPostTypeOptions.length).toBeGreaterThanOrEqual(2)
    expect(teamPostCompetitionOptions().length).toBeGreaterThanOrEqual(1)
  })
})
