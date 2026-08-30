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
  let queueRequestId = 0
  let detailRequestId = 0

  async function loadQueue(query: ConsultationQuery): Promise<void> {
    const requestId = ++queueRequestId
    queueLoading.value = true; queueError.value = null
    try {
      const result = await listConsultations(query)
      if (requestId !== queueRequestId) return
      items.value = result.items; total.value = result.total
    } catch (error) {
      if (requestId !== queueRequestId) return
      queueError.value = error instanceof Error ? error.message : '咨询队列加载失败，请稍后重试。'
    } finally { if (requestId === queueRequestId) queueLoading.value = false }
  }
  async function loadDetail(id: string): Promise<ConsultationDetail | null> {
    const requestId = ++detailRequestId
    detailLoading.value = true; detailError.value = null
    try {
      const loaded = await getConsultation(id)
      if (requestId !== detailRequestId) return null
      detail.value = loaded
      return loaded
    } catch (error) {
      if (requestId !== detailRequestId) return null
      detail.value = null; detailError.value = error instanceof Error ? error.message : '咨询详情加载失败，请稍后重试。'
      return null
    } finally { if (requestId === detailRequestId) detailLoading.value = false }
  }
  async function sendReply(bodyMd: string): Promise<boolean> {
    const current = detail.value
    if (!current) return false
    actionPending.value = true; actionError.value = null
    try {
      const updated = await replyConsultation(current.id, bodyMd)
      if (detail.value?.id === current.id) detail.value = updated
      return true
    } catch (error) { actionError.value = error instanceof Error ? error.message : '发送正式回复失败，请稍后重试。'; return false }
    finally { actionPending.value = false }
  }
  async function closeCurrent(): Promise<boolean> {
    const current = detail.value
    if (!current) return false
    actionPending.value = true; actionError.value = null
    try {
      const updated = await closeConsultation(current.id)
      if (detail.value?.id === current.id) detail.value = updated
      return true
    }
    catch (error) { actionError.value = error instanceof Error ? error.message : '关闭咨询失败，请稍后重试。'; return false }
    finally { actionPending.value = false }
  }
  return { items, total, detail, queueLoading, detailLoading, queueError, detailError, actionError, actionPending, loadQueue, loadDetail, sendReply, closeCurrent }
}
