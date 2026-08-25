import { describe, expect, it } from 'vitest'

import { buildSearchIndex } from '@/features/search/lib/searchIndex'
import {
  announcementList,
  faqList,
  guideList,
  hotCompetitions,
  recentActivities,
  recruitTeams,
  recruitingOrganizations
} from '@/mocks/fixtures/homepage'

describe('FE-012 全局搜索索引', () => {
  it('覆盖全部搜索域并保持分组标题（含结果类型）', () => {
    const groups = buildSearchIndex()

    expect(groups.map(g => g.label)).toEqual([
      '竞赛',
      '组织',
      '组队',
      '活动',
      '常见问题',
      '指南',
      '公告'
    ])
  })

  it('各分组条目数量与 fixture 一致', () => {
    const groups = buildSearchIndex()
    const byId = Object.fromEntries(groups.map(g => [g.id, g.items.length]))

    expect(byId.competitions).toBe(hotCompetitions.length)
    expect(byId.organizations).toBe(recruitingOrganizations.length)
    expect(byId.teams).toBe(recruitTeams.length)
    expect(byId.activities).toBe(recentActivities.length)
    expect(byId.faq).toBe(faqList.length)
    expect(byId.guides).toBe(guideList.length)
    expect(byId.announcements).toBe(announcementList.length)
  })

  it('每条目提供可读标签、结果类型图标与跳转目标', () => {
    const groups = buildSearchIndex()

    for (const group of groups) {
      expect(group.id).toBeTruthy()
      for (const item of group.items) {
        expect(item.label).toBeTruthy()
        expect(item.icon).toMatch(/^i-lucide-/)
        expect(item.to).toMatch(/^\//)
      }
    }
  })
})
