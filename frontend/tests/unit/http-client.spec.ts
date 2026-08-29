import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppError } from '@/shared/http/types'
import {
  clearCsrfToken,
  http,
  setCsrfToken
} from '@/shared/http/client'

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function mockFetch(impl: FetchImpl) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  clearCsrfToken()
})

describe('FE-100 共享 HTTP 客户端', () => {
  it('GET 使用 base URL 并解析 JSON', async () => {
    const mock = mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse({ results: [], count: 0 })
    })

    const data = await http.get<{ results: unknown[]; count: number }>('/items')

    expect(mock).toHaveBeenCalledOnce()
    expect(String(mock.mock.calls[0]![0])).toBe('/api/items')
    expect(data).toEqual({ results: [], count: 0 })
  })

  it('读取 VITE_API_BASE_URL 作为 base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    const mock = mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse({ ok: true })
    })

    await http.get('/items')

    expect(String(mock.mock.calls[0]![0])).toBe('https://api.test/items')
  })

  it('拼接 query 并跳过空值', async () => {
    const mock = mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse({ result: [] })
    })

    await http.get('/items', { query: { page: 2, q: '竞赛', empty: undefined } })

    expect(String(mock.mock.calls[0]![0])).toContain('/api/items?')
    expect(String(mock.mock.calls[0]![0])).toContain('page=2')
    expect(String(mock.mock.calls[0]![0])).toContain('q=%E7%AB%9E%E8%B5%9B')
    expect(String(mock.mock.calls[0]![0])).not.toContain('empty')
  })

  it('POST 设置 JSON 头并在设置 CSRF 后携带 X-CSRFToken', async () => {
    const mock = mockFetch(async (_input: RequestInfo | URL, init?: RequestInit) => {
      void _input
      expect(init?.headers).toBeInstanceOf(Headers)
      return jsonResponse({ id: 'x' })
    })
    setCsrfToken('csrf-abc')

    await http.post('/items', { name: '蓝桥杯' })

    const init = mock.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-CSRFToken')).toBe('csrf-abc')
    expect(JSON.parse(String(init.body))).toEqual({ name: '蓝桥杯' })
  })

  it('非 2xx 归一化为 AppError（含 fieldErrors）', async () => {
    mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse(
        {
          code: 'VALIDATION_ERROR',
          message: '参数错误',
          fieldErrors: { title: ['标题不能为空'] },
          requestId: 'req-1'
        },
        422
      )
    })

    await expect(http.post('/items', {})).rejects.toMatchObject({
      name: 'AppError',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: '参数错误',
      fieldErrors: { title: ['标题不能为空'] },
      requestId: 'req-1'
    })
  })

  it('fieldErrors 保留数组形态，不把数组压成字符串', async () => {
    mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse(
        {
          code: 'PUBLICATION_INCOMPLETE',
          message: '发布前缺少必填内容',
          fieldErrors: {
            cover_asset_id: ['发布前必须上传封面图'],
            registration_end_at: ['发布前必须设置报名截止时间', '必须晚于报名开始时间']
          }
        },
        422
      )
    })

    const error = await http.post('/items', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AppError)
    const appError = error as AppError
    expect(appError.code).toBe('PUBLICATION_INCOMPLETE')
    expect(appError.fieldErrors).toEqual({
      cover_asset_id: ['发布前必须上传封面图'],
      registration_end_at: ['发布前必须设置报名截止时间', '必须晚于报名开始时间']
    })
    // 每条消息仍是数组，不是被拼接或首元素取值的字符串
    expect(Array.isArray(appError.fieldErrors?.registration_end_at)).toBe(true)
    expect(appError.fieldErrors?.registration_end_at).toHaveLength(2)
  })

  it('异常形状的 fieldErrors 回退为空，不做宽泛断言', async () => {
    mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse({ code: 'VALIDATION_ERROR', fieldErrors: 'not-an-object' }, 400)
    })

    const error = await http.post('/items', {}).catch((e: unknown) => e)
    expect((error as AppError).fieldErrors).toBeNull()
  })

  it('fieldErrors 内的非法值被丢弃，保留合法数组项', async () => {
    mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return jsonResponse(
        { code: 'VALIDATION_ERROR', fieldErrors: { title: ['必填'], bogus: 42, empty: '字符串不是数组' } },
        400
      )
    })

    const error = await http.post('/items', {}).catch((e: unknown) => e)
    expect((error as AppError).fieldErrors).toEqual({ title: ['必填'] })
  })

  it('网络 / 取消错误归一化为 AppError', async () => {
    mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      throw new DOMException('Aborted', 'AbortError')
    })

    await expect(http.get('/slow')).rejects.toMatchObject({
      name: 'AppError',
      status: 0,
      code: 'ABORTED'
    })
  })

  it('204 无内容返回 undefined', async () => {
    const mock = mockFetch(async (_input: RequestInfo | URL) => {
      void _input
      return new Response(null, { status: 204 })
    })

    const result = await http.delete('/items/1')
    expect(result).toBeUndefined()
    expect(mock.mock.calls[0]![1]?.method).toBe('DELETE')
  })

  it('FormData 以 multipart 提交且不设置 JSON Content-Type', async () => {
    const mock = mockFetch(async (_input: RequestInfo | URL, init: RequestInit = {}) => {
      void _input
      void init
      return jsonResponse({ id: 'u1', url: 'https://cdn/x.jpg' })
    })
    const form = new FormData()
    form.append('file', new Blob(['x']), 'a.jpg')
    form.append('kind', 'IMAGE')

    await http.post<{ id: string; url: string }>('/media/upload', form)

    const [, init] = mock.mock.calls[0]!
    expect(init?.body).toBe(form)
    expect((init?.headers as Headers | undefined)?.get('Content-Type')).not.toBe('application/json')
  })
})
