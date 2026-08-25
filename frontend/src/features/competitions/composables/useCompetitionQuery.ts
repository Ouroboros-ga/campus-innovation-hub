import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { competitions } from '@/mocks/fixtures/competitions'
import {
  applyCompetitionFilters,
  paginate,
  type CompetitionQuery
} from '../lib/competitionFilters'

/** 每页条数。 */
export const COMPETITION_PAGE_SIZE = 6

/** 加载模拟时长（mock）。 */
const LOADING_DELAY_MS = 350

/**
 * 竞赛发现查询（FE-020）。
 *
 * 设计来源：
 * - FrontendArchitecture：页面不直接 fetch；筛选属 URL 承载的可分享状态（Vue Router）；
 * - §34.5：筛选值始终 URL-backed，不建独立手机筛选状态；
 * - §40/§41/§42：empty / loading / error 状态在本层暴露。
 *
 * 加载与错误为 mock-first 模拟：进入页面先 loading，随后展示 fixtures；
 * 访问 `?error=1` 可触发错误态（开发用），`reload()` 重试并清除该参数。
 */
export function useCompetitionQuery() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(true)
  const error = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const query = computed<CompetitionQuery>(() => ({
    q: typeof route.query.q === 'string' ? route.query.q : '',
    status: typeof route.query.status === 'string' ? route.query.status : undefined,
    category:
      typeof route.query.category === 'string' ? route.query.category : undefined,
    format:
      typeof route.query.format === 'string' ? route.query.format : undefined,
    page:
      typeof route.query.page === 'string'
        ? Number.parseInt(route.query.page, 10) || 1
        : 1
  }))

  const filtered = computed(() => applyCompetitionFilters(competitions, query.value, new Date()))
  const paged = computed(() =>
    paginate(filtered.value, query.value.page ?? 1, COMPETITION_PAGE_SIZE)
  )

  function startLoading() {
    loading.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      loading.value = false
      error.value = route.query.error === '1'
    }, LOADING_DELAY_MS)
  }

  /** 打补丁到查询串；除显式改页外，筛选变动都会重置到第 1 页。 */
  function updateQuery(patch: Partial<CompetitionQuery>) {
    const next: Record<string, string> = {}

    const q = patch.q ?? query.value.q
    const status = patch.status ?? query.value.status
    const category = patch.category ?? query.value.category
    const format = patch.format ?? query.value.format
    let page = patch.page ?? query.value.page ?? 1
    if (patch.page === undefined && (patch.status !== undefined || patch.category !== undefined || patch.format !== undefined || patch.q !== undefined)) {
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
    startLoading()
  }

  onMounted(startLoading)
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    query,
    filtered,
    paged,
    loading,
    error,
    updateQuery,
    reset,
    reload
  }
}
