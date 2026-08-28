import { reactive } from 'vue'

import {
  myOrganizations,
  organizationDetails,
  recruitmentDetails
} from '@/mocks/fixtures/organizations'
import type {
  MyOrganization,
  OrganizationDetail,
  OrganizationPosition,
  RecruitmentApplicationState,
  RecruitmentDetail,
  RecruitmentPublicationState
} from '../types'
import { useAuthStore } from '@/stores/auth'

function authMemberships(): Array<{ organization_id: string; role: string; title: string | null }> {
  try {
    const auth = useAuthStore()
    return (auth.organizationMemberships as unknown as Array<{ organization_id: string; role: string; title: string | null }>) ?? []
  } catch {
    return []
  }
}

/** 是否可管理指定组织（LEADER 或 ADVISOR），优先真实会话，其次 Mock。 */
export function canManageOrganization(orgId: string): boolean {
  const real = authMemberships()
  if (real.length) {
    return real.some(entry => entry.organization_id === orgId && (entry.role === 'LEADER' || entry.role === 'ADVISOR'))
  }
  return myOrganizations.some(
    entry => entry.organization.id === orgId && (entry.membership === 'LEADER' || entry.membership === 'ADVISOR')
  )
}

/** 可管理组织的当前成员关系；不可管理则返回 null。 */
export function managedMembership(orgId: string): MyOrganization | null {
  const real = authMemberships()
  if (real.length) {
    const m = real.find(entry => entry.organization_id === orgId && (entry.role === 'LEADER' || entry.role === 'ADVISOR'))
    if (m) {
      // 尽力从已加载的组织详情中还原 OrganizationSummary，无则构造最小对象
      const mock = myOrganizations.find(entry => entry.organization.id === orgId)
      if (mock) return { organization: mock.organization, membership: m.role as MyOrganization['membership'], roleLabel: m.title || (m.role === 'ADVISOR' ? '指导老师' : '负责人') }
      return {
        organization: {
          id: orgId,
          name: '未知组织',
          type: 'STUDENT_CLUB',
          description: null,
          logo: { alt: 'logo', src: null },
          recruitment: null,
          detailPath: `/organizations/${orgId}`,
          recruitmentPath: null,
        },
        membership: m.role as MyOrganization['membership'],
        roleLabel: m.title || (m.role === 'ADVISOR' ? '指导老师' : '负责人'),
      }
    }
    return null
  }
  return (
    myOrganizations.find(
      entry => entry.organization.id === orgId && (entry.membership === 'LEADER' || entry.membership === 'ADVISOR')
    ) ?? null
  )
}

/** 组织详情（用于管理资料页）；无详情返回 null。 */
export function managedOrganizationDetail(orgId: string): OrganizationDetail | null {
  return organizationDetails.find(entry => entry.id === orgId) ?? null
}

// ---------------------------------------------------------------------------
// 招新响应式 store（FE-080 编辑/发布/结束 真实持久化到内存）
// ---------------------------------------------------------------------------

/** 招新编辑器草稿。 */
export interface RecruitEditorDraft {
  title: string
  introMd: string
  applyStartAt: string
  applyEndAt: string
  targetGradeMin: number | null
  targetGradeMax: number | null
  notesMd: string
  positions: Array<Omit<OrganizationPosition, 'id'>>
}

const recruitmentStore = reactive<RecruitmentDetail[]>(
  recruitmentDetails.map(recruitment => ({
    ...recruitment,
    organization: { ...recruitment.organization },
    positions: recruitment.positions.map(position => ({ ...position }))
  }))
)

/** 该组织的招新列表（反应式）。 */
export function managedRecruitments(orgId: string): RecruitmentDetail[] {
  return recruitmentStore.filter(entry => entry.organization.id === orgId)
}

