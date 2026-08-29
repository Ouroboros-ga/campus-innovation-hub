<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import {
  deriveRegistrationState,
  formatDateTimeCompact
} from '@/shared/lib/date'
import {
  competitionLevelLabel,
  participationModeLabel,
  registrationStateLabel
} from '@/shared/lib/domain-labels'
import { followCompetition, unfollowCompetition } from '@/features/competitions/api/competitionApi'
import { AppError } from '@/shared/http/types'
import ProgressiveImage from '@/shared/components/media/ProgressiveImage.vue'
import type { CompetitionDetail } from '../types'

/**
 * 竞赛详情页顶部（按参考设计稿）。
 *
 * 桌面：左侧品牌横幅（标题 + 级别）+ 右侧信息栏（名称 / 徽标 / 状态 / 截止 /
 * 简介 / 主操作）；手机：横幅置顶，信息栏下方，操作移到 Sticky Bottom Bar。
 */
const props = defineProps<{ detail: CompetitionDetail }>()

const nowDate = computed(() => new Date())
const state = computed(() =>
  deriveRegistrationState({
    required: true,
    startAt: props.detail.registrationStartAt,
    endAt: props.detail.registrationEndAt,
    now: nowDate.value
  })
)

const deadlineText = computed(() =>
  formatDateTimeCompact(props.detail.registrationEndAt)
)

const followed = ref(false)
const followLoading = ref(false)
const toast = useToast()

async function toggleFollow() {
  if (followLoading.value) return
  followLoading.value = true
  try {
    if (followed.value) {
      await unfollowCompetition(props.detail.id)
      followed.value = false
      toast.add({ title: '已取消关注', color: 'neutral' })
    } else {
      await followCompetition(props.detail.id)
      followed.value = true
      toast.add({ title: '已关注赛事', color: 'success' })
    }
  } catch (e) {
    if (e instanceof AppError && e.code === 'AUTH_REQUIRED') return
    toast.add({ title: e instanceof Error ? e.message : '操作失败', color: 'error' })
  } finally {
    followLoading.value = false
  }
}

/** 主任务（§34.7）：立即报名 → 官网外链，其次报名指南，最后咨询指南。 */
const registerAction = computed(() => {
  if (props.detail.officialUrl) {
    return { href: props.detail.officialUrl, icon: 'i-lucide-external-link' }
  }
  if (props.detail.guidePath) {
    return { to: props.detail.guidePath, icon: 'i-lucide-arrow-right' }
  }
  return { to: '/qa', icon: 'i-lucide-arrow-right' }
})

/** 默认封面图案：深蓝底 + 低透明度几何线 + 分类图标水印（非随机 AI 图）。 */
const categoryIcon = computed(() => {
  const map: Record<string, string> = {
    AI: 'i-lucide-bot',
    PROGRAMMING: 'i-lucide-code-2',
    INNOVATION: 'i-lucide-lightbulb',
    MATHEMATICAL_MODELING: 'i-lucide-sigma',
    ELECTRONICS: 'i-lucide-circuit-board',
    ROBOTICS: 'i-lucide-bot',
    OTHER: 'i-lucide-award'
  }
  return map[props.detail.category] ?? 'i-lucide-award'
})
</script>

<template>
  <header>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
      <!-- 品牌横幅 -->
      <div
        class="relative flex aspect-[16/9] items-end overflow-hidden rounded-surface border border-default bg-primary-900 lg:aspect-auto lg:min-h-[15rem]"
      >
        <ProgressiveImage
          v-if="detail.cover.src"
          :src="detail.cover.src"
          :alt="detail.cover.alt"
          :preview="true"
          aspect="aspect-auto"
          rounded="rounded-none"
          :object-position="detail.cover.position ?? 'center'"
          class="absolute inset-0"
        />
        <div
          v-else
          class="absolute inset-0"
          aria-hidden="true"
        >
          <div
            class="absolute inset-0 opacity-[0.12]"
            style="background-image: repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)"
          />
          <UIcon
            :name="categoryIcon"
            class="absolute bottom-2 right-2 size-20 text-white/15"
            aria-hidden="true"
          />
        </div>

        <span
          class="absolute left-3 top-3 inline-flex min-h-7 items-center rounded-md bg-neutral-950/55 px-2.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          {{ competitionLevelLabel[detail.level] }}
        </span>

        <h2 class="relative line-clamp-2 w-full p-4 text-lg font-bold leading-snug text-white sm:text-xl">
          {{ detail.name }}
        </h2>
      </div>

      <!-- 信息栏 -->
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ participationModeLabel[detail.participationMode] }}
          </UBadge>
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ competitionLevelLabel[detail.level] }}
          </UBadge>
        </div>

        <!-- 手机端：标题由顶部居中返回头承载（§16.5），此处大标题仅桌面/平板展示，
             避免与顶部标题重复形成「桌面标题条」观感；名字已由品牌横幅 h2 呈现。 -->
        <h1 class="mt-3 hidden text-2xl font-bold leading-tight text-highlighted sm:text-3xl md:block">
          {{ detail.name }}
        </h1>

        <p class="mt-1 hidden text-sm text-muted md:block">
          {{ detail.edition }} 年度赛事
        </p>

        <p
          v-if="detail.registrationEndAt"
          class="mt-3 text-sm text-highlighted"
        >
          <span
            class="mr-2 font-medium"
            :class="state === 'OPEN' ? 'text-success-600 dark:text-success-400' : ''"
          >
            {{ registrationStateLabel[state] }}
          </span>
          报名截止：<span class="tabular-nums text-muted">{{ deadlineText }}</span>
        </p>

        <p
          v-if="detail.brief"
          class="mt-3 max-w-2xl text-sm leading-7 text-toned"
        >
          {{ detail.brief }}
        </p>

        <div class="mt-5 hidden flex-wrap items-center gap-3 md:flex">
          <UButton
            :to="registerAction.to"
            :href="registerAction.href"
            :target="registerAction.href ? '_blank' : undefined"
            :rel="registerAction.href ? 'noopener noreferrer' : undefined"
            color="primary"
            variant="solid"
            size="md"
            :icon="registerAction.icon"
          >
            立即报名
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-star"
            :loading="followLoading"
            @click="toggleFollow"
          >
            {{ followed ? '已关注' : '关注赛事' }}
          </UButton>
        </div>
      </div>
    </div>
  </header>
</template>
