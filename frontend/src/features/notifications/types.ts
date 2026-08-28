/**
 * 通知领域类型（FE-通知中心）。
 * 对应后端 `notifications_notification`：`notification_type` 为 TextChoices，
 * 响应字段为 `NotificationItem {id, notification_type, title, body, action_path, read_at, created_at}`。
 */

export type NotificationType =
  | 'SYSTEM'
  | 'COMPETITION'
  | 'TEAM'
  | 'ACTIVITY'
  | 'ORGANIZATION'
  | 'CONSULTATION'

export interface NotificationItem {
  id: string
  notification_type: NotificationType
  title: string
  body: string | null
  action_path: string | null
  read_at: string | null
  created_at: string
}

/** 前端展示用：带派生 read 状态。 */
export interface NotificationView extends NotificationItem {
  isUnread: boolean
}

/** 双端设计图分类标签（桌面下拉/移动端全量页共用）。 */
export type NotificationTabKey = 'all' | 'unread' | 'mention' | 'system'

/** @我 的语义：与我有关的申请/组队/咨询，映射到后端 TEAM/ORGANIZATION/CONSULTATION。 */
export const MENTION_TYPES: NotificationType[] = ['TEAM', 'ORGANIZATION', 'CONSULTATION']

export const NOTIFICATION_TAB_LABEL: Record<NotificationTabKey, string> = {
  all: '全部',
  unread: '未读',
  mention: '@我',
  system: '系统'
}

/** 通知类型 -> Lucide 图标名（与设计稿一致）。 */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  COMPETITION: 'i-lucide-trophy',
  TEAM: 'i-lucide-users',
  ACTIVITY: 'i-lucide-calendar-days',
  ORGANIZATION: 'i-lucide-building-2',
  CONSULTATION: 'i-lucide-message-circle-more',
  SYSTEM: 'i-lucide-megaphone'
}

/** 通知类型 -> 浅色图标底色（亮/暗共用 token 透底）。 */
export const NOTIFICATION_TYPE_BG: Record<NotificationType, string> = {
  COMPETITION: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  TEAM: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  ACTIVITY: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  ORGANIZATION: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  CONSULTATION: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  SYSTEM: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
}
