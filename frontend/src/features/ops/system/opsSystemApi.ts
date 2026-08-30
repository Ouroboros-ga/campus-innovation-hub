import { http } from '@/shared/http/client'

export interface OpsSystemHealth { api: 'ok' | 'error'; db: 'ready' | 'error' }

/** 仅为运营界面展示服务可达性，不取代监控告警。 */
export async function getOpsSystemHealth(): Promise<OpsSystemHealth> {
  const [api, db] = await Promise.allSettled([http.get<unknown>('/health'), http.get<unknown>('/ready')])
  return { api: api.status === 'fulfilled' ? 'ok' : 'error', db: db.status === 'fulfilled' ? 'ready' : 'error' }
}
