/**
 * 组织发现：派生 / 筛选 / 排序 / 分页纯函数（FE-040）
 *
 * 设计来源：
 * - FrontendDesign.md §34.5：筛选值由 URL 承载，不建独立手机端筛选状态；
 * - §24：仅用语义状态 / 简短分类做筛选；§43：选项陈述事实。
 *
 * 纯函数便于单元测试；URL 读写由页面 composable 负责。
 */

import {
  organizationTypeLabel
} from '@/shared/lib/domain-labels'
import type { OrganizationType } from '@/shared/types/homepage'

import type {
  OrganizationRecruitment,
  OrganizationRecruitmentFilter,
  OrganizationSort,
  OrganizationSummary,
  OrganizationTypeFilter,
  OrgRecruitmentState
} from '../types'

/** 通用下拉/筛选选项。 */
export interface SelectOption {
  label: string
  value: string
}

/** 从组织的当前招新对象派生招新状态（供组织详情逐条展示）。 */
export function deriveRecruitmentStateFromRecruitment(
  recruitment: OrganizationRecruitment | null,
  now: Date
): OrgRecruitmentState {
  if (!recruitment) return 'NOT_RECRUITING'

  if (recruitment.publicationState === 'DRAFT') return 'NOT_RECRUITING'
  if (recruitment.publicationState === 'CANCELLED') return 'PAUSED'
  if (recruitment.publicationState === 'ARCHIVED') return 'NOT_RECRUITING'

  // PUBLISHED
  const nowMs = now.getTime()
  const startMs = recruitment.applyStartAt
    ? new Date(recruitment.applyStartAt).getTime()
    : null
  const endMs = recruitment.applyEndAt
    ? new Date(recruitment.applyEndAt).getTime()
    : null

  if (startMs != null && nowMs < startMs) return 'UPCOMING'
  if (endMs != null && nowMs > endMs) return 'NOT_RECRUITING'
  return 'RECRUITING'
}

/** 派生组织招新状态（§11.1 publication_state + 报名窗口）。 */
export function deriveRecruitmentState(
  org: OrganizationSummary,
  now: Date
): OrgRecruitmentState {
  return deriveRecruitmentStateFromRecruitment(org.recruitment, now)
}

/** 组织类型筛选选项（全部由 placeholder 呈现）。 */
export const organizationTypeOptions: SelectOption[] = (
  [
    'COLLEGE_DEPARTMENT',
    'STUDENT_CLUB',
    'LABORATORY',
    'INNOVATION_TEAM',
    'OTHER'
  ] as OrganizationType[]
).map(type => ({ label: organizationTypeLabel[type], value: type }))

/** 招新状态筛选选项。 */
export const organizationRecruitmentOptions: SelectOption[] = (
  ['RECRUITING', 'UPCOMING', 'PAUSED', 'NOT_RECRUITING'] as OrgRecruitmentState[]
).map(st => ({
  label: {
    RECRUITING: '招新中',
    UPCOMING: '即将招新',
    PAUSED: '暂停招新',
    NOT_RECRUITING: '不招新'
  }[st],
  value: st
}))

/** 综合筛选（类型 + 招新状态 + 关键词），保持原顺序。 */
export function filterOrganizations(
  items: readonly OrganizationSummary[],
  filter: {
    type: OrganizationTypeFilter
    status: OrganizationRecruitmentFilter
    q: string
  },
  now: Date
): OrganizationSummary[] {
  const q = filter.q.trim().toLowerCase()
  return items.filter(org => {
    if (filter.type !== 'ALL' && org.type !== filter.type) return false
    if (filter.status !== 'ALL') {
      const state = deriveRecruitmentState(org, now)
      if (state !== filter.status) return false
    }
    if (q) {
      const haystack =
        `${org.name} ${organizationTypeLabel[org.type]} ${org.description ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/** 排序。DEFAULT 保持 fixtures 顺序；NAME 按名称拼音顺序（localeCompare zh）。 */
export function sortOrganizations(
  items: readonly OrganizationSummary[],
  sort: OrganizationSort
): OrganizationSummary[] {
  if (sort === 'NAME') {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  }
  return [...items]
}

/** 分页切片并夹逼页码。 */
export function paginateOrganizations<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number } {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize))
  const clamped = Math.min(safePage, totalPages)
  const start = (clamped - 1) * safeSize
  return { items: items.slice(start, start + safeSize), totalPages }
}

/** 把 URL query 归一为合法类型筛选。 */
export function normalizeOrgType(value: unknown): OrganizationTypeFilter {
  const allowed: OrganizationTypeFilter[] = [
    'ALL',
    'COLLEGE_DEPARTMENT',
    'STUDENT_CLUB',
    'LABORATORY',
    'INNOVATION_TEAM',
    'OTHER'
  ]
  return (allowed.find(item => item === value) as OrganizationTypeFilter) ?? 'ALL'
}

/** 把 URL query 归一为合法招新状态筛选。 */
export function normalizeOrgStatus(value: unknown): OrganizationRecruitmentFilter {
  if (
    value === 'RECRUITING' ||
    value === 'UPCOMING' ||
    value === 'PAUSED' ||
    value === 'NOT_RECRUITING'
  ) {
    return value
  }
  return 'ALL'
}

/** 把 URL query 归一为合法排序。 */
export function normalizeOrgSort(value: unknown): OrganizationSort {
  if (value === 'NAME' || value === 'DEFAULT') return value
  return 'DEFAULT'
}
