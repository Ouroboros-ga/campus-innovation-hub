<script setup lang="ts">
import { computed } from 'vue'

import { formatCompactDate } from '@/shared/lib/date'
import {
  teamPostTypeMeta,
  teamStatusMeta
} from '../lib/teamLabels'
import type { TeamPost } from '../types'

/**
 * 组队帖卡（FE-030 / §22 / PageMap §组队列表项）。
 *
 * 展示：标题、信息类型 / 状态 / 本人徽标、关联竞赛、当前/目标人数、
 * 招募岗位、技能标签、目标说明、发布者与查看详情；本人发布者额外提供编辑 / 关闭。
 * 卡片在网格中等高：根节点 `h-full` + 底部推挤（等宽网格内各卡片高度一致）。
 * 不展示点赞 / 关注 / 热度等虚构指标（§22、database-design §28）。
 */
const props = defineProps<{ post: TeamPost }>()
const emit = defineEmits<{
  close: [id: string]
  edit: [id: string]
}>()

const typeMeta = computed(() => teamPostTypeMeta[props.post.postType])
const statusMeta = computed(() => teamStatusMeta[props.post.status])
const publishedText = computed(() => formatCompactDate(props.post.publishedAt))
const memberCountText = computed(
  () => `${props.post.baseMemberCount} / ${props.post.targetMemberCount}`
)
</script>

<template>
  <article class="flex h-full flex-col rounded-card border border-default bg-default p-4">
    <!-- 标题 + 徽标 -->
    <div class="flex items-start justify-between gap-3">
      <h3 class="line-clamp-2 text-base font-semibold leading-snug text-highlighted">
        {{ post.title }}
      </h3>
      <div class="flex shrink-0 flex-wrap items-start justify-end gap-1.5">
        <UBadge
          size="sm"
          variant="soft"
          :color="typeMeta.color"
        >
          {{ typeMeta.label }}
        </UBadge>
        <UBadge
          v-if="post.status !== 'RECRUITING'"
          size="sm"
          variant="soft"
          :color="statusMeta.color"
        >
          {{ statusMeta.label }}
        </UBadge>
        <UBadge
          v-if="post.isOwned"
          size="sm"
          variant="soft"
          color="success"
          icon="i-lucide-clock"
        >
          我发布的
        </UBadge>
      </div>
    </div>

    <!-- 关联竞赛 + 人数 -->
    <div class="mt-2 flex items-center gap-1.5 text-sm">
      <UIcon
        name="i-lucide-trophy"
        class="size-4 shrink-0 text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1 truncate text-muted">
        {{ post.competitionName }}
      </span>
      <span class="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted">
        <UIcon
          name="i-lucide-user"
          class="size-3.5"
          aria-hidden="true"
        />
        {{ memberCountText }}
      </span>
    </div>

    <!-- 招募岗位 -->
    <p class="mt-3 text-xs text-muted">
      招募岗位
    </p>
    <div class="mt-1.5 flex flex-wrap gap-1.5">
      <span
        v-for="role in post.roles"
        :key="role"
        class="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-highlighted dark:bg-neutral-800"
      >
        {{ role }}
      </span>
    </div>

    <!-- 技能标签 -->
    <p class="mt-3 text-xs text-muted">
      技能标签
    </p>
    <div class="mt-1.5 flex flex-wrap gap-1.5">
      <span
        v-for="skill in post.skills"
        :key="skill"
        class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
      >
        {{ skill }}
      </span>
    </div>

    <!-- 目标说明 -->
    <p class="mt-3 line-clamp-2 text-sm leading-6 text-toned">
      {{ post.goal }}
    </p>

    <!-- 底部推挤：等高网格内把发布者 & 操作对齐到底部 -->
    <div
      class="flex-1"
      aria-hidden="true"
    />

    <!-- 底部：发布者 + 查看详情 / 编辑 / 关闭 -->
    <footer
      class="mt-4 flex items-center justify-between gap-3 border-t border-default pt-3"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          class="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-user"
            class="size-4"
          />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ post.creatorName }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ post.creatorGrade }} | {{ post.creatorMajor }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span class="hidden text-xs tabular-nums text-muted md:inline">
          发布于 {{ publishedText }}
        </span>
        <template v-if="post.isOwned">
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            @click="emit('edit', post.id)"
          >
            编辑
          </UButton>
          <UButton
            size="sm"
            variant="ghost"
            color="error"
            @click="emit('close', post.id)"
          >
            关闭
          </UButton>
        </template>
        <RouterLink
          :to="post.detailPath"
          class="inline-flex min-h-8 items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          查看详情
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </footer>
  </article>
</template>
