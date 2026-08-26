/**
 * 组织枚举 → 简体中文展示标签 / 颜色（feature-local）
 *
 * 组织类型标签复用于 shared/lib/domain-labels 的 `organizationTypeLabel`；
 * 这里只放组织招新状态的标签与语义色。
 */

import type { OrgRecruitmentState } from '../types'

/** 招新状态展示标签。 */
export const orgRecruitmentStateLabel: Record<OrgRecruitmentState, string> = {
  RECRUITING: '招新中',
  UPCOMING: '即将招新',
  PAUSED: '暂停招新',
  NOT_RECRUITING: '不招新'
}

/** 招新状态 → 文字语义色 class（§7.3，状态不只靠颜色表达时文字可读）。 */
export function orgRecruitmentStateTextClass(
  state: OrgRecruitmentState
): string {
  if (state === 'RECRUITING') return 'text-success-600 dark:text-success-400'
  if (state === 'UPCOMING') return 'text-warning-600 dark:text-warning-400'
  return 'text-muted'
}

/** 招新状态 → 小圆点语义色 class（装饰性状态点，仅配合文字使用 §31）。 */
export function orgRecruitmentStateDotClass(
  state: OrgRecruitmentState
): string {
  if (state === 'RECRUITING') return 'bg-success-500'
  if (state === 'UPCOMING') return 'bg-warning-500'
  return 'bg-neutral-400'
}
