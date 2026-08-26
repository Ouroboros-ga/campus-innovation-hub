/**
 * 组队广场：筛选选项与纯函数逻辑（FE-030）
 *
 * 设计来源：
 * - FrontendDesign.md §34.5：筛选值由 URL 承载，不建独立手机端筛选状态；
 * - §24：仅用语义状态 / 简短分类做筛选；
 * - §43：筛选选项使用陈述事实的简体中文。
 *
 * 纯函数便于单元测试；URL 读写由 useTeamQuery composable 负责。
 */

import type { TeamPostStatus, TeamPostType } from '@/shared/types/homepage'

import type { TeamPost, TeamQuery } from '../types'

/** 通用筛选/下拉选项。 */
export interface SelectOption {
  label: string
  value: string
}

/** 信息类型筛选选项。 */
export const teamPostTypeOptions: SelectOption[] = (
  ['TEAM_RECRUITING', 'PERSON_LOOKING'] as TeamPostType[]
).map(type => ({
  label: type === 'TEAM_RECRUITING' ? '队伍找人' : '个人找队',
  value: type
}))

/** 状态筛选选项。 */
export const teamStatusOptions: SelectOption[] = (
  ['RECRUITING', 'FULL', 'CLOSED'] as TeamPostStatus[]
).map(status => ({
  label: { RECRUITING: '招募中', FULL: '已满', CLOSED: '已关闭' }[status],
  value: status
}))

/** 由帖子列表派生「关联竞赛」选项（去重，保持原顺序）。 */
export function teamCompetitionOptions(items: readonly TeamPost[]): SelectOption[] {
  const seen = new Set<string>()
  const options: SelectOption[] = []
  for (const item of items) {
    const key = `${item.competitionId}::${item.competitionName}`
    if (seen.has(key)) continue
    seen.add(key)
    options.push({ label: item.competitionName, value: item.competitionId })
  }
  return options
}

/** 综合筛选（关联竞赛 + 信息类型 + 状态），保持原顺序。 */
export function filterTeamPosts(
  items: readonly TeamPost[],
  query: TeamQuery
): TeamPost[] {
  return items.filter(item => {
    if (query.competition && item.competitionId !== query.competition) return false
    if (query.postType && item.postType !== query.postType) return false
    if (query.status && item.status !== query.status) return false
    return true
  })
}

/** 分页切片并夹逼页码。 */
export function paginateTeamPosts<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; totalPages: number; page: number } {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage
  }
}
