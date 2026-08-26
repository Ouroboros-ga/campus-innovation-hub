import { describe, expect, it, vi } from 'vitest'

import { http } from '@/shared/http/client'
import { uploadImage } from '@/shared/http/media'

vi.mock('@/shared/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}))

describe('FE-Alpha media 上传', () => {
  it('uploadImage 以 multipart 提交 file + kind 到 /media/upload，返回媒体 URL', async () => {
    vi.mocked(http.post).mockResolvedValue({
      id: 'u1',
      url: 'https://cdn.example.edu/x.jpg',
      original_name: 'photo.jpg',
      mime_type: 'image/jpeg',
      size_bytes: 102400,
      width: 1200,
      height: 675
    })

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await uploadImage(file, 'IMAGE')

    expect(http.post).toHaveBeenCalledWith('/media/upload', expect.any(FormData))
    const form = vi.mocked(http.post).mock.calls[0]![1] as FormData
    expect(form.get('file')).toBe(file)
    expect(form.get('kind')).toBe('IMAGE')
    expect(result.url).toBe('https://cdn.example.edu/x.jpg')
  })
})
