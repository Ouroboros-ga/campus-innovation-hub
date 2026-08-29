<script setup lang="ts">
import { ref, watch } from 'vue'

import { useDebouncedValue } from '@/shared/composables/useDebouncedValue'

import {
  competitionCategoryOptions,
  competitionFormatOptions,
  competitionStatusOptions,
  type CompetitionQuery
} from '../lib/competitionFilters'

/**
 * 竞赛筛选（FE-020）。
 *
 * 设计来源：
 * - FrontendDesign.md §34.5：桌面为搜索 + 下拉；手机为搜索 + 「筛选」按钮打开 UDrawer；
 *   筛选值始终 URL-backed，不建独立手机筛选状态；Drawer 含完整控件 + 重置 + 查看结果；
 * - §43 / §24：选项用语义状态与简短分类的简体中文；
 * - §10：卡片无阴影、默认边框；筛选控件不用 pill 装饰。
 */
const props = defineProps<{ query: CompetitionQuery }>()
const emit = defineEmits<{
  change: [patch: Partial<CompetitionQuery>]
  reset: []
}>()

const drawerOpen = ref(false)

// 懒搜索：输入停顿 300ms 后才 emit，避免每次按键触发 URL 更新与列表请求
const searchInput = ref(props.query.q ?? '')
watch(
  () => props.query.q,
  value => {
    searchInput.value = value ?? ''
  }
)
const debouncedQ = useDebouncedValue(searchInput, 300)
watch(debouncedQ, value => emit('change', { q: value }))

/** 手机端状态快捷 chip：仅作快捷设置状态，清除走「已选条件」/重置。 */
function onStatusQuick(value: string) {
  emit('change', { status: value })
}
</script>

<template>
  <div>
    <!-- 桌面筛选栏：搜索 + 带标签下拉 + 重置 -->
    <div class="hidden flex-wrap items-end gap-3 md:flex">
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="搜索竞赛名称、关键词"
        aria-label="搜索竞赛"
        class="w-64"
      />
      <div>
        <p class="mb-1 text-xs text-muted">
          状态
        </p>
        <USelect
          :model-value="props.query.status ?? undefined"
          :items="competitionStatusOptions"
          placeholder="全部状态"
          class="w-40"
          @update:model-value="v => emit('change', { status: v || undefined })"
        />
      </div>
      <div>
        <p class="mb-1 text-xs text-muted">
          分类
        </p>
        <USelect
          :model-value="props.query.category ?? undefined"
          :items="competitionCategoryOptions"
          placeholder="全部分类"
          class="w-44"
          @update:model-value="v => emit('change', { category: v || undefined })"
        />
      </div>
      <div>
        <p class="mb-1 text-xs text-muted">
          个人/团队
        </p>
        <USelect
          :model-value="props.query.format ?? undefined"
          :items="competitionFormatOptions"
          placeholder="全部"
          class="w-40"
          @update:model-value="v => emit('change', { format: v || undefined })"
        />
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-rotate-ccw"
        class="mb-0.5"
        @click="emit('reset')"
      >
        重置
      </UButton>
    </div>

    <!-- 手机：搜索 + 状态快捷筛选 + 筛选按钮（§34.5） -->
    <div class="md:hidden">
      <UInput
        v-model="searchInput"
        icon="i-lucide-search"
        placeholder="搜索竞赛名称、关键词"
        aria-label="搜索竞赛"
        class="w-full"
      />

      <div class="mt-3 flex items-start gap-2">
        <div
          class="flex flex-1 flex-wrap gap-2"
          role="group"
          aria-label="按报名状态筛选"
        >
          <UButton
            v-for="opt in competitionStatusOptions"
            :key="opt.value"
            :variant="props.query.status === opt.value ? 'solid' : 'outline'"
            :color="props.query.status === opt.value ? 'primary' : 'neutral'"
            :aria-pressed="props.query.status === opt.value"
            @click="onStatusQuick(opt.value)"
          >
            {{ opt.label }}
          </UButton>
        </div>

        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-sliders-horizontal"
          @click="drawerOpen = true"
        >
          筛选
        </UButton>
      </div>
    </div>

    <!-- 手机：筛选 Drawer -->
    <UDrawer v-model:open="drawerOpen">
      <template #content>
        <div class="space-y-5 p-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-highlighted">
              筛选
            </h2>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              aria-label="关闭筛选"
              @click="drawerOpen = false"
            />
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted">
              状态
            </p>
            <USelect
              :model-value="props.query.status ?? undefined"
              :items="competitionStatusOptions"
              placeholder="全部状态"
              class="w-full"
              @update:model-value="v => emit('change', { status: v || undefined })"
            />
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted">
              分类
            </p>
            <USelect
              :model-value="props.query.category ?? undefined"
              :items="competitionCategoryOptions"
              placeholder="全部分类"
              class="w-full"
              @update:model-value="v => emit('change', { category: v || undefined })"
            />
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted">
              个人/团队
            </p>
            <USelect
              :model-value="props.query.format ?? undefined"
              :items="competitionFormatOptions"
              placeholder="全部"
              class="w-full"
              @update:model-value="v => emit('change', { format: v || undefined })"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              class="flex-1"
              @click="emit('reset')"
            >
              重置
            </UButton>
            <UButton
              color="primary"
              class="flex-1"
              @click="drawerOpen = false"
            >
              查看结果
            </UButton>
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
