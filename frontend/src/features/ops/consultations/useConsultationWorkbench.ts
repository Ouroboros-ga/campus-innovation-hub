import { ref } from 'vue'

import { closeConsultation, getConsultation, listConsultations, replyConsultation } from '../api/opsConsultationApi'
import type { ConsultationDetail, ConsultationQuery, ConsultationSummary } from './types'

export function useConsultationWorkbench() {
  const items = ref<ConsultationSummary[]>([])
  const total = ref(0)
  const detail = ref<ConsultationDetail | null>(null)
  const queueLoading = ref(false)
  const detailLoading = ref(false)
  const queueError = ref<string | null>(null)
  const detailError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const actionPending = ref(false)

  async function loadQueue(query: ConsultationQuery): Promise<void> {
    queueLoading.value = true; queueError.value = null
    try { const result = await listConsultations(query); items.value = result.items; total.value = result.total }
    catch (error) { queueError.value = error instanceof Error ? error.message : '咨询队列加载失败，请稍后重试。' }
    finally { queueLoading.value = false }
  }
  async function loadDetail(id: string): Promise<ConsultationDetail | null> {
    detailLoading.value = true; detailError.value = null
    try { detail.value = await getConsultation(id); return detail.value }
    catch (error) { detail.value = null; detailError.value = error instanceof Error ? error.message : '咨询详情加载失败，请稍后重试。'; return null }
    finally { detailLoading.value = false }
  }
  async function sendReply(bodyMd: string): Promise<boolean> {
    if (!detail.value) return false
    actionPending.value = true; actionError.value = null
    try {
      const reply = await replyConsultation(detail.value.id, bodyMd)
      detail.value = { ...detail.value, status: 'ANSWERED', answeredAt: reply.createdAt, replies: [...detail.value.replies, reply], allowedActions: ['REPLY', 'CLOSE'] }
      return true
    } catch (error) { actionError.value = error instanceof Error ? error.message : '发送正式回复失败，请稍后重试。'; return false }
    finally { actionPending.value = false }
  }
  async function closeCurrent(): Promise<boolean> {
    if (!detail.value) return false
    actionPending.value = true; actionError.value = null
    try { await closeConsultation(detail.value.id); detail.value = { ...detail.value, status: 'CLOSED', allowedActions: [] }; return true }
    catch (error) { actionError.value = error instanceof Error ? error.message : '关闭咨询失败，请稍后重试。'; return false }
    finally { actionPending.value = false }
  }
  return { items, total, detail, queueLoading, detailLoading, queueError, detailError, actionError, actionPending, loadQueue, loadDetail, sendReply, closeCurrent }
}
