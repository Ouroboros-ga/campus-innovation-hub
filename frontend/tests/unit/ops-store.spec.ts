import { describe, expect, it } from 'vitest'

import {
  addActivity,
  addAnnouncement,
  addCompetition,
  opsActivities,
  opsAnnouncements,
  opsCompetitions,
  opsQuestions,
  replyQuestion,
  validateActivity,
  validateAnnouncement,
  validateCompetition
} from '@/features/ops/lib/opsStore'

describe('FE-090 运营 store 持久化', () => {
  it('新建竞赛并校验必填', () => {
    const errors = validateCompetition({
      name: '',
      edition: '',
      category: 'AI',
      level: 'SCHOOL',
      participationMode: 'INDIVIDUAL',
      registrationStartAt: '',
      registrationEndAt: '',
      officialUrl: ''
    })
    expect(errors.name).toBeTruthy()
    expect(errors.edition).toBeTruthy()

    const before = opsCompetitions.length
    addCompetition({
      name: '测试竞赛',
      edition: '2026',
      category: 'AI',
      level: 'NATIONAL',
      participationMode: 'TEAM',
      registrationStartAt: '2026-09-01T00:00:00',
      registrationEndAt: '2026-09-20T00:00:00',
      officialUrl: ''
    })
    expect(opsCompetitions.length).toBe(before + 1)
  })

  it('新建活动 / 公告并校验必填', () => {
    expect(validateActivity({ title: '', activityType: 'TECH_SHARING', startAt: '', endAt: '', location: '', organizerName: '', registrationRequired: false, registrationEndAt: '', capacity: null, descriptionMd: '' }).title).toBeTruthy()
    expect(validateAnnouncement({ title: '', publisherScope: 'ACADEMY', bodyMd: '', linkedObject: null, externalUrl: '' }).title).toBeTruthy()

    const activityBefore = opsActivities.length
    addActivity({
      title: '测试活动',
      activityType: 'TECH_SHARING',
      startAt: '2026-09-05T10:00:00',
      endAt: '2026-09-05T12:00:00',
      location: '报告厅',
      organizerName: '人工智能协会',
      registrationRequired: true,
      registrationEndAt: '2026-09-04T23:59:59',
      capacity: 50,
      descriptionMd: ''
    })
    expect(opsActivities.length).toBe(activityBefore + 1)

    const announcementBefore = opsAnnouncements.length
    addAnnouncement({
      title: '测试公告',
      publisherScope: 'UNIVERSITY',
      bodyMd: '公告正文',
      linkedObject: { kind: 'ACTIVITY', label: '测试活动', to: '/activities/test' },
      externalUrl: ''
    })
    expect(opsAnnouncements.length).toBe(announcementBefore + 1)
  })

  it('回复咨询后标记为已回复', () => {
    expect(opsQuestions.length).toBeGreaterThan(0)
    replyQuestion('qa-roadshow', '通常 8 分钟。')
    expect(opsQuestions.find(item => item.id === 'qa-roadshow')?.status).toBe('ANSWERED')
  })
})
