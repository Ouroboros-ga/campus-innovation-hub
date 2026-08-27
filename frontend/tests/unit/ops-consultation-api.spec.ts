import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsConsultationApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

describe('FE-090 咨询运营 API 适配器', () => {
  it('listConsultations 将 PENDING 状态映射为 OPEN 查询参数', async () => {
    vi.mocked(http.get).mockResolvedValue({ count: 1, results: [] })
    await api.listConsultations({ status: 'PENDING' })
    expect(http.get).toHaveBeenCalledWith(
      '/ops/consultations',
      expect.objectContaining({ query: expect.objectContaining({ status: 'OPEN' }) })
    )
  })

  it('listConsultations 归一化管理响应为 ConsultQaPost', async () => {
    vi.mocked(http.get).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'q1',
          author: { id: 'u1', nickname: '张三', display_name: '张老师' },
          category: 'COMPETITION',
          title: '如何报名竞赛？',
          status: 'ANSWERED',
          answered_at: '2026-08-20T10:00:00+08:00',
          replies: [{ id: 'r1', body_md: '请看竞赛详情页。', created_at: '2026-08-20T10:00:00+08:00' }],
          created_at: '2026-08-19T09:00:00+08:00'
        }
      ]
    })
    const result = await api.listConsultations({})
    const item = result.items[0]!
    expect(item.question).toBe('如何报名竞赛？')
    expect(item.status).toBe('ANSWERED')
    expect(item.authorName).toBe('张老师')
    expect(item.answer).toBe('请看竞赛详情页。')
  })

  it('replyConsultation 调用 POST /ops/consultations/{id}/replies 携带 body_md', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.replyConsultation('q1', '回复内容')
    expect(http.post).toHaveBeenCalledWith('/ops/consultations/q1/replies', { body_md: '回复内容' })
  })
})
