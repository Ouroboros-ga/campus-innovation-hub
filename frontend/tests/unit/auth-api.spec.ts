import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchCurrentUser,
  initCsrf,
  login,
  logout,
  register
} from '@/features/auth/api/authApi'
import {
  clearCsrfToken,
  getCsrfToken,
  http,
  setCsrfToken
} from '@/shared/http/client'
import { AppError } from '@/shared/http/types'

vi.mock('@/shared/http/client', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/http/client')>()
  return {
    ...actual,
    http: { get: vi.fn(), post: vi.fn() }
  }
})

const meResult = {
  user: {
    id: 'u1',
    username: '20240001',
    student_no: '20240001',
    real_name: '张三',
    platform_role: 'STUDENT' as const,
    is_superuser: false,
    profile: {
      nickname: '阿三',
      avatar: null,
      major: '人工智能',
      grade: 2,
      bio: '',
      skills: ['Python']
    }
  },
  permissions: {
    platform_role: 'STUDENT' as const,
    organization_memberships: []
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  clearCsrfToken()
})

describe('FE-105 认证 API 适配器', () => {
  it('initCsrf 读取 CSRF cookie 并写入客户端', async () => {
    vi.mocked(http.get).mockResolvedValue(undefined)
    vi.spyOn(document, 'cookie', 'get').mockReturnValue('csrftoken=abc123')

    await initCsrf()

    expect(http.get).toHaveBeenCalledWith('/auth/csrf', { skipAuthRedirect: true })
    expect(getCsrfToken()).toBe('abc123')
  })

  it('register 发送注册负载', async () => {
    vi.mocked(http.post).mockResolvedValue({
      status: 'pending_approval',
      message: '注册已提交，请等待管理员审核。'
    })

    await register({ student_no: '20240001', real_name: '张三', password: 'secret' })

    expect(http.post).toHaveBeenCalledWith(
      '/auth/register',
      {
        student_no: '20240001',
        real_name: '张三',
        password: 'secret'
      },
      { skipAuthRedirect: true }
    )
  })

  it('login 发送登录负载并返回当前用户', async () => {
    vi.mocked(http.post).mockResolvedValue(meResult)

    const result = await login({ username: '20240001', password: 'secret' })

    expect(http.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        username: '20240001',
        password: 'secret'
      },
      { skipAuthRedirect: true }
    )
    expect(result).toEqual(meResult)
  })

  it('logout 清除 CSRF token', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    setCsrfToken('abc')

    await logout()

    expect(http.post).toHaveBeenCalledWith('/auth/logout', undefined, { skipAuthRedirect: true })
    expect(getCsrfToken()).toBeNull()
  })

  it('fetchCurrentUser 未登录（401）返回 null', async () => {
    vi.mocked(http.get).mockRejectedValue(
      new AppError('未登录', { status: 401, code: 'AUTH_REQUIRED' })
    )

    const result = await fetchCurrentUser()

    expect(result).toBeNull()
  })

  it('fetchCurrentUser 登录时返回当前用户与权限', async () => {
    vi.mocked(http.get).mockResolvedValue(meResult)

    const result = await fetchCurrentUser()

    expect(http.get).toHaveBeenCalledWith('/auth/me', { skipAuthRedirect: true })
    expect(result).toEqual(meResult)
  })
})
