import { describe, expect, it } from 'vitest'

import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'

import {
  filterActivities,
  filterAnnouncements,
  normalizeTab,
  paginate,
  splitAllTab,
  type ActivityStatusFilter,
  type ActivityTypeFilter,
  type AnnouncementScopeFilter
} from '@/features/dynamics/lib/dynamicsFilters'

const NOW = new Date('2026-08-26T00:00:00+08:00')

function statusesOf(filter: { status: ActivityStatusFilter; type: ActivityTypeFilter }) {
  return filterActivities(dynamicsActivities, filter, NOW)
    .map(item => item.id)
}

describe('FE-050 校园动态筛选纯函数', () => {
  it('normalizeTab 归一到合法 tab', () => {
    expect(normalizeTab(undefined)).toBe('all')
    expect(normalizeTab('activities')).toBe('activities')
    expect(normalizeTab('announcements')).toBe('announcements')
    expect(normalizeTab('bogus')).toBe('all')
  })

  it('按报名状态筛选活动（时间驱动，`now` 固定）', () => {
    expect(statusesOf({ status: 'OPEN', type: 'ALL' })).toEqual([
      'ai-sharing-4',
      'python-training'
    ])
    expect(statusesOf({ status: 'UPCOMING', type: 'ALL' })).toEqual([
      'research-training-camp',
      'further-study-sharing',
      'enterprise-visit-fall-2026'
    ])
    expect(statusesOf({ status: 'CLOSED', type: 'ALL' })).toEqual([
      'spring-innovation-salon',
      'summer-camp-closing'
    ])
  })

  it('按类型筛选活动', () => {
    const techSharing = filterActivities(
      dynamicsActivities,
      { status: 'ALL', type: 'TECH_SHARING' },
      NOW
    ).map(item => item.id)
    expect(techSharing).toEqual(['summer-camp-closing', 'ai-sharing-4'])
  })

  it('按（状态 + 类型）组合筛选', () => {
    const both = filterActivities(
      dynamicsActivities,
      { status: 'OPEN', type: 'TECH_SHARING' },
      NOW
    ).map(item => item.id)
    expect(both).toEqual(['ai-sharing-4'])
  })

  it('按来源筛选公告', () => {
    const academy = filterAnnouncements(dynamicsAnnouncements, {
      scope: 'ACADEMY' as AnnouncementScopeFilter
    }).map(item => item.id)
    expect(academy).toEqual([
      'announcement-ai-sharing',
      'announcement-mcm-2026',
      'announcement-csdc-selection'
    ])
  })

  it('分页切片并夹逼页码', () => {
    const page1 = paginate(dynamicsActivities, 1, 6)
    expect(page1.items).toHaveLength(6)
    expect(page1.totalPages).toBe(2)

    const page2 = paginate(dynamicsActivities, 2, 6)
    expect(page2.items).toHaveLength(2)

    const clipped = paginate(dynamicsActivities, 99, 6)
    expect(clipped.items).toHaveLength(2)
    expect(clipped.totalPages).toBe(2)
  })

  it('tab=all 近期限量活动 + 最新公告', () => {
    const { recentActivities, latestAnnouncements } = splitAllTab(
      dynamicsActivities,
      dynamicsAnnouncements
    )
    expect(recentActivities).toHaveLength(4)
    expect(latestAnnouncements).toHaveLength(4)
    // 公告按发布时间降序，最新在前
    expect(latestAnnouncements[0]!.id).toBe('announcement-platform-launch')
  })
})
