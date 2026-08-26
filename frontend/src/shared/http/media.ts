import { http } from './client'

/**
 * 媒体上传（FE-Alpha / 编辑器方案）。
 *
 * 来源：`docs/api/APIContract.md §3.10 MediaUpload`：
 * `POST /api/media/upload`（multipart/form-data，field: file + kind，LOGIN）。
 * 响应 `201`：`{ id, url, original_name, mime_type, size_bytes, width, height }`。
 */
export interface MediaUploadResult {
  id: string
  url: string
  original_name: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
}

/** 上传单张图片，返回上传后的媒体信息（URL 供 Markdown / 附件使用）。 */
export async function uploadImage(
  file: File,
  kind: 'IMAGE' | 'DOCUMENT' = 'IMAGE'
): Promise<MediaUploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  return http.post<MediaUploadResult>('/media/upload', form)
}
