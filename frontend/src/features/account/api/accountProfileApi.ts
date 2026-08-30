import { http } from '@/shared/http/client'

export interface AccountProfileDto {
  real_name: string; identity_type: string; student_no: string | null; employee_no: string | null; nickname: string | null; public_name: string | null
  major: string | null; grade: number | null; bio: string | null; skills: string[]; department: string | null; academic_title: string | null
  public_email: string | null; office_location: string | null; research_interests: string[]; class_name: string | null; avatar: unknown
}
export function getAccountProfile() { return http.get<AccountProfileDto>('/me/profile') }
export function updateAccountProfile(payload: Record<string, unknown>) { return http.patch('/me/profile', payload) }
