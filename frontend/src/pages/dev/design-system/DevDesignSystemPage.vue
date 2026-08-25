<script setup lang="ts">
import { useToast } from '@nuxt/ui/composables'
import { ref } from 'vue'

const toast = useToast()
const isModalOpen = ref(false)
const isDrawerOpen = ref(false)
const selectedCategory = ref('竞赛')
const selectedDensity = ref('舒适')
const receivesNotifications = ref(true)
const sampleName = ref('人工智能创新实践')
const sampleNote = ref('用于检查多行文本的字号、行高与字段状态。')

const primaryShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const categories = ['竞赛', '活动', '组织']
const densityOptions = ['紧凑', '舒适']
function showToast() {
  toast.add({
    title: '设置已保存',
    description: '这是一条可操作、可被理解的反馈。',
    icon: 'i-lucide-circle-check',
    color: 'success'
  })
}
</script>

<template>
  <main class="min-h-dvh pb-12">
    <header class="border-b border-default bg-default">
      <div class="page-container flex min-h-17 items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-inverted">
            <UIcon
              name="i-lucide-panels-top-left"
              class="size-5"
              aria-hidden="true"
            />
          </div>
          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-highlighted sm:text-lg">
              科创与就业服务平台
            </p>
            <p class="text-xs text-muted">
              开发视觉参考
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UBadge
            class="hidden sm:inline-flex"
            color="primary"
            variant="soft"
          >
            FE-003
          </UBadge>
          <UColorModeButton aria-label="切换外观模式" />
        </div>
      </div>
    </header>

    <div class="page-container pt-6">
      <section class="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div class="flex flex-col justify-center py-4 lg:py-6">
          <h1 class="max-w-xl text-3xl font-bold leading-tight text-highlighted">
            设计系统<span class="text-primary">活体参考</span>
          </h1>
          <p class="mt-3 max-w-xl text-base text-muted">
            用统一的颜色、排版、组件和交互，让校园服务保持清晰、可信与一致。
          </p>

          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <article class="rounded-card border border-default bg-default p-4 shadow-sm">
              <UIcon
                name="i-lucide-palette"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              <h2 class="mt-3 text-sm font-semibold text-highlighted">
                颜色
              </h2>
              <p class="mt-1 text-xs text-muted">
                语义 token
              </p>
            </article>
            <article class="rounded-card border border-default bg-default p-4 shadow-sm">
              <UIcon
                name="i-lucide-type"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              <h2 class="mt-3 text-sm font-semibold text-highlighted">
                排版
              </h2>
              <p class="mt-1 text-xs text-muted">
                中文优先
              </p>
            </article>
            <article class="rounded-card border border-default bg-default p-4 shadow-sm">
              <UIcon
                name="i-lucide-radius"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              <h2 class="mt-3 text-sm font-semibold text-highlighted">
                圆角
              </h2>
              <p class="mt-1 text-xs text-muted">
                8 / 10 / 12
              </p>
            </article>
            <article class="rounded-card border border-default bg-default p-4 shadow-sm">
              <UIcon
                name="i-lucide-scan-line"
                class="size-5 text-primary"
                aria-hidden="true"
              />
              <h2 class="mt-3 text-sm font-semibold text-highlighted">
                焦点
              </h2>
              <p class="mt-1 text-xs text-muted">
                2px ring
              </p>
            </article>
          </div>
        </div>

        <section class="overflow-hidden rounded-surface border border-default bg-default shadow-sm">
          <div class="flex items-center justify-between border-b border-default px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-highlighted">
                排版与色彩
              </h2>
              <p class="mt-1 text-xs text-muted">
                Primary 色阶与中文信息层级
              </p>
            </div>
            <UBadge
              color="success"
              variant="soft"
            >
              WCAG AA
            </UBadge>
          </div>

          <div class="p-5">
            <div
              class="grid h-24 grid-cols-11 overflow-hidden rounded-card"
              aria-label="Primary 色阶"
            >
              <div
                v-for="shade in primaryShades"
                :key="shade"
                :style="{ backgroundColor: `var(--color-primary-${shade})` }"
                class="flex items-end justify-center pb-2"
              >
                <span
                  class="hidden text-[11px] font-medium sm:inline"
                  :class="shade >= 600 ? 'text-white' : 'text-neutral-900'"
                >
                  {{ shade }}
                </span>
              </div>
            </div>

            <div class="mt-5 grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p class="text-2xl font-bold text-highlighted">
                  页面标题 Page H1
                </p>
                <p class="mt-2 text-lg font-semibold text-highlighted">
                  区块标题 Section H2
                </p>
                <p class="mt-2 text-base text-default">
                  正文用于解释任务、状态与下一步操作。
                </p>
                <p class="mt-1 text-sm text-muted">
                  辅助信息保持可读，不以低对比度换取轻盈感。
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-card bg-success/10 p-3 text-success">
                  Success
                </div>
                <div class="rounded-card bg-warning/10 p-3 text-warning">
                  Warning
                </div>
                <div class="rounded-card bg-error/10 p-3 text-error">
                  Danger
                </div>
                <div class="rounded-card bg-primary/10 p-3 text-primary">
                  Info
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,0.9fr)]">
        <div class="space-y-5">
          <section class="rounded-surface border border-default bg-default p-5 shadow-sm sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold text-highlighted">
                  按钮与状态
                </h2>
                <p class="mt-1 text-sm text-muted">
                  单一主操作、明确语义和 44px 触摸目标。
                </p>
              </div>
              <UBadge
                color="warning"
                variant="soft"
              >
                即将截止
              </UBadge>
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-3">
              <UButton
                label="主要操作"
                icon="i-lucide-check"
              />
              <UButton
                label="次要操作"
                color="neutral"
                variant="outline"
              />
              <UButton
                label="柔和操作"
                color="primary"
                variant="soft"
              />
              <UButton
                label="不可用"
                color="neutral"
                disabled
              />
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-3">
              <UBadge
                color="success"
                variant="soft"
              >
                成功
              </UBadge>
              <UBadge
                color="warning"
                variant="soft"
              >
                提醒
              </UBadge>
              <UBadge
                color="error"
                variant="soft"
              >
                错误
              </UBadge>
              <UBadge
                color="neutral"
                variant="outline"
              >
                中性
              </UBadge>
              <a
                href="#form-controls"
                class="ui-touch-link text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                文本链接示例
              </a>
            </div>
          </section>

          <section
            id="form-controls"
            class="rounded-surface border border-default bg-default p-5 shadow-sm sm:p-6"
          >
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                表单控件
              </h2>
              <p class="mt-1 text-sm text-muted">
                标签、字段状态与帮助信息始终靠近输入控件。
              </p>
            </div>

            <div class="mt-5 grid gap-5 md:grid-cols-2">
              <UFormField
                label="示例名称"
                name="design-system-name"
              >
                <UInput
                  v-model="sampleName"
                  name="design-system-name"
                  class="w-full"
                  icon="i-lucide-pen-line"
                />
              </UFormField>

              <UFormField
                label="内容类型"
                name="design-system-category"
              >
                <USelect
                  v-model="selectedCategory"
                  name="design-system-category"
                  class="w-full"
                  :items="categories"
                />
              </UFormField>

              <UFormField
                label="补充说明"
                name="design-system-note"
                class="md:col-span-2"
              >
                <UTextarea
                  v-model="sampleNote"
                  name="design-system-note"
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>

            <div class="mt-5 grid gap-5 border-t border-default pt-5 md:grid-cols-2">
              <UCheckbox
                v-model="receivesNotifications"
                name="design-system-notifications"
                label="接收活动提醒"
                description="通过站内通知获取重要截止时间。"
              />
              <URadioGroup
                v-model="selectedDensity"
                legend="信息密度"
                orientation="horizontal"
                :items="densityOptions"
              />
            </div>
          </section>
        </div>

        <aside class="space-y-5">
          <section class="rounded-surface border border-default bg-default p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-highlighted">
              Lucide 图标
            </h2>
            <p class="mt-1 text-sm text-muted">
              同一图标家族、统一线性风格。
            </p>
            <div class="mt-5 grid grid-cols-3 gap-3">
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-trophy"
                  class="size-5 text-default"
                  aria-hidden="true"
                />竞赛
              </div>
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-users"
                  class="size-5 text-default"
                  aria-hidden="true"
                />队伍
              </div>
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-building-2"
                  class="size-5 text-default"
                  aria-hidden="true"
                />组织
              </div>
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-calendar-days"
                  class="size-5 text-default"
                  aria-hidden="true"
                />活动
              </div>
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 text-default"
                  aria-hidden="true"
                />通知
              </div>
              <div class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border border-default bg-muted text-xs text-muted">
                <UIcon
                  name="i-lucide-circle-question-mark"
                  class="size-5 text-default"
                  aria-hidden="true"
                />帮助
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between rounded-card bg-muted p-4">
              <div class="flex items-center gap-3">
                <UAvatar
                  text="张"
                  alt="张同学"
                  size="lg"
                  color="primary"
                />
                <div>
                  <p class="text-sm font-semibold text-highlighted">
                    张同学
                  </p>
                  <p class="text-xs text-muted">
                    人工智能学院
                  </p>
                </div>
              </div>
              <UTooltip text="这是 Tooltip 示例">
                <UButton
                  aria-label="查看提示示例"
                  icon="i-lucide-info"
                  color="neutral"
                  variant="ghost"
                />
              </UTooltip>
            </div>
          </section>

          <section class="rounded-surface border border-default bg-default p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-highlighted">
              反馈与浮层
            </h2>
            <div class="mt-4 grid gap-3">
              <UButton
                aria-label="打开确认对话框"
                label="打开 Modal"
                icon="i-lucide-panels-top-left"
                color="neutral"
                variant="outline"
                block
                @click="isModalOpen = true"
              />
              <UButton
                aria-label="打开侧边抽屉"
                label="打开 Drawer"
                icon="i-lucide-panel-right-open"
                color="neutral"
                variant="outline"
                block
                @click="isDrawerOpen = true"
              />
              <UButton
                aria-label="显示操作反馈"
                label="显示 Toast"
                icon="i-lucide-bell-ring"
                block
                @click="showToast"
              />
            </div>
          </section>

          <section class="rounded-surface border border-default bg-default p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-highlighted">
              加载与空状态
            </h2>
            <div
              data-design-system="skeleton"
              class="mt-4 space-y-3"
              aria-label="加载骨架示例"
            >
              <USkeleton class="h-4 w-2/3" />
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-4/5" />
            </div>
            <UEmpty
              class="mt-5"
              icon="i-lucide-inbox"
              title="当前没有待处理内容"
              description="新的申请或通知会显示在这里。"
              size="sm"
            />
          </section>
        </aside>
      </div>
    </div>

    <UModal
      v-model:open="isModalOpen"
      title="确认示例操作"
      description="Modal 用于需要用户集中确认的任务。"
    >
      <template #body>
        <p class="text-sm text-default">
          主要操作应明确说明结果，关闭后焦点会返回触发按钮。
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-3">
          <UButton
            label="取消"
            color="neutral"
            variant="outline"
            @click="close"
          />
          <UButton
            label="确认操作"
            @click="close"
          />
        </div>
      </template>
    </UModal>

    <UDrawer
      v-model:open="isDrawerOpen"
      title="抽屉组件示例"
      description="移动端导航和上下文操作可使用 Drawer。"
      direction="right"
      close
    >
      <template #body>
        <div class="space-y-4 p-1">
          <p class="text-sm text-default">
            抽屉中的内容保持单列、可滚动，并为关闭操作提供清晰标签。
          </p>
          <UButton
            label="完成查看"
            block
            @click="isDrawerOpen = false"
          />
        </div>
      </template>
    </UDrawer>
  </main>
</template>
