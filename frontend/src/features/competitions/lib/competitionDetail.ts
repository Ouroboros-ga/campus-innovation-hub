import { competitions } from '@/mocks/fixtures/competitions'
import { competitionDetails } from '@/mocks/fixtures/competitions-detail'
import type { CompetitionDetail } from '../types'

/** 从摘要派生一个基础详情（当没有专门详情时兜底，保证任意合法 id 可渲染）。 */
function fallbackDetail(id: string): CompetitionDetail | null {
  const summary = competitions.find(item => item.id === id)
  if (!summary) return null

  const timeline = []
  if (summary.registrationStartAt) {
    timeline.push({
      date: summary.registrationStartAt,
      title: '报名开始',
      description: null
    })
  }
  if (summary.registrationEndAt) {
    timeline.push({
      date: summary.registrationEndAt,
      title: '报名截止',
      description: null
    })
  }
  if (summary.eventStartAt) {
    timeline.push({ date: summary.eventStartAt, title: '比赛开始', description: null })
  }
  if (summary.eventEndAt) {
    timeline.push({ date: summary.eventEndAt, title: '比赛结束', description: null })
  }

  return {
    ...summary,
    suitableGrades: null,
    direction: null,
    schoolOrganized: null,
    campusContact: null,
    intro:
      '本竞赛为面向在校学生的科创类赛事，报名与比赛安排以官方通知与校内公告为准。',
    whoShouldJoin: {
      grades: '详见赛事通知',
      prerequisites: '详见赛事通知',
      skills: [],
      teamNeeded: summary.participationMode === 'TEAM'
    },
    timeline,
    relatedAnnouncements: [],
    relatedGuides: [],
    recruitingTeams: []
  }
}

/** 按 id 获取竞赛详情；无专门详情时返回兜底；未知 id 返回 null。 */
export function findCompetitionDetail(
  id: string
): CompetitionDetail | null {
  if (competitionDetails[id]) return competitionDetails[id]
  return fallbackDetail(id)
}
