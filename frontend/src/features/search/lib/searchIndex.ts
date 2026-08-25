/**
 * 全局搜索索引（FE-012）。
 *
 * 从首页领域 fixtures 构建「全站搜索」结果组（mock-first）。
 * 设计来源：
 * - FrontendDesign.md §30：搜索域为竞赛 / 组织 / 组队 / 活动 / FAQ / 指南 / 公告；
 * - 结果行紧凑、显示结果类型，不做卡片墙；
 * - database-design.md §28 / FrontendDesign.md §47：不虚构浏览量 / 热度等指标。
 */

import {
  announcementList,
  faqList,
  guideList,
  hotCompetitions,
  recentActivities,
  recruitTeams,
  recruitingOrganizations
} from '@/mocks/fixtures/homepage'
import {
  activityTypeLabel,
  competitionLevelLabel,
  faqCategoryLabel,
  guideCategoryLabel,
  organizationTypeLabel,
  participationModeLabel
} from '@/shared/lib/domain-labels'
import {
  formatCompactDate,
  formatDateTimeCompact
} from '@/shared/lib/date'

/** 单条可搜索记录（command palette 数据模型的精简视图模型）。 */
export interface SearchEntry {
  id: string
  label: string
  description?: string
  icon?: string
  to: string
}

/** 搜索结果分组。 */
export interface SearchGroup {
  id: string
  label: string
  items: SearchEntry[]
}

/**
 * 构建全局搜索分组。
 *
 * 各条目仅继承其领域实际存在的字段，不编造作者 / 热度 / 浏览量等缺失字段；
 * 描述文本由领域标签与日期在运行时派生。
 */
export function buildSearchIndex(): SearchGroup[] {
  const competitions: SearchGroup = {
    id: 'competitions',
    label: '竞赛',
    items: hotCompetitions.map(item => ({
      id: item.id,
      label: `${item.name} ${item.edition}`.trim(),
      description: `${competitionLevelLabel[item.level]} · ${participationModeLabel[item.participationMode]}`,
      icon: 'i-lucide-trophy',
      to: item.detailPath
    }))
  }

  const organizations: SearchGroup = {
    id: 'organizations',
    label: '组织',
    items: recruitingOrganizations.map(item => ({
      id: item.organizationId,
      label: item.organizationName,
      description: `${organizationTypeLabel[item.organizationType]} · ${item.recruitmentTitle}`,
      icon: 'i-lucide-building-2',
      to: item.organizationPath
    }))
  }

  const teams: SearchGroup = {
    id: 'teams',
    label: '组队',
    items: recruitTeams.map(item => ({
      id: item.id,
      label: item.title,
      description: `${item.competitionName} · ${item.baseMemberCount}/${item.targetMemberCount} 人`,
      icon: 'i-lucide-users',
      to: item.detailPath
    }))
  }

  const activities: SearchGroup = {
    id: 'activities',
    label: '活动',
    items: recentActivities.map(item => ({
      id: item.id,
      label: item.title,
      description: `${activityTypeLabel[item.activityType]} · ${formatDateTimeCompact(item.startAt)} · ${item.location}`,
      icon: 'i-lucide-calendar-days',
      to: item.detailPath
    }))
  }

  const faq: SearchGroup = {
    id: 'faq',
    label: '常见问题',
    items: faqList.map(item => ({
      id: item.id,
      label: item.question,
      description: faqCategoryLabel[item.category],
      icon: 'i-lucide-circle-help',
      to: item.detailPath
    }))
  }

  const guides: SearchGroup = {
    id: 'guides',
    label: '指南',
    items: guideList.map(item => ({
      id: item.id,
      label: item.title,
      description: guideCategoryLabel[item.category],
      icon: 'i-lucide-book-open',
      to: item.detailPath
    }))
  }

  const announcements: SearchGroup = {
    id: 'announcements',
    label: '公告',
    items: announcementList.map(item => ({
      id: item.id,
      label: item.title,
      description: formatCompactDate(item.publishedAt),
      icon: 'i-lucide-megaphone',
      to: item.detailPath
    }))
  }

  return [
    competitions,
    organizations,
    teams,
    activities,
    faq,
    guides,
    announcements
  ]
}
