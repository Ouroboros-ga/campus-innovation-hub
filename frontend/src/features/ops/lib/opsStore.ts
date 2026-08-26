import { reactive } from 'vue'

import { competitions } from '@/mocks/fixtures/competitions'
import { consultQaPosts } from '@/mocks/fixtures/consultation'
import { dynamicsActivities, dynamicsAnnouncements } from '@/mocks/fixtures/dynamics'
import type { ConsultQaPost } from '@/features/consultation/types'
import type {
  AnnouncementLinkedObject,
  AnnouncementPublisherScope,
  DynamicsActivity,
  DynamicsAnnouncement
} from '@/features/dynamics/types'
import type {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionSummary,
  HomepageImage,
  ParticipationMode
} from '@/shared/types/homepage'

// ---------------------------------------------------------------------------
// 竞赛（FE-090 /ops/competitions）
// ---------------------------------------------------------------------------

export interface CompetitionEditorDraft {
  name: string
  edition: string
  category: CompetitionCategory
  level: CompetitionLevel
  participationMode: ParticipationMode
  registrationStartAt: string
  registrationEndAt: string
  officialUrl: string
}

const blankCover: HomepageImage = { alt: '', src: null }

/** 管理用响应式竞赛列表。 */
export const opsCompetitions = reactive<CompetitionSummary[]>(
  competitions.map(competition => ({
    ...competition,
    cover: { ...competition.cover }
  }))
)

export function addCompetition(draft: CompetitionEditorDraft): CompetitionSummary {
  const id = `competition-${Date.now()}`
  const competition: CompetitionSummary = {
    id,
    name: draft.name.trim(),
    edition: draft.edition.trim(),
    category: draft.category,
    level: draft.level,
    participationMode: draft.participationMode,
    registrationStartAt: draft.registrationStartAt || null,
    registrationEndAt: draft.registrationEndAt || null,
    eventStartAt: null,
    eventEndAt: null,
    officialUrl: draft.officialUrl.trim() || null,
    cover: blankCover,
    detailPath: `/competitions/${id}`
  }
  opsCompetitions.push(competition)
  return competition
}

export function updateCompetition(id: string, draft: CompetitionEditorDraft): void {
  const existing = opsCompetitions.find(item => item.id === id)
  if (!existing) return
  existing.name = draft.name.trim()
  existing.edition = draft.edition.trim()
  existing.category = draft.category
  existing.level = draft.level
  existing.participationMode = draft.participationMode
  existing.registrationStartAt = draft.registrationStartAt || null
  existing.registrationEndAt = draft.registrationEndAt || null
  existing.officialUrl = draft.officialUrl.trim() || null
}

export function validateCompetition(draft: CompetitionEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.name.trim()) errors.name = '请填写竞赛名称'
  if (!draft.edition.trim()) errors.edition = '请填写年份'
  if (!draft.registrationEndAt) errors.registrationEndAt = '请选择报名截止时间'
  return errors
}

// ---------------------------------------------------------------------------
// 活动 / 公告（FE-090 /ops/activities）
// ---------------------------------------------------------------------------

export interface ActivityEditorDraft {
  title: string
  activityType: DynamicsActivity['activityType']
  startAt: string
  endAt: string
  location: string
  organizerName: string
  registrationRequired: boolean
  registrationEndAt: string
  capacity: number | null
  descriptionMd: string
}

/** 管理用响应式活动列表。 */
export const opsActivities = reactive<DynamicsActivity[]>(
  dynamicsActivities.map(activity => ({
    ...activity,
    cover: { ...activity.cover }
  }))
)

export function addActivity(draft: ActivityEditorDraft): DynamicsActivity {
  const id = `activity-${Date.now()}`
  const activity: DynamicsActivity = {
    id,
    title: draft.title.trim(),
    activityType: draft.activityType,
    summary: null,
    startAt: draft.startAt,
    endAt: draft.endAt || null,
    location: draft.location.trim() || '待定',
    organizerName: draft.organizerName.trim() || null,
    registrationRequired: draft.registrationRequired,
    registrationEndAt: draft.registrationEndAt || null,
    registrationStartAt: null,
    capacity: draft.capacity,
    speaker: null,
    descriptionMd: draft.descriptionMd.trim() || null,
    isFeatured: false,
    cover: blankCover,
    detailPath: `/activities/${id}`
  }
  opsActivities.push(activity)
  return activity
}

export function updateActivity(id: string, draft: ActivityEditorDraft): void {
  const existing = opsActivities.find(item => item.id === id)
  if (!existing) return
  existing.title = draft.title.trim()
  existing.activityType = draft.activityType
  existing.startAt = draft.startAt
  existing.endAt = draft.endAt || null
  existing.location = draft.location.trim() || '待定'
  existing.organizerName = draft.organizerName.trim() || null
  existing.registrationRequired = draft.registrationRequired
  existing.registrationEndAt = draft.registrationEndAt || null
  existing.capacity = draft.capacity
  existing.descriptionMd = draft.descriptionMd.trim() || null
}

export function validateActivity(draft: ActivityEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.title.trim()) errors.title = '请填写活动名称'
  if (!draft.startAt) errors.startAt = '请选择开始时间'
  return errors
}

export interface AnnouncementEditorDraft {
  title: string
  publisherScope: AnnouncementPublisherScope
  bodyMd: string
  linkedObject: AnnouncementLinkedObject | null
  externalUrl: string
}

/** 管理用响应式公告列表。 */
export const opsAnnouncements = reactive<DynamicsAnnouncement[]>(
  dynamicsAnnouncements.map(announcement => ({ ...announcement }))
)

export function addAnnouncement(draft: AnnouncementEditorDraft): DynamicsAnnouncement {
  const id = `announcement-${Date.now()}`
  const announcement: DynamicsAnnouncement = {
    id,
    title: draft.title.trim(),
    publishedAt: new Date().toISOString(),
    publisherScope: draft.publisherScope,
    bodyMd: draft.bodyMd.trim() || null,
    linkedObject: draft.linkedObject,
    externalUrl: draft.externalUrl.trim() || null,
    detailPath: `/activities/announcements/${id}`
  }
  opsAnnouncements.push(announcement)
  return announcement
}

export function validateAnnouncement(draft: AnnouncementEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.title.trim()) errors.title = '请填写公告标题'
  if (!draft.bodyMd.trim()) errors.bodyMd = '请填写公告正文'
  return errors
}

// ---------------------------------------------------------------------------
// 咨询（FE-090 /ops/questions）
// ---------------------------------------------------------------------------

/** 管理用响应式公开问答列表。 */
export const opsQuestions = reactive<ConsultQaPost[]>(
  consultQaPosts.map(post => ({ ...post }))
)

export function replyQuestion(id: string, answer: string): void {
  const question = opsQuestions.find(item => item.id === id)
  if (!question) return
  question.answer = answer.trim()
  question.status = 'ANSWERED'
  question.authorName = '平台小助手'
  question.answeredAt = new Date().toISOString()
}

export function validateReply(answer: string): string | null {
  return answer.trim() ? null : '请填写回复内容'
}
