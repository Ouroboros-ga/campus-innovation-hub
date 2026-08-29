import { onMounted, ref } from 'vue'

import { listCompetitions } from '@/features/competitions/api/competitionApi'

export interface CompetitionOption {
  label: string
  value: string
}

/**
 * 组队发布页竞赛下拉（FE-032 动态化）。
 *
 * - 调用 `GET /api/competitions?page=1&page_size=50` 获取可关联竞赛；
 * - 失败暴露 error，页面可重试；不回退到 fixture，避免线上/线下不一致；
 * - 仅映射 `id -> value` / `name -> label`，不过滤状态（由后端 publication_state 决定可见性）。
 */
export function useTeamCompetitionOptions() {
  const options = ref<CompetitionOption[]>([])
  const loading = ref(true)
  const error = ref(false)

  let seq = 0

  async function load(): Promise<void> {
    const current = ++seq
    loading.value = true
    error.value = false
    try {
      const result = await listCompetitions({ page: 1, pageSize: 50 })
      if (current !== seq) return
      options.value = result.items.map(item => ({
        label: item.name,
        value: item.id
      }))
    } catch {
      if (current !== seq) return
      error.value = true
      options.value = []
    } finally {
      if (current === seq) loading.value = false
    }
  }

  function reload(): void {
    void load()
  }

  onMounted(() => {
    void load()
  })

  return { options, loading, error, reload }
}
