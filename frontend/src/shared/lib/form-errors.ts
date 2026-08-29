/**
 * 字段错误的统一映射（FE：运营编辑工作台）。
 *
 * 后端 `fieldErrors` 的形状是 `Record<string, string[]>`：
 * 每个字段对应一组消息。各编辑器不再各自复制映射循环，而是只提供一份
 * `snake_case -> 表单字段名` 的 alias 表。
 *
 * 页面级消息走 `non_field_errors`，由 `nonFieldMessages()` 单独取用，
 * 不作为字段错误下发给表单。
 */

import type { FieldErrors } from '@/shared/http/types'

/** 后端约定：不属于任何字段的页面级消息键。 */
export const NON_FIELD_ERRORS = 'non_field_errors'

/**
 * 把后端返回的任意值收敛为合法的 `FieldErrors`。
 *
 * 非法形状（非对象、值为非数组、数组内无字符串）一律丢弃而不是宽泛断言，
 * 避免异常响应把运行时类型污染成字符串。
 */
export function normalizeFieldErrors(value: unknown): FieldErrors | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(messages)) continue
    const strings = messages.filter((message): message is string => typeof message === 'string')
    if (strings.length === 0) continue
    result[field] = strings
  }

  return result
}

/**
 * 取每个字段的第一条消息，并按 alias 映射为表单字段名。
 *
 * 返回对象的键顺序跟随后端响应，因此 `Object.keys(result)[0]` 即是第一个
 * 错误字段，可用于滚动定位。
 *
 * `non_field_errors` 不会出现在结果中，请改用 `nonFieldMessages()`。
 */
export function firstFieldErrors(
  errors: FieldErrors | null | undefined,
  aliases?: Readonly<Record<string, string>>
): Record<string, string> {
  if (!errors) return {}

  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(errors)) {
    if (field === NON_FIELD_ERRORS) continue
    const first = messages[0]
    if (typeof first !== 'string') continue
    result[aliases?.[field] ?? field] = first
  }

  return result
}

/** 取页面级消息（`non_field_errors`），用于 inline alert。 */
export function nonFieldMessages(errors: FieldErrors | null | undefined): string[] {
  if (!errors) return []
  const messages = errors[NON_FIELD_ERRORS]
  if (!Array.isArray(messages)) return []
  return messages.filter((message): message is string => typeof message === 'string')
}
