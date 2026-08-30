import { computed, onScopeDispose, ref, toRaw, type Ref } from 'vue'

import { AppError, type FieldErrors } from '@/shared/http/types'
import type { EditorAdapter, EditorIntent, EditorPhase } from '@/shared/types/editor'

interface UseEditorTaskOptions<TDraft, TResult> {
  initialDraft: TDraft
  adapter: EditorAdapter<TDraft, TResult>
}

function cloneDraft<TDraft>(draft: TDraft): TDraft {
  return globalThis.structuredClone(toRaw(draft) as TDraft)
}

function fingerprint<TDraft>(draft: TDraft): string {
  // 保留 reactive 属性读取，让 computed 能追踪嵌套字段变化。
  return JSON.stringify(draft)
}

/**
 * 领域无关的编辑任务状态机。
 *
 * 它只管理请求阶段、草稿快照、错误与重复提交保护；路由确认、toast、字段 alias
 * 和具体 DTO 均由 feature 层负责，避免 shared 反向依赖业务。
 */
export function useEditorTask<TDraft, TResult>({ initialDraft, adapter }: UseEditorTaskOptions<TDraft, TResult>) {
  const draft = ref(cloneDraft(initialDraft)) as Ref<TDraft>
  const phase = ref<EditorPhase>('IDLE')
  const clientErrors = ref<Record<string, string>>({})
  const serverFieldErrors = ref<FieldErrors | null>(null)
  const formError = ref<string | null>(null)
  const savedFingerprint = ref(fingerprint(draft.value))

  let loadController: AbortController | null = null
  let activeSubmission: Promise<TResult | null> | null = null
  let activeIntent: EditorIntent | null = null
  let lastOperation: 'LOAD' | 'SUBMIT' | null = null
  let lastIntent: EditorIntent | null = null

  const isDirty = computed(() => fingerprint(draft.value) !== savedFingerprint.value)
  const isLoading = computed(() => phase.value === 'LOADING')
  const isSubmitting = computed(() => phase.value === 'SUBMITTING')

  function clearErrors(): void {
    clientErrors.value = {}
    serverFieldErrors.value = null
    formError.value = null
  }

  function resetSnapshot(value: TDraft = draft.value): void {
    savedFingerprint.value = fingerprint(value)
  }

  async function load(): Promise<TDraft | null> {
    lastOperation = 'LOAD'
    loadController?.abort()
    const controller = new AbortController()
    loadController = controller
    clearErrors()
    phase.value = 'LOADING'

    if (!adapter.load) {
      resetSnapshot()
      phase.value = 'READY'
      loadController = null
      return draft.value
    }

    try {
      const loadedDraft = await adapter.load(controller.signal)
      if (loadController !== controller || controller.signal.aborted) return null
      draft.value = cloneDraft(loadedDraft)
      resetSnapshot(loadedDraft)
      phase.value = 'READY'
      return draft.value
    } catch (error: unknown) {
      if (loadController !== controller || controller.signal.aborted) return null
      phase.value = 'FAILED'
      formError.value = error instanceof AppError ? error.message : '加载失败，请稍后重试。'
      return null
    } finally {
      if (loadController === controller) loadController = null
    }
  }

  function submit(intent: EditorIntent): Promise<TResult | null> {
    if (activeSubmission) {
      return activeIntent === intent ? activeSubmission : Promise.resolve(null)
    }

    lastOperation = 'SUBMIT'
    lastIntent = intent
    clearErrors()

    const submittedDraft = cloneDraft(draft.value)
    const validationErrors = adapter.validate(submittedDraft)
    if (Object.keys(validationErrors).length > 0) {
      clientErrors.value = validationErrors
      phase.value = 'FAILED'
      return Promise.resolve(null)
    }

    phase.value = 'SUBMITTING'
    activeIntent = intent
    const operation = adapter
      .submit(submittedDraft, intent)
      .then(result => {
        resetSnapshot(submittedDraft)
        phase.value = 'SUCCEEDED'
        return result
      })
      .catch((error: unknown) => {
        phase.value = 'FAILED'
        if (error instanceof AppError) {
          serverFieldErrors.value = error.fieldErrors
          formError.value = error.message
        } else {
          formError.value = '保存失败，请稍后重试。'
        }
        return null
      })
      .finally(() => {
        if (activeSubmission === operation) {
          activeSubmission = null
          activeIntent = null
        }
      })

    activeSubmission = operation
    return operation
  }

  function retry(): Promise<TDraft | TResult | null> {
    if (lastOperation === 'LOAD') return load()
    if (lastOperation === 'SUBMIT' && lastIntent) return submit(lastIntent)
    return Promise.resolve(null)
  }

  function abortLoad(): void {
    loadController?.abort()
    loadController = null
    if (phase.value === 'LOADING') phase.value = 'IDLE'
  }

  onScopeDispose(abortLoad, true)

  return {
    draft,
    phase,
    clientErrors,
    serverFieldErrors,
    formError,
    isDirty,
    isLoading,
    isSubmitting,
    load,
    submit,
    retry,
    abortLoad,
    clearErrors,
    resetSnapshot
  }
}
