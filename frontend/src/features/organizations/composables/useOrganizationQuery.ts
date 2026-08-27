import { ref } from 'vue'

import { listOrganizations } from '../api/organizationApi'
import type { OrganizationSummary } from '../types'

/**
 * 组织集合一次拉取规模（V0.1 组织数量小；契约列表项过薄，筛排序由页面客户端完成）。
 * 受契约限制：PUBLIC 列表 page_size 最大 100（见 docs/api/EndpointReference.md「分页」、docs/api/APIContract.md §1.5），
 * 超过会被后端以 400 拒绝。
 */
const COLLECTION_PAGE_SIZE = 100

/**
 * 组织集合查询（FE-103，API 驱动）。
 *
 * 数据来自 `GET /api/organizations`（PUBLIC）。契约列表项仅含 `is_recruiting`，
 * 而页面还需按招新状态 / 名称做筛选与排序（契约无法表达），故在此拉取集合，
 * 由页面沿用 `organizationFilters` 纯函数做客户端筛选 / 排序 / 分页。
 * `loading / error / reload` 在本层暴露。
 */
export function useOrganizationQuery() {
  const items = ref<OrganizationSummary[]>([])
  const loading = ref(true)
  const error = ref(false)
  let seq = 0

  async function load() {
    const current = ++seq
    loading.value = true
    error.value = false
    try {
      const result = await listOrganizations({
        page: 1,
        pageSize: COLLECTION_PAGE_SIZE
      })
      if (current !== seq) return
      items.value = result.items
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

  return { items, loading, error, reload }
}
