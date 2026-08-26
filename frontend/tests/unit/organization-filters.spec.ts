import { describe, expect, it } from 'vitest'

import { organizations } from '@/mocks/fixtures/organizations'

import {
  deriveRecruitmentState,
  filterOrganizations,
  normalizeOrgSort,
  normalizeOrgStatus,
  normalizeOrgType,
  paginateOrganizations,
  sortOrganizations
} from '@/features/organizations/lib/organizationFilters'

const NOW = new Date('2026-08-26T00:00:00+08:00')

function idsOf(items: typeof organizations) {
  return items.map(item => item.id)
}

describe('FE-040 组织筛选纯函数', () => {
  it('派生招新状态（publication_state + 报名窗口）', () => {
    expect(
      deriveRecruitmentState(organizations.find(o => o.id === 'ai-union')!, NOW)
    ).toBe('RECRUITING')
    expect(
      deriveRecruitmentState(organizations.find(o => o.id === 'robot-lab')!, NOW)
    ).toBe('UPCOMING')
    expect(
      deriveRecruitmentState(organizations.find(o => o.id === 'light-workshop')!, NOW)
    ).toBe('PAUSED')
    expect(
      deriveRecruitmentState(organizations.find(o => o.id === 'academic-forum')!, NOW)
    ).toBe('NOT_RECRUITING')
  })

  it('按类型筛选组织', () => {
    const clubs = filterOrganizations(
      organizations,
      { type: 'STUDENT_CLUB', status: 'ALL', q: '' },
      NOW
    )
    expect(idsOf(clubs)).toContain('ai-union')
    expect(idsOf(clubs)).toContain('academic-forum')
    expect(idsOf(clubs)).not.toContain('robot-lab')
  })

  it('按招新状态筛选组织', () => {
    const recruiting = filterOrganizations(
      organizations,
      { type: 'ALL', status: 'RECRUITING', q: '' },
      NOW
    )
    expect(idsOf(recruiting)).toEqual([
      'ai-union',
      'data-science-club',
      'innovation-center',
      'sci-employment'
    ])
  })

  it('按关键词筛选组织', () => {
    const data = filterOrganizations(
      organizations,
      { type: 'ALL', status: 'ALL', q: '数据' },
      NOW
    )
    expect(idsOf(data)).toEqual(['data-science-club'])
  })

  it('排序与分页', () => {
    const sorted = sortOrganizations(organizations, 'NAME')
    expect(sorted).toHaveLength(organizations.length)

    const paged = paginateOrganizations(organizations, 1, 8)
    expect(paged.items).toHaveLength(8)
    expect(paged.totalPages).toBe(1)
  })

  it('URL query 归一化', () => {
    expect(normalizeOrgType('STUDENT_CLUB')).toBe('STUDENT_CLUB')
    expect(normalizeOrgType(undefined)).toBe('ALL')
    expect(normalizeOrgStatus('RECRUITING')).toBe('RECRUITING')
    expect(normalizeOrgStatus('bogus')).toBe('ALL')
    expect(normalizeOrgSort('NAME')).toBe('NAME')
    expect(normalizeOrgSort('bogus')).toBe('DEFAULT')
  })
})
