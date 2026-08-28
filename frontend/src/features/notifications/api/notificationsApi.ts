/**
 * 通知 API 模块（FrontendArchitecture: Page -> composable -> feature API -> shared http）。
 * 映射 `docs/api/APIContract.md §3.9`。
 */

import { http } from '@/shared/http/client'
import type { Paginated } from '@/shared/http/types'
import type { NotificationItem, NotificationType } from '@/features/notifications/types'

export interface NotificationListParams {
  unread?: boolean
  type?: NotificationType
  page?: number
  pageSize?: number
}

type NotificationListDto = Paginated<NotificationItem>

/** 通知列表（LOGIN，分页）。 */
export async function listNotifications(params: NotificationListParams = {}): Promise<{
  items: NotificationItem[]
  total: number
}> {
  const response = await http.get<NotificationListDto>('/notifications', {
    query: {
      unread: params.unread,
      type: params.type,
      page: params.page,
      page_size: params.pageSize
    }
  })
  return { items: response.results, total: response.count }
}

/** 未读数（LOGIN）。 */
export async function getUnreadCount(): Promise<number> {
  const response = await http.get<{ count: number }>('/notifications/unread-count')
  return response.count
}

/** 标记单条已读（LOGIN+CSRF，204）。 */
export async function markRead(id: string): Promise<void> {
  await http.post(`/notifications/${id}/read`)
}

/** 全部已读（LOGIN+CSRF，204）。 */
export async function markAllRead(): Promise<void> {
  await http.post('/notifications/read-all')
}
