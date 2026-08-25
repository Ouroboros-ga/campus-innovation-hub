/**
 * 竞赛发现：筛选选项与纯函数逻辑（FE-020）
 *
 * 设计来源：
 * - FrontendDesign.md §34.5：筛选值由 URL 承载，不建独立手机端筛选状态；
 * - §24：仅用语义状态 / 简短分类做筛选；
 * - §43：筛选选项使用陈述事实的简体中文。
 *
 * 纯函数便于单元测试；URL 读写由 useCompetitionQuery composable 负责。
 */

import { deriveRegistrationState } from '@/shared/lib/date'
import {
  competitionCategoryLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'
import type {
  CompetitionCategory,
  CompetitionSummary,
  ParticipationMode,
  RegistrationState
} from '@/shared/types/homepage'

/** 通用下拉选项。 */
export interface SelectOption {
  label: string
  value: string
}

/** 从地址栏解析出的筛选查询。 */
export interface CompetitionQuery {
  q?: string
  status?: string
  category?: string
  format?: string
  page?: number
}

/** 报名状态筛选选项（竞赛均需报名，故只暴露前 3 个稳定状态）。 */
export const competitionStatusOptions: SelectOption[] = [
  { label: '报名中', value: 'OPEN' },
  { label: '即将开始', value: 'UPCOMING' },
  { label: '报名已结束', value: 'CLOSED' }
]

/** 分类筛选选项。 */
export const competitionCategoryOptions: SelectOption[] = (
  [
    'AI',
    'PROGRAMMING',
    'INNOVATION',
    'MATHEMATICAL_MODELING',
    'ELECTRONICS',
    'ROBOTICS'
  ] as CompetitionCategory[]
).map(category => ({
  label: competitionCategoryLabel[category],
  value: category
}))

/** 参赛形式筛选选项。 */
export const competitionFormatOptions: SelectOption[] = (
  ['TEAM', 'INDIVIDUAL'] as ParticipationMode[]
).map(mode => ({
  label: participationModeLabel[mode],
  value: mode
}))

/** 派生报名状态（时间驱动）。 */
export function deriveCompetitionState(
  item: CompetitionSummary,
  now: Date
): RegistrationState {
  return deriveRegistrationState({
    required: true,
    startAt: item.registrationStartAt,
    endAt: item.registrationEndAt,
    now
  })
}

/** 综合筛选（关键词 + 状态 + 分类 + 形式），保持原顺序。 */
export function applyCompetitionFilters(
  items: CompetitionSummary[],
  query: CompetitionQuery,
  now: Date
): CompetitionSummary[] {
  const q = query.q?.trim().toLowerCase() ?? ''
  return items.filter(item => {
    if (query.category && item.category !== query.category) return false
    if (query.format && item.participationMode !== query.format) return false
    if (query.status && deriveCompetitionState(item, now) !== query.status) {
      return false
    }
    if (q) {
      const haystack =
        `${item.name} ${item.edition} ${competitionCategoryLabel[item.category]}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/** 分页：返回当前页切片与元信息，并夹逼页码有效性。 */
export function paginate<T>(items: T[], page: number, pageSize: number) {
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
