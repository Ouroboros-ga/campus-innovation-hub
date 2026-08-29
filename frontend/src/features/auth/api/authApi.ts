/**
 * 认证与权限 API 集成（FE-105）。
 *
 * 映射 `docs/api/APIContract.md §3.1 Auth`（后端已冻结）：
 * - GET  /api/auth/csrf（PUBLIC，初始化 CSRF cookie）
 * - POST /api/auth/register（PUBLIC，提交审核）
 * - POST /api/auth/login（PUBLIC，返回 /api/auth/me 结构）
 * - POST /api/auth/logout（LOGIN）
 * - GET  /api/auth/me（LOGIN，未登录 401）
 *
 * 认证基于同源 Django Session（HttpOnly cookie）+ CSRF。前端不手动附加 token、
 * 不持久化认证密钥；写请求由共享 HTTP 客户端自动携带 `X-CSRFToken`（FE-100）。
 */

import {
  clearCsrfToken,
  http,
  setCsrfToken
} from '@/shared/http/client'
import { AppError } from '@/shared/http/types'
import { getCookie } from '@/shared/lib/cookie'
import type {
  AuthMeResult,
  LoginPayload,
  RegisterPayload,
  RegisterResult
} from '../types'

/** Django CSRF cookie 名（非 HttpOnly，前端可读；非登录凭据）。 */
const CSRF_COOKIE_NAME = 'csrftoken'

/**
 * 初始化 CSRF：`GET /api/auth/csrf` 让浏览器获得 CSRF cookie，前端从 cookie 读取值并
 * 交给共享 HTTP 客户端，供后续写请求发送。
 */
export async function initCsrf(): Promise<void> {
  await http.get('/auth/csrf', { skipAuthRedirect: true })
  const token = getCookie(CSRF_COOKIE_NAME)
  if (token) setCsrfToken(token)
}

/** 学生自助注册（PUBLIC）；响应说明账号是否已经启用。 */
export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  return http.post<RegisterResult>('/auth/register', payload, { skipAuthRedirect: true })
}

/** 登录（PUBLIC），成功后后端 Set-Cookie session。 */
export async function login(payload: LoginPayload): Promise<AuthMeResult> {
  const result = await http.post<AuthMeResult>('/auth/login', payload, { skipAuthRedirect: true })
  const token = getCookie(CSRF_COOKIE_NAME)
  if (token) setCsrfToken(token)
  return result
}

/** 登出（LOGIN）。 */
export async function logout(): Promise<void> {
  const token = getCookie(CSRF_COOKIE_NAME)
  if (token) setCsrfToken(token)
  try {
    await http.post('/auth/logout', undefined, { skipAuthRedirect: true })
  } finally {
    const newToken = getCookie(CSRF_COOKIE_NAME)
    if (newToken) setCsrfToken(newToken)
    else clearCsrfToken()
  }
}

/** 当前用户与权限上下文（LOGIN）；未登录返回 null，其余错误抛出。 */
export async function fetchCurrentUser(): Promise<AuthMeResult | null> {
  try {
    return await http.get<AuthMeResult>('/auth/me', { skipAuthRedirect: true })
  } catch (error) {
    if (error instanceof AppError && error.status === 401) return null
    throw error
  }
}
