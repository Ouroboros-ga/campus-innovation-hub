import { afterEach, describe, expect, it } from 'vitest'

import {
  getMyActiveApplication,
  getMyLastApplication,
  resetRecruitmentApplications,
  submitRecruitmentApplication,
  validateRecruitmentDraft
} from '@/features/organizations/lib/organizationApplication'
import type { RecruitmentApplicationDraft } from '@/features/organizations/types'

afterEach(() => {
  resetRecruitmentApplications()
})

const draft: RecruitmentApplicationDraft = {
  recruitmentId: 'ai-union-fall-2026',
  positionId: 'ai-union-ml',
  selfIntro: '对机器学习感兴趣，有一定 Python 基础。',
  skills: 'Python',
  experience: '参与过课程设计。',
  motivation: '希望深入学习深度学习。'
}

describe('FE-042 招新申请 store', () => {
  it('提交后存在 PENDING 的有效申请', () => {
    const record = submitRecruitmentApplication(draft, '机器学习方向')
    expect(record.status).toBe('PENDING')
    expect(record.positionName).toBe('机器学习方向')
    expect(getMyActiveApplication('ai-union-fall-2026')?.positionId).toBe('ai-union-ml')
  })

  it('同一招新只返回最近一次有效申请', () => {
    submitRecruitmentApplication(draft, '机器学习方向')
    const last = getMyLastApplication('ai-union-fall-2026')
    expect(last?.positionId).toBe('ai-union-ml')
  })

  it('不同招新互不影响', () => {
    submitRecruitmentApplication(draft, '机器学习方向')
    expect(getMyActiveApplication('data-science-fall-2026')).toBeUndefined()
  })

  it('校验：缺岗位、自我介绍、申请理由给出字段级错误', () => {
    const errors = validateRecruitmentDraft({
      positionId: '',
      selfIntro: '',
      motivation: ''
    })
    expect(errors.positionId).toContain('请选择申请岗位')
    expect(errors.selfIntro).toContain('请填写自我介绍')
    expect(errors.motivation).toContain('请填写申请理由')
  })

  it('校验通过时返回空对象', () => {
    expect(
      validateRecruitmentDraft({
        positionId: 'ai-union-ml',
        selfIntro: '大家好',
        motivation: '想加入'
      })
    ).toEqual({})
  })
})
