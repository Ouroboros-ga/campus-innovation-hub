<script setup lang="ts">
import { ref } from 'vue'

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
          color="neutral"
          :variant="tab === 'edit' ? 'soft' : 'ghost'"
          icon="i-lucide-pencil"
          :aria-selected="tab === 'edit'"
          role="tab"
          class="w-full"
          @click="tab = 'edit'"
        >
          编辑
        </UButton>
        <UButton
          color="neutral"
          :variant="tab === 'preview' ? 'soft' : 'ghost'"
          icon="i-lucide-eye"
          :aria-selected="tab === 'preview'"
          role="tab"
          class="w-full"
          @click="tab = 'preview'"
        >
          预览
        </UButton>
      </div>
    </div>

    <!-- 表单 + 预览 主体：桌面双栏，移动收尾为单栏（由段选开关控制显示哪个） -->
    <div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div
        data-test="content-editor-edit"
        class="space-y-6 lg:block"
        :class="tab === 'edit' ? 'block' : 'hidden'"
      >
        <slot name="form" />
      </div>

      <div
        data-test="content-editor-preview"
        class="rounded-surface border border-default bg-default p-4 sm:p-5 lg:block"
        :class="tab === 'preview' ? 'block' : 'hidden'"
      >
        <div class="mb-3 flex items-center gap-2">
          <UIcon
            name="i-lucide-eye"
            class="size-4 text-muted"
            aria-hidden="true"
          />
          <h3 class="text-sm font-semibold text-highlighted">
            {{ previewTitle }}
          </h3>
        </div>
        <slot name="preview" />
      </div>
    </div>
  </div>
</template>
