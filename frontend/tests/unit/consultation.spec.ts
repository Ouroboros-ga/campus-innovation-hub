import { afterEach, describe, expect, it } from 'vitest'

import {
  findGuideDetail,
  findQaPost,
  resetConsultationSubmissions,
  submitConsultation,
  validateConsultationDraft,
  consultationTypeOptions
} from '@/features/consultation/lib/consultation'
import type { ConsultationDraft } from '@/features/consultation/types'

afterEach(() => resetConsultationSubmissions())

describe('FE-051 咨询与指南查询', () => {
  it('按 id 查找指南详情（含正文），未知返回 null', () => {
    const detail = findGuideDetail('guide-signup-detail')
    expect(detail).not.toBeNull()
    expect(detail!.title).toBe('科创竞赛报名与参赛流程指南')
    expect(detail!.body).toContain('从查找竞赛到报名参赛')

    expect(findGuideDetail('does-not-exist')).toBeNull()
  })

  it('按 id 查找公开问答，未知返回 null', () => {
    const post = findQaPost('qa-lanqiao-both')
    expect(post).not.toBeNull()
    expect(post!.status).toBe('ANSWERED')
    expect(findQaPost('does-not-exist')).toBeNull()
  })

  it('校验咨询表单必填字段', () => {
    const errors = validateConsultationDraft({
      type: '',
      title: ' ',
      description: '',
      contact: ''
    })
    expect(errors.type).toBeTruthy()
    expect(errors.title).toBeTruthy()
    expect(errors.description).toBeTruthy()
    expect(errors.contact).toBeTruthy()
  })

  it('提交咨询存入内存，重置后清空', () => {
    const draft: ConsultationDraft = {
      type: 'COMPETITION',
      title: '如何参加数学建模',
      description: '想了解组队方式。',
      relatedCompetition: '全国大学生数学建模竞赛',
      contact: 'wx: test'
    }
    const record = submitConsultation(draft)
    expect(record.title).toBe('如何参加数学建模')

    resetConsultationSubmissions()
    expect(consultationTypeOptions.length).toBeGreaterThanOrEqual(5)
  })
})
