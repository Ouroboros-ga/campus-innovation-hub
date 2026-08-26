/**
 * 校园动态详情辅助（FE-051 / FE-052）
 *
 * - `findAnnouncement` / `findActivity`：按 id 从 fixtures 查详情
 * - `relatedAnnouncementsForActivity`：活动关联公告（announcement.linkedObject → activity）
 * - `mdToPlainText`：把 Markdown 正文以安全纯文本呈现（mock 阶段零依赖渲染，
 *   不引入 marked/DOMPurify；真实正文在 API 阶段接入受信渲染方案）。
 */

import {
  dynamicsActivities,
  dynamicsAnnouncements
} from '@/mocks/fixtures/dynamics'
import type {
  DynamicsActivity,
  DynamicsAnnouncement
} from '../types'

/** 按 id 查找公告。 */
export function findAnnouncement(id: string): DynamicsAnnouncement | undefined {
  return dynamicsAnnouncements.find(item => item.id === id)
}

/** 按 id 查找活动。 */
export function findActivity(id: string): DynamicsActivity | undefined {
  return dynamicsActivities.find(item => item.id === id)
}

/** 关联到指定活动 id 的公告（announcement.linkedObject.kind === 'ACTIVITY'）。 */
export function relatedAnnouncementsForActivity(
  activityId: string
): DynamicsAnnouncement[] {
  return dynamicsAnnouncements
    .filter(item => item.linkedObject?.kind === 'ACTIVITY' && item.linkedObject.to === `/activities/${activityId}`)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/**
 * 把受支持的 Markdown 子集安全降级为纯文本（保留换行，去掉强调/标题/列表标记）。
 * 用于正文展示；不做 HTML 渲染，避免引入 XSS 面。
 */
export function mdToPlainText(md: string | null): string {
  if (!md) return ''
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
}
