/**
 * 共享 HTTP 客户端（FE-100）。
 *
 * 职责：
 * - base URL 解析（`VITE_API_BASE_URL`，默认 `/api`）；
 * - JSON 处理（自动 Accept/Content-Type，非 JSON 2xx 返回 `{ message }` 兜底，204 返回 undefined）；
 * - AppError 归一化（契约错误结构 + 状态码 + 网络/取消错误）；
 * - AbortSignal 透传；
 * - CSRF 支持（`X-CSRFToken`，仅在设置了 token 且为写方法时携带；认证冻结前 token 默认未设置）。
 *
 * 架构：pages -> features -> shared；页面不得直接 `fetch`（FrontendArchitecture）。
 */

import { AppError, type HttpMethod, type RequestOptions } from './types'

export type { AppError, Paginated, RequestOptions } from './types'

const DEFAULT_BASE_URL = '/api'

let authRedirectHandler: ((target: string) => void) | null = null

export function setAuthRedirectHandler(handler: (target: string) => void): void {
  authRedirectHandler = handler
}

function handleAuthRequired(): void {
  if (typeof window === 'undefined') return
  const current = window.location.pathname + window.location.search
  if (current.startsWith('/login') || current.startsWith('/register')) return
  const loginUrl = `/login?redirect=${encodeURIComponent(current)}`
  if (authRedirectHandler) authRedirectHandler(loginUrl)
  else window.location.href = loginUrl
}

function normalizePath(path: string): string {
  if (path === '/') return path
  return path.replace(/\/+$/, '')
}

/** base URL（环境变量优先，去尾部斜杠）。 */
function baseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (configured ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
}

// ---------------------------------------------------------------------------
// CSRF
// ---------------------------------------------------------------------------

let csrfToken: string | null = null

/** 设置 CSRF token（认证冻结后在登录/会话建立时调用）。 */
export function setCsrfToken(token: string): void {
  csrfToken = token
}

/** 读取当前 CSRF token。 */
export function getCsrfToken(): string | null {
  return csrfToken
}

/** 清除 CSRF token（退出登录）。 */
export function clearCsrfToken(): void {
  csrfToken = null
}

function readCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
  if (!cookie) return null
  const match = cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('csrftoken='))
  if (!match) return null
  return decodeURIComponent(match.slice('csrftoken='.length))
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

function withQuery(url: string, query: RequestOptions['query']): string {
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const querystring = params.toString()
  return querystring ? `${url}?${querystring}` : url
}

function fallbackCode(status: number): string {
  if (status === 401) return 'AUTH_REQUIRED'
  if (status === 403) return 'PERMISSION_DENIED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422) return 'VALIDATION_ERROR'
  if (status >= 500) return 'SERVER_ERROR'
  return 'HTTP_ERROR'
}

interface ErrorPayload {
  code?: string
  message?: string
  fieldErrors?: Record<string, string> | null
  requestId?: string | null
}

function readErrorPayload(body: unknown): ErrorPayload {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    return {
      code: typeof record.code === 'string' ? record.code : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
      fieldErrors:
        record.fieldErrors && typeof record.fieldErrors === 'object'
          ? (record.fieldErrors as Record<string, string>)
          : undefined,
      requestId:
        typeof record.requestId === 'string' ? record.requestId : undefined
    }
  }
  return {}
}

function normalizeError(status: number, body: unknown): AppError {
  const payload = readErrorPayload(body)
  return new AppError(payload.message ?? `请求失败（${status}）`, {
    status,
    code: payload.code ?? fallbackCode(status),
    fieldErrors: payload.fieldErrors ?? null,
    requestId: payload.requestId ?? null
  })
}

function networkError(error: unknown): AppError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError('请求已取消', { status: 0, code: 'ABORTED' })
  }
  return new AppError('网络请求失败，请检查网络后重试', {
    status: 0,
    code: 'NETWORK_ERROR'
  })
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

// ---------------------------------------------------------------------------
// 请求
// ---------------------------------------------------------------------------

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = withQuery(`${baseUrl()}${normalizePath(path)}`, options.query)
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const isMutation = method !== 'GET'
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  if (isMutation && options.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }
  const effectiveCsrfToken = readCsrfFromCookie() ?? csrfToken
  if (isMutation && effectiveCsrfToken && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', effectiveCsrfToken)
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      signal: options.signal,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as BodyInit)
            : JSON.stringify(options.body)
    })
  } catch (error) {
    throw networkError(error)
  }

  if (!response.ok) {
    if (response.status === 401) handleAuthRequired()
    throw normalizeError(response.status, await readBody(response))
  }

  return (await readBody(response)) as T
}

/** 共享 HTTP 客户端。 */
export const http = {
  get: <T>(path: string, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options: Omit<RequestOptions, 'body'> = {}) =>
    request<T>('DELETE', path, options)
}
