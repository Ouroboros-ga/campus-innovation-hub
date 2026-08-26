import { teamDetails } from '@/mocks/fixtures/teams'
import type { TeamPostDetail } from '../types'

/**
 * 按 id 获取组队详情（FE-031）。
 * 详情 fixture 覆盖全部组队帖；未知 id 返回 null。
 */
export function findTeamDetail(id: string): TeamPostDetail | null {
  return teamDetails[id] ?? null
}
