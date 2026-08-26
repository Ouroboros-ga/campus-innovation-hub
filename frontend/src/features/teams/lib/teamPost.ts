/**
 * 创建组队帖子（FE-032）mock-first 逻辑。
 *
 * - teamPostTypeOptions / teamPostCompetitionOptions：表单选项；
 * - validateTeamPostDraft：字段级校验（必填 + 人数逻辑 + 岗位非空）；
 * - submitTeamPost：异步 mock 提交（延迟），内存记录，返回创建成功的帖子；
 * - 无真实后端；创建成功后写入内存，不修改广场 fixture。
 */

import { competitions } from '@/mocks/fixtures/competitions'
import type { TeamPost, TeamPostDraft } from '../types'

/** 提交延迟（mock）。 */
const SUBMIT_DELAY_MS = 600

/** 信息类型选项。 */
export const teamPostTypeOptions: Array<{ label: string; value: string }> = [
  { label: '队伍找人', value: 'TEAM_RECRUITING' },
  { label: '个人找队', value: 'PERSON_LOOKING' }
]

/** 关联竞赛选项（由竞赛 fixture 派生）。 */
export function teamPostCompetitionOptions(): Array<{ label: string; value: string }> {
  return competitions.map(competition => ({
    label: competition.name,
    value: competition.id
  }))
}

/** 校验发布组队表单：返回字段级错误，无错误返回 `{}`。 */
export function validateTeamPostDraft(
  draft: Pick<
    TeamPostDraft,
    | 'competitionId'
    | 'postType'
    | 'title'
    | 'direction'
    | 'baseMemberCount'
    | 'targetMemberCount'
    | 'roles'
    | 'goal'
    | 'expectedEffort'
    | 'contact'
  >
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.competitionId) errors.competitionId = '请选择关联竞赛'
  if (!draft.postType) errors.postType = '请选择信息类型'
  if (!draft.title.trim()) errors.title = '请填写标题'
  if (!draft.direction.trim()) errors.direction = '请填写项目 / 方向简介'
  if (!draft.baseMemberCount || draft.baseMemberCount < 1) {
    errors.baseMemberCount = '当前人数至少为 1'
  }
  if (!draft.targetMemberCount || draft.targetMemberCount < 1) {
    errors.targetMemberCount = '计划人数至少为 1'
  } else if (draft.targetMemberCount < (draft.baseMemberCount || 1)) {
    errors.targetMemberCount = '计划人数不能少于当前人数'
  }
  if (draft.roles.length === 0) errors.roles = '请至少填写一个招募岗位'
  if (!draft.goal.trim()) errors.goal = '请填写目标'
  if (!draft.expectedEffort.trim()) errors.expectedEffort = '请填写预计投入时间'
  if (!draft.contact.trim()) errors.contact = '请填写联系方式'
  return errors
}

/** 内存中的已创建组队记录。 */
const createdPosts: TeamPost[] = []

/** 由草稿组装一条队伍帖子。 */
function buildTeamPost(draft: TeamPostDraft): TeamPost {
  const competition = competitions.find(item => item.id === draft.competitionId)
  const id = `team-create-${Date.now()}`
  return {
    id,
    title: draft.title.trim(),
    postType: draft.postType,
    status: 'RECRUITING',
    competitionId: draft.competitionId,
    competitionName: competition?.name ?? '未知竞赛',
    baseMemberCount: draft.baseMemberCount,
    targetMemberCount: draft.targetMemberCount,
    roles: draft.roles,
    skills: draft.skills,
    goal: draft.goal.trim(),
    creatorName: '我',
    creatorGrade: '',
    creatorMajor: '',
    isOwned: true,
    publishedAt: new Date().toISOString(),
    detailPath: `/teams/${id}`
  }
}

/** 提交组队（mock 延迟后成功），返回创建成功的帖子。 */
export function submitTeamPost(draft: TeamPostDraft): Promise<TeamPost> {
  const post = buildTeamPost(draft)
  return new Promise(resolve => {
    setTimeout(() => {
      createdPosts.push(post)
      resolve(post)
    }, SUBMIT_DELAY_MS)
  })
}

/** 测试用：清空内存中的组队提交记录。 */
export function resetTeamPosts(): void {
  createdPosts.length = 0
}
