import { ref } from 'vue'

import { listActivities, listAnnouncements } from '../api/dynamicsApi'
import type { DynamicsActivity, DynamicsAnnouncement } from '../types'

/** 集合一次拉取规模（V0.1 数据量小；契约活动列表项缺报名窗口，筛排序由页面客户端完成）。 */
const COLLECTION_PAGE_SIZE = 100

/**
 * 校园动态集合查询（FE-104，API 驱动）。
 *
 * 数据来源 `GET /api/activities` 与 `GET /api/announcements`（均 PUBLIC）。
 * 页面按 tab 使用客户端筛选 / 分页（活动状态/类型、公告来源），本层仅拉取集合并暴露
 * loading / error / reload。
 */
export function useDynamicsQuery() {
  const activities = ref<DynamicsActivity[]>([])
  const announcements = ref<DynamicsAnnouncement[]>([])
  const loading = ref(true)
  const error = ref(false)
  let seq = 0

  async function load() {
    const current = ++seq
    loading.value = true
    error.value = false
    try {
      const [activitiesResult, announcementsResult] = await Promise.all([
        listActivities({ page: 1, pageSize: COLLECTION_PAGE_SIZE }),
        listAnnouncements({ page: 1, pageSize: COLLECTION_PAGE_SIZE })
      ])
      if (current !== seq) return
      activities.value = activitiesResult.items
      announcements.value = announcementsResult.items
    } catch {
      if (current !== seq) return
      error.value = true
    } finally {
      if (current === seq) loading.value = false
    }
  }

  function reload() {
    void load()
  }

  void load()

  return { activities, announcements, loading, error, reload }
}
