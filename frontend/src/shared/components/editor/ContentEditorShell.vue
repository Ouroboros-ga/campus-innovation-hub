<script setup lang="ts">
import { ref, useId } from 'vue'

/**
 * 内容编辑预览壳（ContentEditorShell）。
 *
 * 把「表单」与「实时预览」以响应式方式组合（FrontendDesign §26「large forms grouped」、
 * §34.8「移动端 label 上置、单列」）：
 * - 桌面（lg+）：左表单、右预览 双栏并排；
 * - 移动（< lg）：**不硬塞左右并排**，改为「编辑 / 预览」段选开关，同一组件内切换，
 *   不丢表单状态、不丢滚动位置，符合移动端单列规则。
 *
 * 预览内容由调用方通过 `#preview` 插槽提供（可用 RichContent 渲染 markdown，
 * 或结构化拼装详细预览），本组件只负责布局与切换，保持可复用。
 */
withDefaults(defineProps<{ previewTitle?: string }>(), { previewTitle: '预览' })

type Tab = 'edit' | 'preview'
const tab = ref<Tab>('edit')
const instanceId = useId()
const editTabId = `${instanceId}-edit-tab`
const previewTabId = `${instanceId}-preview-tab`
const editPanelId = `${instanceId}-edit-panel`
const previewPanelId = `${instanceId}-preview-panel`

function selectTab(nextTab: Tab): void {
  tab.value = nextTab
}

function onTabKeydown(event: KeyboardEvent): void {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const nextTab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'edit' : 'preview'
  selectTab(nextTab)
  const targetId = nextTab === 'edit' ? editTabId : previewTabId
  globalThis.document?.getElementById(targetId)?.focus()
}
</script>

<template>
  <div class="space-y-6">
    <!-- 移动端：编辑 / 预览 段选开关（仅 < lg 显示） -->
    <div class="lg:hidden">
      <div
        role="tablist"
        aria-label="编辑与预览切换"
        class="grid grid-cols-2 gap-1 rounded-surface border border-default bg-muted p-1"
      >
        <UButton
          :id="editTabId"
          type="button"
          color="neutral"
          :variant="tab === 'edit' ? 'soft' : 'ghost'"
          icon="i-lucide-pencil"
          :aria-selected="tab === 'edit'"
          :aria-controls="editPanelId"
          :tabindex="tab === 'edit' ? 0 : -1"
          role="tab"
          class="w-full"
          @click="selectTab('edit')"
          @keydown="onTabKeydown"
        >
          编辑
        </UButton>
        <UButton
          :id="previewTabId"
          type="button"
          color="neutral"
          :variant="tab === 'preview' ? 'soft' : 'ghost'"
          icon="i-lucide-eye"
          :aria-selected="tab === 'preview'"
          :aria-controls="previewPanelId"
          :tabindex="tab === 'preview' ? 0 : -1"
          role="tab"
          class="w-full"
          @click="selectTab('preview')"
          @keydown="onTabKeydown"
        >
          预览
        </UButton>
      </div>
    </div>

    <div
      data-test="content-editor-layout"
      class="lg:grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start lg:gap-6 xl:gap-8"
      :class="$slots.navigation ? 'xl:grid-cols-[13rem_minmax(0,1fr)_22.5rem]' : 'xl:grid-cols-[minmax(0,1fr)_22.5rem]'"
    >
      <aside
        v-if="$slots.navigation"
        data-test="content-editor-navigation"
        class="hidden xl:block"
        aria-label="编辑小节导航"
      >
        <div class="sticky top-4">
          <slot name="navigation" />
        </div>
      </aside>

      <div
        :id="editPanelId"
        data-test="content-editor-edit"
        class="space-y-6 lg:block"
        :class="tab === 'edit' ? 'block' : 'hidden'"
        role="tabpanel"
        :aria-labelledby="editTabId"
      >
        <slot name="form" />
      </div>

      <div
        :id="previewPanelId"
        data-test="content-editor-preview"
        class="rounded-surface border border-default bg-default lg:sticky lg:top-4 lg:block"
        :class="tab === 'preview' ? 'block' : 'hidden'"
        role="tabpanel"
        :aria-labelledby="previewTabId"
      >
        <div class="flex items-center gap-2 border-b border-default px-4 py-3">
          <UIcon
            name="i-lucide-eye"
            class="size-4 text-muted"
            aria-hidden="true"
          />
          <h3 class="text-sm font-semibold text-highlighted">
            {{ previewTitle }}
          </h3>
        </div>
        <div
          data-test="content-editor-preview-scroll"
          class="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4 sm:p-5"
        >
          <slot name="preview" />
        </div>
      </div>
    </div>
  </div>
</template>
