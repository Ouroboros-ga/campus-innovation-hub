export type ConsultationStatus = 'OPEN' | 'ANSWERED' | 'CLOSED'
export type ConsultationVisibility = 'PUBLIC' | 'PRIVATE'
export type ConsultationCategory = 'COMPETITION' | 'TEAM' | 'ORGANIZATION' | 'ACTIVITY' | 'FURTHER_STUDY' | 'CERTIFICATE' | 'OTHER'
export type ConsultationAction = 'REPLY' | 'CLOSE'

export interface ConsultationReply { id: string; authorName: string; bodyMd: string; createdAt: string; updatedAt: string }
export interface ConsultationSummary {
  id: string; title: string; authorName: string; category: ConsultationCategory; visibility: ConsultationVisibility; status: ConsultationStatus
  replyCount: number; createdAt: string; answeredAt: string | null; allowedActions: ConsultationAction[]
}
export interface ConsultationDetail extends ConsultationSummary {
  bodyMd: string; competition: { id: string; name: string } | null; replies: ConsultationReply[]; updatedAt: string
}
export interface ConsultationQuery { q?: string; status?: ConsultationStatus; visibility?: ConsultationVisibility; category?: ConsultationCategory; page?: number; pageSize?: number }

export const consultationStatusLabel: Record<ConsultationStatus, string> = { OPEN: '待回复', ANSWERED: '已回复', CLOSED: '已关闭' }
export const consultationVisibilityLabel: Record<ConsultationVisibility, string> = { PUBLIC: '公开咨询', PRIVATE: '私密咨询' }
export const consultationCategoryLabel: Record<ConsultationCategory, string> = { COMPETITION: '竞赛', TEAM: '组队', ORGANIZATION: '组织', ACTIVITY: '活动', FURTHER_STUDY: '升学', CERTIFICATE: '证书', OTHER: '其他' }
