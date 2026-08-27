<script setup lang="ts">
import { computed } from 'vue'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { useAuthStore } from '@/stores/auth'

/** 个人中心概览（FE-070）— /me。
 *  展示个人资料摘要 + 账号功能入口；组织身份不在此处（见 FE-040）。
 *  按 identity_type 分区（PageMap §个人中心）：TEACHER 隐藏 学生专属入口。
 */
const auth = useAuthStore()
const isTeacher = computed(() => auth.user?.identity_type === 'TEACHER')
const profile = computed(() => {
  const user = auth.user
  if (!user) return { nickname: '', publicName: '', major: '', grade: '', bio: '', department: '', academicTitle: '', displayName: '' }
  const p = user.profile as unknown as Record<string, unknown>
  return {
    nickname: (p.nickname as string) ?? '',
    publicName: (p.public_name as string) ?? '',
    major: (p.major as string) ?? '',
    grade: p.grade != null ? String(p.grade) : '',
    bio: (p.bio as string) ?? '',
    department: (p.department as string) ?? '',
    academicTitle: (p.academic_title as string) ?? '',
    displayName: (p.public_name as string) || (p.nickname as string) || user.real_name,
  }
})

const sections = computed(() => {
  const base = [
    { name: 'me-profile', label: '个人资料', icon: 'i-lucide-user-round', description: '查看与编辑个人信息' },
    { name: 'me-follows', label: '我的关注', icon: 'i-lucide-heart', description: '关注的竞赛' },
    { name: 'me-teams', label: '我的组队', icon: 'i-lucide-users', description: '我发布的 / 我加入的组队' },
    { name: 'me-applications', label: '我的申请', icon: 'i-lucide-file-text', description: '组队与组织申请' },
    { name: 'me-activities', label: '我的活动', icon: 'i-lucide-calendar-check', description: '我报名的活动' },
    { name: 'me-questions', label: '我的咨询', icon: 'i-lucide-message-square', description: '我的提问与公开问答' },
    { name: 'me-settings', label: '账号设置', icon: 'i-lucide-settings', description: '外观模式与账号偏好' },
  ]
  if (isTeacher.value) {
    return base.filter(s => !['me-teams', 'me-applications', 'me-activities'].includes(s.name))
  }
  return base
})

function initial(name: string) {
  return (name || '—').slice(0, 1)
}
</script>

<template>
  <section class="py-6 sm:py-8">
    <PageContainer class="max-w-4xl">
      <div class="hidden md:block">
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          个人中心
        </h1>
      </div>

      <div class="mt-0 flex items-center gap-4 rounded-card border border-default bg-default p-5 md:mt-6">
        <span
          class="grid size-16 shrink-0 place-items-center rounded-full bg-primary-50 text-xl font-semibold text-primary-600 dark:bg-primary-950 dark:text-primary-400"
          aria-hidden="true"
        >
          {{ initial(profile.displayName) }}
        </span>
        <div class="min-w-0">
          <p class="text-lg font-semibold text-highlighted">
            {{ profile.displayName }} <span v-if="isTeacher" class="ml-1 text-xs font-normal text-muted">教师</span>
          </p>
          <p class="mt-0.5 text-sm text-muted">
            <template v-if="isTeacher">{{ profile.department }}<span v-if="profile.academicTitle"> · {{ profile.academicTitle }}</span></template>
            <template v-else>{{ profile.major }}<span v-if="profile.grade"> · {{ profile.grade }}</span></template>
          </p>
          <p
            v-if="profile.bio"
            class="mt-1 line-clamp-1 text-sm text-toned"
          >
            {{ profile.bio }}
          </p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="section in sections"
          :key="section.name"
          :to="{ name: section.name }"
          class="group flex items-start gap-3 rounded-card border border-default bg-default p-4"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-surface bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
            aria-hidden="true"
          >
            <UIcon
              :name="section.icon"
              class="size-5"
            />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-highlighted transition-colors group-hover:text-primary-600">
              {{ section.label }}
            </span>
            <span class="mt-0.5 block text-xs text-muted">
              {{ section.description }}
            </span>
          </span>
        </RouterLink>
      </div>
    </PageContainer>
  </section>
</template>
