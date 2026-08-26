/**
 * 浏览器 cookie 读取（FE-105）。
 *
 * 供认证模块读取 CSRF cookie（非 HttpOnly，前端可读），配合共享 HTTP 客户端发送
 * `X-CSRFToken`。不在此处写入 cookie（写由后端 `Set-Cookie` 完成）。
 */

/** 从 `document.cookie` 读取指定名称的 cookie 值；不存在返回 null。 */
export function getCookie(name: string): string | null {
  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
  if (!cookie) return null
  return decodeURIComponent(cookie.slice(prefix.length))
}