/** 新增招新。 */
export function addRecruitment(orgId: string, draft: RecruitEditorDraft): RecruitmentDetail {
  const organization = myOrganizations.find(entry => entry.organization.id === orgId)?.organization
  const recruitment: RecruitmentDetail = {
    id: `recruitment-${Date.now()}`,
    organization: {
      id: orgId,
      name: organization?.name ?? '未知组织',
      type: organization?.type ?? 'STUDENT_CLUB',
      detailPath: organization?.detailPath ?? `/organizations/${orgId}`,
      logo: organization?.logo ?? { alt: 'logo', src: null }
    },
    title: draft.title.trim(),
    introMd: draft.introMd.trim(),
    applyStartAt: draft.applyStartAt || null,
    applyEndAt: draft.applyEndAt || null,
    publicationState: 'DRAFT',
    completedAt: null,
    targetGradeMin: draft.targetGradeMin,
    targetGradeMax: draft.targetGradeMax,
    notesMd: draft.notesMd.trim() || null,
    positions: draft.positions.map((position, index) => ({
      id: `pos-${Date.now()}-${index}`,
      name: position.name,
      headcount: position.headcount,
      description: position.description ?? null,
      requirements: position.requirements ?? null
    })),
    qqGroupNumber: null,
    qqGroupQr: null,
    qqGroupJoinUrl: null,
    enableOnlineApplication: true,
    organizationAllowOnlineApplication: true
  }
  recruitmentStore.push(recruitment)
  return recruitment
}

/** 更新招新（用于「编辑」）。 */
export function updateRecruitment(
  orgId: string,
  id: string,
  draft: RecruitEditorDraft
): RecruitmentDetail | null {
  const existing = recruitmentStore.find(
    entry => entry.organization.id === orgId && entry.id === id
  )
  if (!existing) return null
  existing.title = draft.title.trim()
  existing.introMd = draft.introMd.trim()
  existing.applyStartAt = draft.applyStartAt || null
  existing.applyEndAt = draft.applyEndAt || null
  existing.targetGradeMin = draft.targetGradeMin
  existing.targetGradeMax = draft.targetGradeMax
  existing.notesMd = draft.notesMd.trim() || null
  existing.positions = draft.positions.map((position, index) => ({
    id: existing.positions[index]?.id ?? `pos-${Date.now()}-${index}`,
    name: position.name,
    headcount: position.headcount,
    description: position.description ?? null,
    requirements: position.requirements ?? null
  }))
  return existing
}

/** 发布 / 结束 / 归档招新（切换发布状态）。 */
export function setRecruitmentState(
  orgId: string,
  id: string,
  state: RecruitmentPublicationState
): void {
  const recruitment = recruitmentStore.find(
    entry => entry.organization.id === orgId && entry.id === id
  )
  if (recruitment) recruitment.publicationState = state
}

/** 校验招新编辑器。 */
export function validateRecruitEditor(draft: RecruitEditorDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.title.trim()) errors.title = '请填写招新标题'
  if (!draft.introMd.trim()) errors.introMd = '请填写招新介绍'
  if (!draft.applyStartAt) errors.applyStartAt = '请选择开始时间'
  if (!draft.applyEndAt) errors.applyEndAt = '请选择截止时间'
  if (draft.positions.length === 0) errors.positions = '请至少添加一个岗位'
  if (draft.positions.some(position => !position.name.trim())) {
    errors.positions = '岗位名称不能为空'
  }
  return errors
}

// ---------------------------------------------------------------------------
// 申请（占位 fixture，基于 store 的招新生成）
// ---------------------------------------------------------------------------

/** 招新申请状态标签。 */
export const applicationStateLabel: Record<RecruitmentApplicationState, string> = {
  PENDING: '待处理',
  ACCEPTED: '已接受',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回'
}

/** 占位申请项（mock）。 */
export interface ManagedApplication {
  id: string
  recruitmentId: string
  recruitmentTitle: string
  applicantName: string
  positionName: string
  grade: string
  major: string
  skills: string
  selfIntro: string
  submittedAt: string
  state: RecruitmentApplicationState
}

/** 该组织的申请列表（占位 fixture，按招新职位生成）。 */
export function managedApplications(orgId: string): ManagedApplication[] {
  const recruitments = managedRecruitments(orgId)
  return recruitments.flatMap((recruitment, rIndex) =>
    recruitment.positions.map((position, pIndex) => ({
      id: `app-${recruitment.id}-${position.id}`,
      recruitmentId: recruitment.id,
      recruitmentTitle: recruitment.title,
      applicantName: ['李同学', '王同学', '陈同学'][(rIndex + pIndex) % 3]!,
      positionName: position.name,
      grade: '2025级',
      major: '人工智能学院',
      skills: position.requirements ?? 'Python',
      selfIntro: `希望加入「${recruitment.title}」的${position.name}方向。`,
      submittedAt: recruitment.applyEndAt ?? new Date().toISOString(),
      state: (['PENDING', 'ACCEPTED', 'REJECTED'] as RecruitmentApplicationState[])[
        (rIndex + pIndex) % 3
      ]!
    }))
  )
}
