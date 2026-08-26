/**
 * 组队帖子展示标签与徽标元数据（FE-030）。
 *
 * 只映射稳定枚举到展示文案；颜色为语义色（§7.3 / §24），文字必须可读。
 */

import type { TeamPostStatus, TeamPostType } from '@/shared/types/homepage'

export interface BadgeMeta {
  label: string
  color: 'success' | 'info' | 'warning' | 'neutral'
}

/** 信息类型徽标：队伍找人（绿）/ 个人找队（蓝）。 */
export const teamPostTypeMeta: Record<TeamPostType, BadgeMeta> = {
  TEAM_RECRUITING: { label: '队伍找人', color: 'success' },
  PERSON_LOOKING: { label: '个人找队', color: 'info' }
}

/** 状态徽标：招募中（绿）/ 已满（黄）/ 已关闭（灰）。 */
export const teamStatusMeta: Record<TeamPostStatus, BadgeMeta> = {
  RECRUITING: { label: '招募中', color: 'success' },
  FULL: { label: '已满', color: 'warning' },
  CLOSED: { label: '已关闭', color: 'neutral' }
}
