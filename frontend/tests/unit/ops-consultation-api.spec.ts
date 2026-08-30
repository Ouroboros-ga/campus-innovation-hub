import { describe, expect, it, vi } from 'vitest'

import * as api from '@/features/ops/api/opsConsultationApi'
import { http } from '@/shared/http/client'

vi.mock('@/shared/http/client', () => ({ http: { get: vi.fn(), post: vi.fn() } }))

const consultationDto = {
  id: 'q1', author: { id: 'u1', nickname: '张三', display_name: '张同学' }, category: 'COMPETITION',
  competition: { id: 'c1', name: '蓝桥杯' }, title: '如何报名竞赛？', body_md: '请问报名时间和入口在哪里？', visibility: 'PRIVATE',
  status: 'OPEN', allowed_actions: ['REPLY', 'CLOSE'], answered_at: null, replies: [], created_at: '2026-08-19T09:00:00+08:00', updated_at: '2026-08-19T09:00:00+08:00'
}

describe('Task8 咨询运营 API', () => {
  it('按运营状态和可见性传递队列筛选条件', async () => {
    vi.mocked(http.get).mockResolvedValue({ count: 0, results: [] })
    await api.listConsultations({ status: 'OPEN', visibility: 'PRIVATE', category: 'COMPETITION', q: '报名', page: 2, pageSize: 20 })
    expect(http.get).toHaveBeenCalledWith('/ops/consultations', { query: { q: '报名', status: 'OPEN', visibility: 'PRIVATE', category: 'COMPETITION', page: 2, page_size: 20 } })
  })

  it('保留私密性、正文、关联竞赛、完整历史和后端动作', async () => {
    vi.mocked(http.get).mockResolvedValue(consultationDto)
    const detail = await api.getConsultation('q1')
    expect(detail).toMatchObject({ title: '如何报名竞赛？', visibility: 'PRIVATE', bodyMd: '请问报名时间和入口在哪里？', competition: { name: '蓝桥杯' }, allowedActions: ['REPLY', 'CLOSE'] })
    expect(http.get).toHaveBeenCalledWith('/ops/consultations/q1')
  })

  it('追加回复和关闭分别走领域 action endpoint', async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ id: 'r1', author: { id: 'op', display_name: '运营同学' }, body_md: '请看竞赛详情页。', created_at: '2026-08-20T10:00:00+08:00', updated_at: '2026-08-20T10:00:00+08:00' }).mockResolvedValueOnce(undefined)
    const reply = await api.replyConsultation('q1', '请看竞赛详情页。')
    await api.closeConsultation('q1')
    expect(reply.authorName).toBe('运营同学')
    expect(http.post).toHaveBeenNthCalledWith(1, '/ops/consultations/q1/replies', { body_md: '请看竞赛详情页。' })
    expect(http.post).toHaveBeenNthCalledWith(2, '/ops/consultations/q1/close')
  })
})
