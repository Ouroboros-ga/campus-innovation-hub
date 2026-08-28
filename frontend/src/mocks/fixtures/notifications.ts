/**
 * 通知 Fixtures（Mock-First 开发脚手架，与设计稿一致）。
 * 不虚构官方统计，日期为 ISO 8601，展示文本由 `shared/lib/date` 派生。
 */

import type { NotificationItem } from '@/features/notifications/types'

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString()
}
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

export const notificationFixtures: NotificationItem[] = [
  {
    id: 'notif-001',
    notification_type: 'COMPETITION',
    title: '竞赛报名结果通知',
    body: '你报名的「蓝桥杯全国软件和信息技术专业人才大赛」报名审核已通过',
    action_path: '/competitions/lanqiao-2026',
    read_at: null,
    created_at: minutesAgo(2)
  },
  {
    id: 'notif-002',
    notification_type: 'TEAM',
    title: '组队申请处理结果',
    body: '你的组队申请已被「深度学习小队」接受',
    action_path: '/teams/team-mcm-2026-01',
    read_at: null,
    created_at: minutesAgo(15)
  },
  {
    id: 'notif-003',
    notification_type: 'ACTIVITY',
    title: '活动报名成功提醒',
    body: '你已成功报名「AI 创新应用工作坊（第 4 期）」',
    action_path: '/activities/ai-sharing-4',
    read_at: null,
    created_at: hoursAgo(1)
  },
  {
    id: 'notif-004',
    notification_type: 'SYSTEM',
    title: '重要公告',
    body: '关于举办 2026 年秋季科创活动的通知',
    action_path: '/activities/announcements/announcement-mcm-2026',
    read_at: hoursAgo(1),
    created_at: hoursAgo(2)
  },
  {
    id: 'notif-005',
    notification_type: 'ORGANIZATION',
    title: '招新申请结果',
    body: '你的「人工智能协会」招新申请已通过初审',
    action_path: '/organizations/ai-union/recruitments/fall-2026',
    read_at: hoursAgo(2),
    created_at: hoursAgo(3)
  },
  {
    id: 'notif-006',
    notification_type: 'CONSULTATION',
    title: '咨询回复通知',
    body: '你的咨询「如何准备算法竞赛？」已有新回复',
    action_path: '/qa/questions/q-001',
    read_at: hoursAgo(4),
    created_at: hoursAgo(5)
  }
]
