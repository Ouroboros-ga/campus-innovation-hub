import { onScopeDispose, ref, toValue, watch, type Ref, type WatchSource } from 'vue'

/**
 * 防抖值：source 停止变化 delay 毫秒后才更新返回的 ref。
 *
 * 用于搜索输入等场景：输入停顿后才触发过滤 / 请求（懒搜索），
 * 避免每次按键立即发起高频操作。与 OrganizationEditorModal 的 300ms 约定一致。
 */
export function useDebouncedValue<T>(source: WatchSource<T>, delay = 300): Ref<T> {
  const debounced = ref(toValue(source))
  let timer: ReturnType<typeof globalThis.setTimeout> | null = null

  watch(source, value => {
    if (timer) globalThis.clearTimeout(timer)
    timer = globalThis.setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => {
    if (timer) globalThis.clearTimeout(timer)
  })

  return debounced
}