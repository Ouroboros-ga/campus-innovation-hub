import { describe, expect, it } from 'vitest'

import { firstFieldErrors, nonFieldMessages } from '@/shared/lib/form-errors'

describe('form-errors', () => {
  describe('firstFieldErrors', () => {
    it('空值返回空对象', () => {
      expect(firstFieldErrors(null)).toEqual({})
      expect(firstFieldErrors(undefined)).toEqual({})
      expect(firstFieldErrors({})).toEqual({})
    })

    it('每个字段只取第一条消息', () => {
      const result = firstFieldErrors({
        title: ['标题不能为空', '标题至少 2 个字'],
        edition: ['届次必填']
      })

      expect(result).toEqual({ title: '标题不能为空', edition: '届次必填' })
    })

    it('未提供 alias 时保留后端原始字段名', () => {
      expect(firstFieldErrors({ registration_end_at: ['必填'] })).toEqual({
        registration_end_at: '必填'
      })
    })

    it('按 alias 把 snake_case 映射到表单字段名', () => {
      const result = firstFieldErrors(
        {
          title: ['标题不能为空'],
          registration_end_at: ['报名截止必填'],
          cover_asset_id: ['必须上传封面']
        },
        {
          registration_end_at: 'registrationEndAt',
          cover_asset_id: 'cover'
        }
      )

      expect(result).toEqual({
        title: '标题不能为空',
        registrationEndAt: '报名截止必填',
        cover: '必须上传封面'
      })
    })

    it('alias 未覆盖的字段保留原名，不被丢弃', () => {
      const result = firstFieldErrors({ known: ['a'], unknown_field: ['b'] }, { known: 'mapped' })

      expect(result).toEqual({ mapped: 'a', unknown_field: 'b' })
    })

    it('空数组的字段被跳过', () => {
      expect(firstFieldErrors({ title: [], summary: ['简介过长'] })).toEqual({
        summary: '简介过长'
      })
    })

    it('non_field_errors 不进入字段错误', () => {
      const result = firstFieldErrors({
        title: ['标题不能为空'],
        non_field_errors: ['至少提供一个字段']
      })

      expect(result).toEqual({ title: '标题不能为空' })
      expect(result.non_field_errors).toBeUndefined()
    })

    it('键顺序跟随后端响应，首个键即可用于定位第一个错误字段', () => {
      const result = firstFieldErrors({
        summary: ['简介过长'],
        title: ['标题不能为空']
      })

      expect(Object.keys(result)).toEqual(['summary', 'title'])
    })
  })

  describe('nonFieldMessages', () => {
    it('读取页面级消息', () => {
      expect(
        nonFieldMessages({ non_field_errors: ['至少提供一个字段', '内容重复'] })
      ).toEqual(['至少提供一个字段', '内容重复'])
    })

    it('空值返回空数组', () => {
      expect(nonFieldMessages(null)).toEqual([])
      expect(nonFieldMessages(undefined)).toEqual([])
      expect(nonFieldMessages({ title: ['标题不能为空'] })).toEqual([])
    })
  })
})
