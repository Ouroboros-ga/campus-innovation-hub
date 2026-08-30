import type { FieldErrors } from '@/shared/http/types'

/** 编辑任务向后端表达的写入意图；领域状态仍由后端权威决定。 */
export type EditorIntent = 'SAVE_DRAFT' | 'PUBLISH' | 'SAVE_PUBLISHED'

/** 编辑任务的可观察生命周期。 */
export type EditorPhase =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'SUBMITTING'
  | 'SUCCEEDED'
  | 'FAILED'

/**
 * 领域编辑器接入共享任务状态机的最小接口。
 *
 * shared 不认识具体 DTO、路由或 toast；feature 负责装配加载、校验和提交函数。
 */
export interface EditorAdapter<TDraft, TResult> {
  load?: (signal: AbortSignal) => Promise<TDraft>
  validate: (draft: TDraft) => Record<string, string>
  submit: (draft: TDraft, intent: EditorIntent) => Promise<TResult>
}

/** useEditorTask 对调用方暴露的归一化错误集合。 */
export interface EditorErrors {
  client: Record<string, string>
  server: FieldErrors | null
  form: string | null
}
