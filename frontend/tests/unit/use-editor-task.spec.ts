import { describe, expect, it, vi } from 'vitest'

import { AppError } from '@/shared/http/types'
import { useEditorTask } from '@/shared/composables/useEditorTask'
import type { EditorAdapter } from '@/shared/types/editor'

interface Draft {
  title: string
  summary: string
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createAdapter(overrides: Partial<EditorAdapter<Draft, { id: string }>> = {}): EditorAdapter<Draft, { id: string }> {
  return {
    validate: () => ({}),
    submit: async () => ({ id: 'saved' }),
    ...overrides
  }
}

describe('useEditorTask', () => {
  it('新 load 会中止上一请求，并忽略过期请求的结果', async () => {
    const firstLoad = deferred<Draft>()
    const signals: AbortSignal[] = []
    let loadCount = 0
    const task = useEditorTask({
      initialDraft: { title: '', summary: '' },
      adapter: createAdapter({
        load: signal => {
          signals.push(signal)
          loadCount += 1
          return loadCount === 1
            ? firstLoad.promise
            : Promise.resolve({ title: '权威标题', summary: '第二次加载' })
        }
      })
    })

    const staleRequest = task.load()
    const currentRequest = task.load()

    expect(signals[0]?.aborted).toBe(true)
    await currentRequest
    firstLoad.resolve({ title: '过期标题', summary: '第一次加载' })
    await staleRequest

    expect(task.draft.value).toEqual({ title: '权威标题', summary: '第二次加载' })
    expect(task.phase.value).toBe('READY')
    expect(task.isDirty.value).toBe(false)
  })

  it('客户端校验失败时不调用 submit，并保留字段错误', async () => {
    const submit = vi.fn(async () => ({ id: 'unexpected' }))
    const task = useEditorTask({
      initialDraft: { title: '', summary: '' },
      adapter: createAdapter({ validate: () => ({ title: '请输入标题' }), submit })
    })

    const result = await task.submit('PUBLISH')

    expect(result).toBeNull()
    expect(submit).not.toHaveBeenCalled()
    expect(task.clientErrors.value).toEqual({ title: '请输入标题' })
    expect(task.phase.value).toBe('FAILED')
  })

  it('服务端 AppError 保留数组字段错误和页面级消息', async () => {
    const task = useEditorTask({
      initialDraft: { title: '重复标题', summary: '' },
      adapter: createAdapter({
        submit: async () => {
          throw new AppError('竞赛名称已存在', {
            status: 400,
            code: 'VALIDATION_ERROR',
            fieldErrors: { title: ['该名称已存在', '请更换名称'] }
          })
        }
      })
    })

    const result = await task.submit('SAVE_DRAFT')

    expect(result).toBeNull()
    expect(task.serverFieldErrors.value).toEqual({ title: ['该名称已存在', '请更换名称'] })
    expect(task.formError.value).toBe('竞赛名称已存在')
    expect(task.phase.value).toBe('FAILED')
  })

  it('并发点击提交只执行一次 adapter.submit', async () => {
    const pending = deferred<{ id: string }>()
    const submit = vi.fn(() => pending.promise)
    const task = useEditorTask({
      initialDraft: { title: '竞赛', summary: '' },
      adapter: createAdapter({ submit })
    })

    const first = task.submit('PUBLISH')
    const second = task.submit('PUBLISH')

    expect(submit).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    pending.resolve({ id: 'competition-1' })
    await expect(first).resolves.toEqual({ id: 'competition-1' })
    expect(task.phase.value).toBe('SUCCEEDED')
  })

  it('提交进行中拒绝合并不同 intent，避免把保存结果误当作发布成功', async () => {
    const pending = deferred<{ id: string }>()
    const submit = vi.fn(() => pending.promise)
    const task = useEditorTask({
      initialDraft: { title: '竞赛', summary: '' },
      adapter: createAdapter({ submit })
    })

    const saveDraft = task.submit('SAVE_DRAFT')
    const publish = task.submit('PUBLISH')

    expect(submit).toHaveBeenCalledOnce()
    await expect(publish).resolves.toBeNull()
    pending.resolve({ id: 'competition-1' })
    await expect(saveDraft).resolves.toEqual({ id: 'competition-1' })
  })

  it('提交成功刷新快照，后续修改才重新变脏', async () => {
    const task = useEditorTask({
      initialDraft: { title: '初始标题', summary: '' },
      adapter: createAdapter()
    })
    task.draft.value.title = '更新标题'
    expect(task.isDirty.value).toBe(true)

    await task.submit('SAVE_PUBLISHED')

    expect(task.isDirty.value).toBe(false)
    task.draft.value.summary = '保存后的新修改'
    expect(task.isDirty.value).toBe(true)
  })

  it('提交失败不会重置 dirty，retry 会重试最后一次意图', async () => {
    const submit = vi
      .fn<EditorAdapter<Draft, { id: string }>['submit']>()
      .mockRejectedValueOnce(new Error('临时网络错误'))
      .mockResolvedValueOnce({ id: 'saved-after-retry' })
    const task = useEditorTask({
      initialDraft: { title: '初始标题', summary: '' },
      adapter: createAdapter({ submit })
    })
    task.draft.value.title = '待保存标题'

    await expect(task.submit('SAVE_DRAFT')).resolves.toBeNull()
    expect(task.isDirty.value).toBe(true)
    expect(task.formError.value).toBe('保存失败，请稍后重试。')

    await expect(task.retry()).resolves.toEqual({ id: 'saved-after-retry' })
    expect(submit).toHaveBeenLastCalledWith(task.draft.value, 'SAVE_DRAFT')
    expect(task.isDirty.value).toBe(false)
  })
})
