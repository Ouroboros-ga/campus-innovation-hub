import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { CompetitionSummary } from '@/shared/types/homepage'

import { listCompetitions } from '../api/competitionApi'
import type { CompetitionQuery } from '../lib/competitionFilters'

/** 每页条数（服务端分页）。 */
export const COMPETITION_PAGE_SIZE = 6

/**
 * 竞赛发现查询（FE-101，API 驱动）。
 *
 * 设计来源：
 * - FrontendArchitecture：页面不直接 fetch；筛选/分页由 URL 承载（Vue Router）；
 * - §34.5：筛选值始终 URL-backed；
 * - §40/§41/§42：loading / empty / error 状态在本层暴露。
 *
 * 数据来自 `GET /api/competitions`（服务端筛选与分页），访问 `?error=1` 仍触发错误态（开发用）。
 */
export function useCompetitionQuery() {
  const route = useRoute()
  const router = useRouter()

  const items = ref<CompetitionSummary[]>([])
  const loading = ref(true)
  const error = ref(false)
  const total = ref(0)
  let seq = 0

  const query = computed<CompetitionQuery>(() => ({
    q: typeof route.query.q === 'string' ? route.query.q : '',
    status:
      typeof route.query.status === 'string' ? route.query.status : undefined,
    category:
      typeof route.query.category === 'string' ? route.query.category : undefined,
    format:
      typeof route.query.format === 'string' ? route.query.format : undefined,
    page:
      typeof route.query.page === 'string'
        ? Number.parseInt(route.query.page, 10) || 1
        : 1
  }))

  async function load() {
    const current = ++seq
    loading.value = true
    error.value = false
    try {
      const result = await listCompetitions({
        ...query.value,
        page: query.value.page ?? 1,
        pageSize: COMPETITION_PAGE_SIZE
      })
      if (current !== seq) return
      items.value = result.items
      total.value = result.total
    } catch {
      if (current !== seq) return
      error.value = true
    } finally {
      if (current === seq) loading.value = false
    }
  }

  watch(query, load, { immediate: true })

  /** 打补丁到查询串；除显式改页外，筛选变动都会重置到第 1 页。 */
  function updateQuery(patch: Partial<CompetitionQuery>) {
    const next: Record<string, string> = {}
    const q = patch.q ?? query.value.q
    const status = patch.status ?? query.value.status
    const category = patch.category ?? query.value.category
    const format = patch.format ?? query.value.format
    let page = patch.page ?? query.value.page ?? 1
    if (
      patch.page === undefined &&
      (patch.status !== undefined ||
        patch.category !== undefined ||
        patch.format !== undefined ||
        patch.q !== undefined)
    ) {
      page = 1
    }

    if (q) next.q = q
    if (status) next.status = status
    if (category) next.category = category
    if (format) next.format = format
    if (page > 1) next.page = String(page)
    void router.replace({ query: next })
  }

  /** 清除全部筛选，回到第 1 页。 */
  function reset() {
    void router.replace({ query: {} })
  }

  /** 错误态重试：移除 error 参数并重新加载。 */
  function reload() {
    const next: Record<string, string> = {}
    if (route.query.q) next.q = String(route.query.q)
    if (route.query.status) next.status = String(route.query.status)
    if (route.query.category) next.category = String(route.query.category)
    if (route.query.format) next.format = String(route.query.format)
    void router.replace({ query: next })
    void load()
  }

  return {
    query,
    items,
    loading,
    error,
    total,
    updateQuery,
    reset,
    reload
  }
}
