import { afterEach, describe, expect, it } from 'vitest'

import {
  getMyTeamApplication,
  resetTeamApplications,
  submitTeamApplication,
  teamApplicationStateLabel,
  validateTeamApplicationDraft
} from '@/features/teams/lib/teamApplication'
import type { TeamApplicationDraft } from '@/features/teams/types'

const draft: TeamApplicationDraft = {
  teamId: 'team-algo-01',
  selfIntro: '我是大二学生，擅长算法。',
  skills: 'Python、机器学习',
  experience: '参与过校级算法竞赛。',
  motivation: '希望冲击省赛一等奖。',
  weeklyCommitment: '每周 8 小时',
  contact: 'wx: zhangsan'
}

afterEach(() => resetTeamApplications())

describe('FE-031 组队申请', () => {
  it('校验必填字段', () => {
    const errors = validateTeamApplicationDraft({
      selfIntro: ' ',
      motivation: '',
      weeklyCommitment: '',
      contact: ''
    })
    expect(errors.selfIntro).toBeTruthy()
    expect(errors.motivation).toBeTruthy()
    expect(errors.weeklyCommitment).toBeTruthy()
    expect(errors.contact).toBeTruthy()
  })

  it('提交后即时 PENDING，且可查询有效申请', () => {
    const record = submitTeamApplication(draft)
    expect(record.status).toBe('PENDING')
    expect(record.teamId).toBe('team-algo-01')

    const active = getMyTeamApplication('team-algo-01')
    expect(active).toBeDefined()
    expect(active!.status).toBe('PENDING')
    expect(teamApplicationStateLabel[active!.status]).toBe('待处理')
  })

  it('重置后无有效申请', () => {
    submitTeamApplication(draft)
    resetTeamApplications()
    expect(getMyTeamApplication('team-algo-01')).toBeUndefined()
  })
})
