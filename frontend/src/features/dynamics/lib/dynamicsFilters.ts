/**
 * 校园动态纯筛选 / 分页工具（Pure Functions）
 *
 * 设计（FE-050 / FrontendImplementationPlan.md）：
 * - 筛选、搜索与分页由 URL 承载；这里只做纯转换，不依赖路由/Pinia；
 * - 活动与公告各自有独立筛选维度（状态/类型 vs 来源），不合并为通用动态；
 * - 日期决定的活动/报名状态由 `shared/lib/date.ts` 在运行时派生。
 */

import { deriveRegistrationState } from '@/shared/lib/date'
import { activityTypeLabel } from '@/shared/lib/domain-labels'
import type { ActivityType, RegistrationState } from '@/shared/types/homepage'
import { publisherScopeLabel } from './dynamicsLabels'
import type {
  AnnouncementPublisherScope,
  DynamicsActivity,
  DynamicsAnnouncement,
  DynamicsTab
} from '../types'

/** 通用下拉选项。 */
export interface SelectOption {
  label: string
  value: string
}

/** 活动报名状态筛选选项（仅稳定状态；「全部状态」由 placeholder 呈现）。 */
export const activityStatusOptions: SelectOption[] = [
  { label: '报名中', value: 'OPEN' },
  { label: '即将开始', value: 'UPCOMING' },
  { label: '报名已结束', value: 'CLOSED' },
  { label: '无需报名', value: 'NOT_REQUIRED' }
]

/** 活动类型筛选选项。 */
export const activityTypeOptions: SelectOption[] = (
  [
    'COMPETITION_BRIEFING',
    'TECH_SHARING',
    'RESEARCH_LECTURE',
    'FURTHER_STUDY',
    'ENTERPRISE',
    'TRAINING'
  ] as ActivityType[]
).map(type => ({ label: activityTypeLabel[type], value: type }))

/** 公告来源筛选选项。 */
export const announcementScopeOptions: SelectOption[] = (
  ['ACADEMY', 'UNIVERSITY', 'PLATFORM'] as AnnouncementPublisherScope[]
).map(scope => ({ label: publisherScopeLabel[scope], value: scope }))

/** 活动报名状态筛选值（`ALL` 表示不筛）。 */
export type ActivityStatusFilter = 'ALL' | RegistrationState

/** 活动类型筛选值（`ALL` 表示不筛）。 */
export type ActivityTypeFilter = 'ALL' | ActivityType

/** 公告来源筛选值（`ALL` 表示不筛）。 */
export type AnnouncementScopeFilter = 'ALL' | AnnouncementPublisherScope

/** 派生单个活动的报名状态。 */
export function deriveActivityRegistrationState(
  activity: DynamicsActivity,
  now: Date
): RegistrationState {
  return deriveRegistrationState({
    required: activity.registrationRequired,
    startAt: activity.registrationStartAt,
    endAt: activity.registrationEndAt,
    now
  })
}

/**
 * 按状态 / 类型筛选活动，并按开始时间升序。
 * `status === 'ALL'` 或 `type === 'ALL'` 表示该维度不筛。
 */
export function filterActivities(
  activities: readonly DynamicsActivity[],
  filter: { status: ActivityStatusFilter; type: ActivityTypeFilter },
  now: Date
): DynamicsActivity[] {
  return activities
    .filter((activity) => {
      if (filter.type !== 'ALL' && activity.activityType !== filter.type) {
        return false
      }
      if (filter.status !== 'ALL') {
        const state = deriveActivityRegistrationState(activity, now)
        if (state !== filter.status) return false
      }
      return true
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

/** 按来源筛选公告，并按发布时间降序。 */
export function filterAnnouncements(
  announcements: readonly DynamicsAnnouncement[],
  filter: { scope: AnnouncementScopeFilter }
): DynamicsAnnouncement[] {
  return announcements
    .filter((announcement) => {
      if (filter.scope === 'ALL') return true
      return announcement.publisherScope === filter.scope
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/** 分页切片。`page` 从 1 开始。 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number } {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize))
  const clampedPage = Math.min(safePage, totalPages)
  const start = (clampedPage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    totalPages
  }
}

/** `tab=all` 的「近期活动 + 最新公告」两个区块的限量切片。 */
export function splitAllTab(
  activities: readonly DynamicsActivity[],
  announcements: readonly DynamicsAnnouncement[]
): { recentActivities: DynamicsActivity[]; latestAnnouncements: DynamicsAnnouncement[] } {
  const sortedActivities = [...activities].sort((a, b) =>
    a.startAt.localeCompare(b.startAt)
  )
  const sortedAnnouncements = [...announcements].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  )
  return {
    recentActivities: sortedActivities.slice(0, 4),
    latestAnnouncements: sortedAnnouncements.slice(0, 4)
  }
}

/** 把 URL query 的 tab 值归一为合法 tab（非法/缺失 → all）。 */
export function normalizeTab(value: unknown): DynamicsTab {
  if (value === 'activities' || value === 'announcements') return value
  return 'all'
}

/** 把 URL query 的活动状态归一为合法值。 */
export function normalizeActivityStatus(value: unknown): ActivityStatusFilter {
  const allowed: ActivityStatusFilter[] = [
    'ALL',
    'OPEN',
    'UPCOMING',
    'CLOSED',
    'NOT_REQUIRED'
  ]
  return (allowed.find((item) => item === value) as ActivityStatusFilter) ?? 'ALL'
}

/** 把 URL query 的活动类型归一为合法值。 */
export function normalizeActivityType(value: unknown): ActivityTypeFilter {
  if (typeof value === 'string' && value !== 'ALL') return value as ActivityType
  return 'ALL'
}

/** 把 URL query 的公告来源归一为合法值。 */
export function normalizeAnnouncementScope(
  value: unknown
): AnnouncementScopeFilter {
  if (value === 'ACADEMY' || value === 'UNIVERSITY' || value === 'PLATFORM') {
    return value
  }
  return 'ALL'
}
