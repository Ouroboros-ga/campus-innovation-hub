import { competitionLevelLabel, participationModeLabel } from '@/shared/lib/domain-labels'
import { competitions } from '@/mocks/fixtures/competitions'
import { competitionDetails } from '@/mocks/fixtures/competitions-detail'
import type { CompetitionDetail } from '../types'

/**
 * 从摘要派生一个基础详情（当没有专门详情时兜底，保证任意合法 id 可渲染）。
 *
 * 兜底详情仅用「已知事实 + 明确未知」填充：亮点 / 参赛要求等展示文案，
 * 若无法从摘要推导，则以「详见赛事通知」占位，不虚构官方数据。
 */
function fallbackDetail(id: string): CompetitionDetail | null {
  const summary = competitions.find(item => item.id === id)
  if (!summary) return null

  const timeline = []
  if (summary.registrationStartAt) {
    timeline.push({ date: summary.registrationStartAt, title: '报名开始', description: null })
  }
  if (summary.registrationEndAt) {
    timeline.push({
      date: summary.registrationEndAt,
      title: '报名截止',
      description: null,
      highlighted: true
    })
  }
  if (summary.eventStartAt) {
    timeline.push({ date: summary.eventStartAt, title: '赛事开始', description: null })
  }
  if (summary.eventEndAt) {
    timeline.push({ date: summary.eventEndAt, title: '赛事结束', description: null })
  }

  const teamText = participationModeLabel[summary.participationMode]
  const levelNote = `${competitionLevelLabel[summary.level]}赛事认证`

  return {
    ...summary,
    brief: '聚焦学生专业技能与创新实践，报名与比赛安排以官方通知为准。',
    intro:
      '本竞赛为面向在校学生的科创类赛事，报名与比赛安排以官方通知与校内公告为准。',
    whoShouldJoin: '面向在校学生（详见赛事通知）。',
    highlights: [
      { icon: 'i-lucide-graduation-cap', title: '面向高校学生', note: '在校本科 / 专科学生' },
      { icon: 'i-lucide-users', title: '参赛形式', note: teamText },
      { icon: 'i-lucide-badge-check', title: '权威认证', note: levelNote },
      { icon: 'i-lucide-award', title: '荣誉与奖励', note: '证书 / 奖项' }
    ],
    requirement: {
      audience: '在校学生（详见赛事通知）',
      teamRequirement:
        summary.participationMode === 'TEAM' ? '团队赛（需组队参加）' : '个人参赛',
      domains: '详见赛事通知',
      organizer: '详见赛事通知',
      contactEmail: null
    },
    timeline,
    registrationTips: [
      '请以官方通知为准完成报名',
      '名额有限，建议尽早提交报名信息',
      '关注平台通知获取最新赛事安排'
    ],
    officialLinks: summary.officialUrl
      ? [{ label: '官方网站', url: summary.officialUrl }]
      : [],
    guidePath: null,
    relatedAnnouncements: [],
    relatedGuides: [],
    recruitingTeams: []
  }
}

/** 按 id 获取竞赛详情；无专门详情时返回兜底；未知 id 返回 null。 */
export function findCompetitionDetail(id: string): CompetitionDetail | null {
  if (competitionDetails[id]) return competitionDetails[id]
  return fallbackDetail(id)
}
