/**
 * 竞赛详情开发 Fixtures（Mock-First）
 *
 * 规则（database-design.md §1.3 / §36）：
 * - 日期一律 ISO 8601（+08:00）；
 * - 不虚构官方统计；
 * - 关联的通知 / 指南 / 组队数据复用首页 fixtures 的子集；
 * - 这是开发脚手架，不是生产事实。
 */

import {
  announcementList,
  guideList,
  recruitTeams
} from '@/mocks/fixtures/homepage'
import type { CompetitionDetail } from '@/features/competitions/types'

/** 按 id 从首页摘要集中选取子集，用于关联区块。 */
function pickGuide(ids: string[]) {
  return guideList
    .filter(g => ids.includes(g.id))
    .map(g => ({
      id: g.id,
      title: g.title,
      publishedAt: g.publishedAt,
      detailPath: g.detailPath
    }))
}

function pickAnnouncement(ids: string[]) {
  return announcementList
    .filter(a => ids.includes(a.id))
    .map(a => ({
      id: a.id,
      title: a.title,
      publishedAt: a.publishedAt,
      detailPath: a.detailPath
    }))
}

function pickTeam(ids: string[]) {
  return recruitTeams
    .filter(t => ids.includes(t.id))
    .map(t => ({
      id: t.id,
      title: t.title,
      competitionName: t.competitionName,
      baseMemberCount: t.baseMemberCount,
      targetMemberCount: t.targetMemberCount,
      roles: t.roles,
      createdAt: t.createdAt,
      detailPath: t.detailPath
    }))
}

/** 完整详情样例（用于演示全部区块）。 */
export const competitionDetails: Record<string, CompetitionDetail> = {
  'csdc-2026': {
    id: 'csdc-2026',
    name: '中国大学生计算机设计大赛',
    edition: '2026',
    category: 'PROGRAMMING',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-01T00:00:00+08:00',
    registrationEndAt: '2026-08-31T23:59:59+08:00',
    eventStartAt: '2026-09-20T00:00:00+08:00',
    eventEndAt: '2026-09-22T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '中国大学生计算机设计大赛封面', src: null },
    detailPath: '/competitions/csdc-2026',
    suitableGrades: '本科生、专科生（在校生）',
    direction: '计算机设计、软件开发、算法应用',
    schoolOrganized: true,
    campusContact: '人工智能学院教务办公室 张老师（010-XXXX-XXXX）',
    intro:
      '中国大学生计算机设计大赛是我国面向在校大学生的重要计算机类赛事，覆盖软件开发、数字媒体、人工智能等多个赛道，注重作品创新性与工程实践能力。',
    whoShouldJoin: {
      grades: '在校本科生 / 专科生',
      prerequisites: '具备程序设计基础，能独立完成可运行的作品',
      skills: ['程序设计', '软件开发', '文档写作'],
      teamNeeded: true
    },
    timeline: [
      { date: '2026-08-01T00:00:00+08:00', title: '报名开始', description: '开放校内报名通道。' },
      { date: '2026-08-31T23:59:59+08:00', title: '报名截止', description: '关闭报名，逾期不可补报。' },
      { date: '2026-09-20T00:00:00+08:00', title: '校赛 / 初赛', description: '校内作品评审与选拔。' },
      { date: '2026-09-22T23:59:59+08:00', title: '入围公布', description: '公布晋级名单。' }
    ],
    relatedAnnouncements: pickAnnouncement(['announcement-csdc-selection', 'announcement-platform-launch']),
    relatedGuides: pickGuide(['guide-research-start']),
    recruitingTeams: pickTeam(['team-mcm-2026-01'])
  },
  'mcm-2026': {
    id: 'mcm-2026',
    name: '全国大学生数学建模竞赛',
    edition: '2026',
    category: 'MATHEMATICAL_MODELING',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-08-15T00:00:00+08:00',
    registrationEndAt: '2026-09-10T23:59:59+08:00',
    eventStartAt: '2026-09-17T18:00:00+08:00',
    eventEndAt: '2026-09-20T20:00:00+08:00',
    officialUrl: null,
    cover: { alt: '全国大学生数学建模竞赛封面', src: null },
    detailPath: '/competitions/mcm-2026',
    suitableGrades: '本科、专科在校生（每队 3 人）',
    direction: '数学建模、数值计算、论文写作',
    schoolOrganized: true,
    campusContact: '人工智能学院数学建模教研组（010-XXXX-XXXX）',
    intro:
      '全国大学生数学建模竞赛要求每队 3 名学生在规定时间内完成给定问题的建模、求解与论文写作，考察数学应用能力与团队协作。',
    whoShouldJoin: {
      grades: '在校本科生 / 专科生',
      prerequisites: '具备高等数学、线性代数与概率统计基础',
      skills: ['数学建模', '编程实现', '论文写作'],
      teamNeeded: true
    },
    timeline: [
      { date: '2026-08-15T00:00:00+08:00', title: '报名开始', description: '开放组队报名。' },
      { date: '2026-09-10T23:59:59+08:00', title: '报名截止', description: '截止组队与报名。' },
      { date: '2026-09-17T18:00:00+08:00', title: '竞赛开始', description: '题目发布，开始作答。' },
      { date: '2026-09-20T20:00:00+08:00', title: '提交论文', description: '提交完整论文。' }
    ],
    relatedAnnouncements: pickAnnouncement(['announcement-mcm-2026']),
    relatedGuides: pickGuide(['guide-math-modeling']),
    recruitingTeams: pickTeam(['team-mcm-2026-01', 'team-icpc-lookup'])
  },
  'challenge-cup-2026': {
    id: 'challenge-cup-2026',
    name: '「挑战杯」全国大学生课外学术科技作品竞赛',
    edition: '2026',
    category: 'INNOVATION',
    level: 'NATIONAL',
    participationMode: 'TEAM',
    registrationStartAt: '2026-09-01T00:00:00+08:00',
    registrationEndAt: '2026-09-30T23:59:59+08:00',
    eventStartAt: '2026-11-15T00:00:00+08:00',
    eventEndAt: '2026-11-18T23:59:59+08:00',
    officialUrl: null,
    cover: { alt: '挑战杯竞赛封面', src: null },
    detailPath: '/competitions/challenge-cup-2026',
    suitableGrades: '在校本专科生、研究生',
    direction: '课外学术科技作品、创业计划',
    schoolOrganized: true,
    campusContact: '校团委科创部（010-XXXX-XXXX）',
    intro:
      '「挑战杯」是全国性的大学生课外学术科技作品与创业计划竞赛，鼓励学生围绕真实问题开展研究并形成成果。',
    whoShouldJoin: {
      grades: '在校本专科生 / 研究生',
      prerequisites: '有较成熟的课题或创业构思，能投入持续研究',
      skills: ['课题研究', '创新创业', '团队协作'],
      teamNeeded: true
    },
    timeline: [
      { date: '2026-09-01T00:00:00+08:00', title: '报名开始', description: '开放作品申报。' },
      { date: '2026-09-30T23:59:59+08:00', title: '报名截止', description: '截止作品申报。' },
      { date: '2026-11-15T00:00:00+08:00', title: '终审决赛', description: '现场答辩与评审。' }
    ],
    relatedAnnouncements: pickAnnouncement(['announcement-platform-launch']),
    relatedGuides: pickGuide(['guide-innovation-training']),
    recruitingTeams: pickTeam(['team-challenge-ai'])
  }
}
