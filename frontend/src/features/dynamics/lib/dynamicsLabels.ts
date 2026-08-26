/**
 * 校园动态枚举 → 简体中文展示标签 / 图标（feature-local）
 *
 * 这里的标签属于「校园动态」feature 的展示语义，故放置在 feature 内部，
 * 避免 shared 反向依赖 feature（FrontendArchitecture.md 依赖方向：
 * pages -> features -> shared）。
 */

import type {
  AnnouncementLinkedKind,
  AnnouncementPublisherScope
} from '../types'

/** 公告发布来源展示标签（学院 / 学校 / 平台）。 */
export const publisherScopeLabel: Record<AnnouncementPublisherScope, string> = {
  ACADEMY: '学院',
  UNIVERSITY: '学校',
  PLATFORM: '平台'
}

/** 公告发布来源对应的 Lucide 图标名。 */
export const publisherScopeIcon: Record<AnnouncementPublisherScope, string> = {
  ACADEMY: 'i-lucide-building-2',
  UNIVERSITY: 'i-lucide-school',
  PLATFORM: 'i-lucide-layout-grid'
}

/** 公告关联对象类型展示标签。 */
export const announcementLinkedKindLabel: Record<AnnouncementLinkedKind, string> = {
  COMPETITION: '竞赛',
  ACTIVITY: '活动',
  ORGANIZATION: '组织',
  RECRUITMENT: '招新'
}

/** 公告关联对象类型对应的 Lucide 图标名。 */
export const announcementLinkedKindIcon: Record<AnnouncementLinkedKind, string> = {
  COMPETITION: 'i-lucide-trophy',
  ACTIVITY: 'i-lucide-calendar-days',
  ORGANIZATION: 'i-lucide-building-2',
  RECRUITMENT: 'i-lucide-megaphone'
}
