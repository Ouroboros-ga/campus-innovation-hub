/**
 * 认证与权限领域类型（FE-105）。
 *
 * 来源：`docs/api/APIContract.md §3.1 Auth`（已冻结后端）：
 * - GET /api/auth/csrf、POST /api/auth/register、POST /api/auth/login、
 *   POST /api/auth/logout、GET /api/auth/me。
 *
 * 平台角色与组织成员关系构成权限上下文；后端始终是权威，前端仅用于 UX。
 */

/** 平台角色（§角色模型：SUPERADMIN 由 is_superuser 表达）。 */
export type PlatformRole = 'STUDENT' | 'OPERATOR'

/** 个人资料（本人视角，含 SENSITIVE 字段）。 */
export interface AuthUserProfile {
  nickname: string | null
  avatar?: { id?: string; url?: string | null } | null
  major: string | null
  grade: number | null
  bio: string
  skills: string[]
}

/** 当前用户。 */
export interface AuthUser {
  id: string
  username: string
  student_no: string
  real_name: string
  platform_role: PlatformRole
  is_superuser: boolean
  profile: AuthUserProfile
}

/** 组织成员关系（权限上下文）。 */
export interface OrganizationMembership {
  organization_id: string
  role: 'MEMBER' | 'LEADER'
  title: string
}

/** 权限上下文（`/api/auth/me`）。 */
export interface AuthPermissions {
  platform_role: PlatformRole
  organization_memberships: OrganizationMembership[]
}

/** `GET /api/auth/me` / `POST /api/auth/login` 响应。 */
export interface AuthMeResult {
  user: AuthUser
  permissions: AuthPermissions
}

/** 登录请求体。 */
export interface LoginPayload {
  username: string
  password: string
}

/** 注册请求体。 */
export interface RegisterPayload {
  student_no: string
  real_name: string
  password: string
}

/** 注册响应（`201`，待审核）。 */
export interface RegisterResult {
  status: 'pending_approval'
  message: string
}
