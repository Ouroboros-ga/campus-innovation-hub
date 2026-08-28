/**
 * 共享 HTTP 客户端类型（FE-100）。
 *
 * 与 `docs/api/APIContract.md` 对齐：
 * - 错误结构 `{ code, message, fieldErrors, requestId }`（§1.8）；
 * - 分页包装 `{ count, next, previous, results }`（§1.5）；
 * - 认证：HttpOnly session cookie + 写请求携带 `X-CSRFToken`（§1.2）。
 */

/** 字段级错误。 */
export interface FieldError {
  field: string
  message: string
}

/** 归一化后的应用错误。 */
export class AppError extends Error {
  /** HTTP 状态码；网络/取消错误为 0。 */
  readonly status: number
  /** 契约错误码，如 AUTH_REQUIRED / PERMISSION_DENIED / VALIDATION_ERROR。 */
  readonly code: string
  /** 字段级错误（若后端返回）。 */
  readonly fieldErrors: Record<string, string> | null
  /** 请求追踪 id（若后端返回）。 */
  readonly requestId: string | null

  constructor(
    message: string,
    options: {
      status: number
      code: string
      fieldErrors?: Record<string, string> | null
      requestId?: string | null
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors ?? null
    this.requestId = options.requestId ?? null
  }
}

/** 分页响应包装。 */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** 请求方法。 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/** 通用请求选项。 */
export interface RequestOptions {
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  headers?: HeadersInit
  /** 401 时是否跳过全局登录重定向（用于 fail-open 的会话探测等）。 */
  skipAuthRedirect?: boolean
}
