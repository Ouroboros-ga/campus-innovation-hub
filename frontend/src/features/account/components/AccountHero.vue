<script setup lang="ts">
import type { AccountProfile } from '../types'

const props = withDefaults(
  defineProps<{
    profile: AccountProfile
    displayName: string
    collegeLabel: string
    gradeLabel: string
    bio: string
    skills: string[]
    stats: { follows: number; teams: number; teamsActive: number; orgs: number; orgLabel: string }
    isTeacher?: boolean
  }>(),
  { isTeacher: false }
)

function initial(name: string) {
  return (name || '—').slice(0, 1)
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-card border border-default bg-default"
  >
    <!-- 浅色装饰：右上校舍线稿（与原型一致，仅装饰，aria-hidden） -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] opacity-[0.08] md:block dark:opacity-[0.12]"
    >
      <div class="absolute inset-0 bg-gradient-to-l from-primary-100 to-transparent dark:from-primary-900/30" />
      <!-- 用纯 CSS 几何模拟建筑轮廓，不引入图片资源 -->
      <div class="absolute bottom-0 right-6 flex items-end gap-2">
        <div class="h-16 w-12 rounded-t-sm bg-primary-200 dark:bg-primary-800" />
        <div class="h-20 w-14 rounded-t-sm bg-primary-200 dark:bg-primary-800" />
        <div class="h-12 w-10 rounded-t-sm bg-primary-200 dark:bg-primary-800" />
      </div>
      <div
        class="absolute bottom-6 right-10 h-4 w-4 rounded-full bg-primary-200 dark:bg-primary-700/50"
        style="clip-path: circle(50%)"
      />
    </div>

    <!-- 移动端 Phone：纵向卡片；桌面：横向 -->
    <div class="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:gap-8">
      <!-- 左侧身份区 -->
      <div class="flex gap-4">
        <div class="relative shrink-0">
          <span
            class="grid size-16 place-items-center rounded-full bg-primary-50 text-2xl font-semibold text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950 dark:text-primary-400 dark:ring-primary-900 sm:size-20 sm:text-3xl"
            aria-hidden="true"
          >
            {{ initial(props.displayName) }}
          </span>
          <span
            class="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-default bg-default shadow-sm"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-camera"
              class="size-3.5 text-muted"
            />
          </span>
        </div>
        <div class="min-w-0 flex-1 md:min-w-[22rem]">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-bold text-highlighted sm:text-xl">
              {{ props.displayName }}
            </h2>
            <UBadge
              v-if="!isTeacher"
              color="primary"
              variant="soft"
              size="sm"
              class="font-normal"
            >
              人工智能学院
            </UBadge>
            <span
              v-else
              class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300"
            >教师</span>
          </div>
          <p class="mt-1 text-sm text-muted">
            {{ props.collegeLabel }}<span v-if="props.gradeLabel"> · {{ props.gradeLabel }}</span>
            <template v-if="isTeacher">
              · {{ props.profile.department ?? '' }}
            </template>
          </p>
          <p
            v-if="props.bio"
            class="mt-1.5 line-clamp-2 text-sm leading-6 text-toned"
          >
            {{ props.bio }}
          </p>
          <div
            v-if="!isTeacher && props.skills.length"
            class="mt-2.5 flex flex-wrap gap-1.5"
          >
            <span
              v-for="tag in props.skills.slice(0, 3)"
              :key="tag"
              class="inline-flex items-center gap-1 rounded-full border border-default bg-muted px-2.5 py-1 text-xs text-muted"
            >
              <UIcon
                :name="tag === '算法爱好者' ? 'i-lucide-code-2' : tag === '团队协作' ? 'i-lucide-users' : 'i-lucide-trophy'"
                class="size-3"
                aria-hidden="true"
              />
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧统计区：移动端下置 3 等分，桌面端右对齐 -->
      <div class="grid grid-cols-3 divide-x divide-default border-t border-default pt-4 md:ml-auto md:flex md:items-stretch md:divide-x md:border-t-0 md:pt-0">
        <div class="flex flex-col items-center px-2 py-1 text-center md:min-w-[7rem] md:px-6">
          <span class="inline-flex items-center gap-1.5 text-xs text-muted">
            <UIcon
              name="i-lucide-heart"
              class="size-4 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
            关注竞赛
          </span>
          <span class="mt-1 text-xl font-bold text-highlighted">{{ props.stats.follows }}</span>
          <span class="mt-0.5 text-xs text-muted">持续关注中</span>
        </div>
        <div class="flex flex-col items-center px-2 py-1 text-center md:min-w-[7rem] md:px-6">
          <span class="inline-flex items-center gap-1.5 text-xs text-muted">
            <UIcon
              name="i-lucide-users"
              class="size-4 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
            参与组队
          </span>
          <span class="mt-1 text-xl font-bold text-highlighted">{{ props.stats.teams }}</span>
          <span class="mt-0.5 text-xs text-muted">进行中 {{ props.stats.teamsActive }} 个</span>
        </div>
        <div class="flex flex-col items-center px-2 py-1 text-center md:min-w-[7rem] md:px-6">
          <span class="inline-flex items-center gap-1.5 text-xs text-muted">
            <UIcon
              name="i-lucide-briefcase"
              class="size-4 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
            组织身份
          </span>
          <span class="mt-1 text-xl font-bold text-highlighted">{{ props.stats.orgs }}</span>
          <span class="mt-0.5 text-xs text-muted">{{ props.stats.orgLabel }}</span>
        </div>
      </div>

      <!-- 移动端编辑入口（PC 由页标题区的「编辑个人资料」承担） -->
      <div class="absolute right-4 top-4 md:hidden">
        <UButton
          to="/me/profile"
          size="sm"
          color="primary"
          variant="outline"
          icon="i-lucide-pencil"
          class="rounded-full"
        >
          编辑资料
        </UButton>
      </div>
    </div>
  </div>
</template>
