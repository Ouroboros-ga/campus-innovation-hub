import { http } from '@/shared/http/client'

export interface HomepageCuration {
  featuredCompetitions: string[]
  featuredAnnouncements: string[]
  featuredGuides: string[]
  featuredFaqs: string[]
}

interface RawCurationDto {
  featured_competitions: string[]
  featured_announcements: string[]
  featured_guides: string[]
  featured_faqs: string[]
}

function toCuration(dto: RawCurationDto): HomepageCuration {
  return {
    featuredCompetitions: dto.featured_competitions ?? [],
    featuredAnnouncements: dto.featured_announcements ?? [],
    featuredGuides: dto.featured_guides ?? [],
    featuredFaqs: dto.featured_faqs ?? []
  }
}

export async function getHomepageCuration(): Promise<HomepageCuration> {
  const dto = await http.get<RawCurationDto>('/ops/homepage')
  return toCuration(dto)
}

export async function patchHomepageCuration(payload: HomepageCuration): Promise<HomepageCuration> {
  const dto = await http.patch<RawCurationDto>('/ops/homepage', {
    featured_competitions: payload.featuredCompetitions,
    featured_announcements: payload.featuredAnnouncements,
    featured_guides: payload.featuredGuides,
    featured_faqs: payload.featuredFaqs
  })
  return toCuration(dto as RawCurationDto)
}

// 辅助：通过公开/运营列表搜索已有内容，供选择器使用
export interface PickerOption {
  id: string
  title: string
  subtitle?: string | null
}

export async function searchCompetitions(q: string): Promise<PickerOption[]> {
  const res = await http.get<{ results: Array<{ id: string; name: string; edition: string; level: string }> }>('/ops/competitions', {
    query: { q, page: 1, page_size: 20, status: 'PUBLISHED' }
  })
  return res.results.map(r => ({ id: r.id, title: `${r.name} ${r.edition}`, subtitle: r.level }))
}

export async function searchAnnouncements(q: string): Promise<PickerOption[]> {
  const res = await http.get<{ results: Array<{ id: string; title: string; publisher_scope: string }> }>('/ops/announcements', {
    query: { q, page: 1, page_size: 20, status: 'PUBLISHED' }
  })
  return res.results.map(r => ({ id: r.id, title: r.title, subtitle: r.publisher_scope }))
}

export async function searchGuides(q: string): Promise<PickerOption[]> {
  const res = await http.get<{ results: Array<{ id: string; title: string; category: string }> }>('/ops/guides', {
    query: { q, page: 1, page_size: 20, status: 'PUBLISHED' }
  })
  return res.results.map(r => ({ id: r.id, title: r.title, subtitle: r.category }))
}

export async function searchFaqs(q: string): Promise<PickerOption[]> {
  const res = await http.get<{ results: Array<{ id: string; question: string; category: string }> }>('/ops/faq', {
    query: { q, page: 1, page_size: 20, status: 'PUBLISHED' }
  })
  return res.results.map(r => ({ id: r.id, title: r.question, subtitle: r.category }))
}

// 按 ID 批量取标题（用于已选列表展示）
export async function fetchTitlesByIds(type: 'competition' | 'announcement' | 'guide' | 'faq', ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (ids.length === 0) return map
  // 复用公开首页或单独详情接口；此处逐个 GET，运营低频可接受
  const fetches = ids.map(async (id) => {
    try {
      let dto: Record<string, unknown> | null = null
      if (type === 'competition') dto = await http.get<Record<string, unknown>>(`/ops/competitions/${id}`)
      else if (type === 'announcement') dto = await http.get<Record<string, unknown>>(`/ops/announcements/${id}`)
      else if (type === 'guide') dto = await http.get<Record<string, unknown>>(`/ops/guides/${id}`)
      else dto = await http.get<Record<string, unknown>>(`/ops/faq/${id}`)
      const title = (dto?.title as string) ?? (dto?.name as string) ?? (dto?.question as string) ?? id
      map.set(id, title)
    } catch {
      map.set(id, id.slice(0, 8))
    }
  })
  await Promise.all(fetches)
  return map
}
