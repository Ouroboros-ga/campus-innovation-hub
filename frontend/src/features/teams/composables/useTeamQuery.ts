import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { teamCompetitionOptions } from '../lib/teamFilters'
import { listTeams } from '../api/teamApi'
import type { TeamPost, TeamQuery } from '../types'
import { teamPosts } from '@/mocks/fixtures/teams'

/** 每页条数（服务端分页）。 */
export const TEAM_PAGE_SIZE = 6

/**
 * 组队广场查询（FE-102，API 驱动）。
 *
 * 数据来自 `GET /api/teams`（服务端筛选与分页）；筛选/分页由 URL 承载。
 * loading / empty / error 在本层暴露；`closePost(id)` 为本地演示状态（作者鉴权未接线）。
 */
export function useTeamQuery() {
  const route = useRoute()
  const router = useRouter()

  const items = ref<TeamPost[]>([])
  const loading = ref(true)
  const error = ref(false)
  const total = ref(0)
  let seq = 0

  const query = computed<TeamQuery>(() => ({
    competition:
      typeof route.query.competition === 'string'
        ? route.query.competition
        : undefined,
    postType:
      typeof route.query.postType === 'string' ? route.query.postType : undefined,
    status:
      typeof route.query.status === 'string' ? route.query.status : undefined,
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
      const result = await listTeams({
        competitionId: query.value.competition,
        postType: query.value.postType,
        status: query.value.status,
        page: query.value.page ?? 1,
        pageSize: TEAM_PAGE_SIZE
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

  /** 关联竞赛筛选选项（由 fixtures 派生，保持稳定）。 */
  const competitionOptions = computed(() => teamCompetitionOptions(teamPosts))

  /** 打补丁到查询串；除显式改页外，筛选变动都会重置到第 1 页。 */
  function updateQuery(patch: Partial<TeamQuery>) {
    const next: Record<string, string> = {}
    const competition = patch.competition ?? query.value.competition
    const postType = patch.postType ?? query.value.postType
    const status = patch.status ?? query.value.status
    let page = patch.page ?? query.value.page ?? 1
    if (
      patch.page === undefined &&
      (patch.competition !== undefined ||
        patch.postType !== undefined ||
        patch.status !== undefined)
    ) {
      page = 1
    }

    if (competition) next.competition = competition
    if (postType) next.postType = postType
    if (status) next.status = status
    if (page > 1) next.page = String(page)
    void router.replace({ query: next })
  }

  /** 清除全部筛选，回到第 1 页。 */
  function reset() {
    void router.replace({ query: {} })
  }

  /** 错误态重试。 */
  function reload() {
    const next: Record<string, string> = {}
    if (route.query.competition) next.competition = String(route.query.competition)
    if (route.query.postType) next.postType = String(route.query.postType)
    if (route.query.status) next.status = String(route.query.status)
    if (route.query.page) next.page = String(route.query.page)
    void router.replace({ query: next })
    void load()
  }

  /** 关闭本人发布的帖子（本地演示状态，作者鉴权未接线）。 */
  function closePost(id: string) {
    const post = items.value.find(item => item.id === id)
    if (post) post.status = 'CLOSED'
  }

  return {
    query,
    items,
    loading,
    error,
    total,
    competitionOptions,
    updateQuery,
    reset,
    reload,
    closePost
  }
}
