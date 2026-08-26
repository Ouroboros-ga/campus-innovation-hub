<script setup lang="ts">
import { deadlineKindLabel } from '@/shared/lib/domain-labels'
import type { DeadlineItem as DeadlineItemType } from '@/shared/types/homepage'
import DeadlineText from './DeadlineText.vue'

/**
 * 即将截止条目（FE-008）。
 *
 * 设计来源：
 * - §20：截止摘要使用卡片（content 需边界时）；
 * - PageMap 首页-即将截止：类型 + 名称 + 剩余时间 + 截止日期；
 * - §43：剩余时间陈述事实；§24：类型徽标为简要分类。
 */
defineProps<{
  item: DeadlineItemType
}>()
</script>

<template>
  <RouterLink
    :to="item.detailPath"
    class="group flex w-full items-start gap-3 rounded-card border border-default bg-default p-4 transition-colors hover:border-primary-300 hover:bg-muted"
  >
    <div class="min-w-0 flex-1">
      <div class="flex items-start gap-2">
        <UBadge
          size="sm"
          variant="soft"
          color="neutral"
          class="mt-0.5 shrink-0"
        >
          {{ deadlineKindLabel[item.kind] }}
        </UBadge>
        <h3
          class="line-clamp-2 text-sm font-semibold text-highlighted transition-colors group-hover:text-primary-600"
        >
          {{ item.title }}
        </h3>
      </div>
      <DeadlineText
        :deadline-at="item.deadlineAt"
        class="mt-3"
      />
    </div>
    <UIcon
      name="i-lucide-chevron-right"
      class="mt-0.5 size-5 shrink-0 text-muted transition-colors group-hover:text-primary-600"
      aria-hidden="true"
    />
  </RouterLink>
</template>
