<script setup lang="ts">
import { computed } from 'vue'

import AccountHero from '@/features/account/components/AccountHero.vue'
import AccountMenuList from '@/features/account/components/AccountMenuList.vue'
import AccountOverviewSection from '@/features/account/components/AccountOverviewSection.vue'
import AccountRecentTimeline from '@/features/account/components/AccountRecentTimeline.vue'
import AccountSettingsRow from '@/features/account/components/AccountSettingsRow.vue'
import { applications, follows, teamPosts, activities } from '@/features/account/lib/account'
import { accountProfile, accountTimeline } from '@/mocks/fixtures/account'
import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate, formatDateTimeCompact } from '@/shared/lib/date'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isTeacher = computed(() => auth.user?.identity_type === 'TEACHER')

const display = computed(() => {
  const user = auth.user
  if (user) {
    const p = user.profile as unknown as Record<string, unknown>
    const nickname = (p.nickname as string) ?? ''
    const publicName = (p.public_name as string) ?? ''
    const bio = (p.bio as string) ?? ''
    const grade = p.grade != null ? String(p.grade) : ''
    const department = (p.department as string) ?? ''
    const academicTitle = (p.academic_title as string) ?? ''
    const displayName = (publicName || nickname || user.real_name) as string
    return {
      displayName,
      collegeLabel: isTeacher.value ? department || '人工智能学院' : '人工智能学院',
      gradeLabel: isTeacher.value ? academicTitle || '' : grade || '',
      bio: bio || '',
      skills: (p.skills as string[] | undefined) ?? [],
      department,
      academicTitle,
    }
  }
  return {
    displayName: '',
    collegeLabel: '人工智能学院',
    gradeLabel: '',
    bio: '',
    skills: [] as string[],
    department: '',
    academicTitle: '',
  }
})

const stats = computed(() => {
  // 真实数据派生；新注册学生不展示全局 fixture 的虚假 KPI，置 0
  const followsCount = isFakePreviewEnabled.value ? follows.length : 0
  const teamsCount = isFakePreviewEnabled.value ? teamPosts.length : 0
  const teamsActive = isFakePreviewEnabled.value ? teamPosts.filter(item => item.status === 'RECRUITING').length : 0
  const orgsCount = 0
  const orgLabel = isTeacher.value ? '指导老师' : '学生组织成员'
  return { follows: followsCount, teams: teamsCount, teamsActive, orgs: orgsCount, orgLabel }
})

const menuItems = computed(() => {
  const base = [
    { to: '/me/profile', label: '个人资料', description: '查看与编辑个人信息', icon: 'i-lucide-user-round' },
    { to: '/me/follows', label: '我的关注', description: '关注的竞赛', icon: 'i-lucide-heart' },
    { to: '/me/teams', label: '我的组队', description: '我发布的 / 我加入的组队', icon: 'i-lucide-users' },
    { to: '/me/applications', label: '我的申请', description: '组队与组织申请', icon: 'i-lucide-file-text' },
    { to: '/me/activities', label: '我的活动', description: '我报名的活动', icon: 'i-lucide-calendar-check' },
    { to: '/me/questions', label: '我的咨询', description: '我的提问与公开问答', icon: 'i-lucide-message-square' },
    { to: '/me/settings', label: '账号设置', description: '安全、通知与隐私设置', icon: 'i-lucide-shield' },
  ]
  if (isTeacher.value) {
    return base.filter(i => !['/me/teams', '/me/applications', '/me/activities'].includes(i.to))
  }
  return base
})

const settingsRowItems = [
  { to: '/me/profile', label: '个人资料', description: '完善个人信息', icon: 'i-lucide-user-round' },
  { to: '/me/settings', label: '账号与安全', description: '密码修改、登录保护', icon: 'i-lucide-lock' },
  { to: '/me/settings', label: '通知设置', description: '消息通知与提醒', icon: 'i-lucide-bell' },
  { to: '/me/settings', label: '隐私设置', description: '隐私与可见范围', icon: 'i-lucide-shield-check' },
  { to: '/me/settings', label: '绑定设置', description: '第三方账号绑定', icon: 'i-lucide-link-2' },
] as const

// 预览数据：真实接口未接入前，新注册学生账号不展示全局 fixture 的虚假列表，空态为主
const isFakePreviewEnabled = computed(() => auth.isSuperadmin || auth.isOperator)
const appPreview = computed(() => (isFakePreviewEnabled.value ? applications.slice(0, 3) : []))
const followPreview = computed(() => (isFakePreviewEnabled.value ? follows.slice(0, 3) : []))
const teamPreview = computed(() => (isFakePreviewEnabled.value ? teamPosts.slice(0, 2) : []))
const activityPreview = computed(() => (isFakePreviewEnabled.value ? activities.slice(0, 3) : []))
const timelinePreview = computed(() => (isFakePreviewEnabled.value ? accountTimeline.slice(0, 4) : []))

const heroProfile = computed(() => ({
  ...accountProfile,
  nickname: display.value.displayName,
  bio: display.value.bio,
  skills: display.value.skills,
  grade: display.value.gradeLabel || null,
}))

function appStateLabel(state: string) {
  if (state === 'PENDING') return '审核中'
  if (state === 'ACCEPTED') return '已通过'
  if (state === 'REJECTED') return '未通过'
  if (state === 'WITHDRAWN') return '已撤回'
  return state
}
function appStateColor(state: string): 'primary' | 'success' | 'error' | 'neutral' {
  if (state === 'PENDING') return 'primary'
  if (state === 'ACCEPTED') return 'success'
  if (state === 'REJECTED') return 'error'
  return 'neutral'
}
function teamBadgeLabel(team: { id: string; status: string }) {
  if (team.status === 'RECRUITING') return team.id === 'team-ai-explorer' ? '进行中' : '招募中'
  if (team.status === 'FULL') return '已满'
  return '已关闭'
}
</script>

<template>
  <section class="bg-canvas py-4 sm:py-6">
    <PageContainer class="max-w-[90rem]">
      <div
        v-if="auth.status === 'loading' || auth.status === 'idle'"
        class="py-20 text-center text-sm text-muted"
      >
        正在加载…
      </div>
      <div
        v-else-if="auth.status === 'error'"
        class="py-20 text-center"
      >
        <UIcon
          name="i-lucide-wifi-off"
          class="mx-auto size-10 text-muted"
          aria-hidden="true"
        />
        <p class="mt-3 text-sm text-muted">
          {{ auth.lastError ?? '无法连接服务器，请检查网络后重试' }}
        </p>
        <UButton
          class="mt-4"
          color="primary"
          variant="soft"
          @click="auth.init()"
        >
          重试
        </UButton>
      </div>
      <div
        v-else-if="!auth.isAuthenticated"
        class="py-20 text-center"
      >
        <UIcon
          name="i-lucide-user-x"
          class="mx-auto size-10 text-muted"
          aria-hidden="true"
        />
        <p class="mt-3 text-sm font-medium text-highlighted">
          未登录
        </p>
        <p class="mt-1 text-xs text-muted">
          登录后查看个人中心
        </p>
        <UButton
          class="mt-4"
          color="primary"
          to="/login?redirect=/me"
        >
          去登录
        </UButton>
      </div>
      <template v-else>
        <!-- PC 标题行（Phone 由 AppHeader 承载个人中心标题，此处隐藏避免重复） -->
        <div class="hidden items-center justify-between md:flex">
          <h1 class="flex items-baseline gap-3 text-2xl font-bold text-highlighted">
            个人中心
            <span class="text-sm font-normal text-muted">下午好，{{ display.displayName }}！</span>
          </h1>
          <UButton
            to="/me/profile"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            size="sm"
            class="hidden md:inline-flex"
          >
            编辑个人资料
          </UButton>
        </div>

        <!-- Hero -->
        <div class="mt-0 md:mt-4">
          <AccountHero
            :profile="heroProfile"
            :display-name="display.displayName"
            :college-label="display.collegeLabel"
            :grade-label="display.gradeLabel"
            :bio="display.bio"
            :skills="display.skills"
            :stats="stats"
            :is-teacher="isTeacher"
          />
        </div>

        <!-- ========== Desktop/Tablet 预览区（md+ 可见，Phone 隐藏） ========== -->
        <div class="mt-4 hidden gap-4 md:grid md:grid-cols-12">
          <!-- 我的申请：跨 4 列，更高 -->
          <AccountOverviewSection
            title="我的申请"
            icon="i-lucide-file-text"
            to="/me/applications"
            action-label="查看全部申请"
            class="md:col-span-6 lg:col-span-4"
          >
            <ul
              v-if="appPreview.length"
              class="space-y-3"
            >
              <li
                v-for="item in appPreview"
                :key="item.id"
                class="rounded-surface border border-default bg-default p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="line-clamp-1 text-sm font-medium text-highlighted">
                    {{ item.targetName }}
                  </p>
                  <UBadge
                    :color="appStateColor(item.state)"
                    variant="soft"
                    size="sm"
                  >
                    {{ appStateLabel(item.state) }}
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-muted">
                  <template v-if="item.positionName">
                    团队名称：{{ item.positionName }}
                  </template>
                  <template v-else>
                    提交时间：{{ formatCompactDate(item.submittedAt) }}
                  </template>
                  <span
                    v-if="item.positionName"
                    class="ml-2"
                  >提交时间：{{ formatDateTimeCompact(item.submittedAt) }}</span>
                </p>
              </li>
            </ul>
            <p
              v-else
              class="py-6 text-center text-sm text-muted"
            >
              暂无申请记录
            </p>
            <template #footer>
              <RouterLink
                to="/me/applications"
                class="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                查看全部申请记录
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </RouterLink>
            </template>
          </AccountOverviewSection>

          <!-- 中间列：关注 + 活动 叠放 -->
          <div class="flex flex-col gap-4 md:col-span-6 lg:col-span-4">
            <AccountOverviewSection
              title="我关注的竞赛"
              icon="i-lucide-heart"
              to="/me/follows"
            >
              <ul
                v-if="followPreview.length"
                class="space-y-2.5"
              >
                <li
                  v-for="item in followPreview"
                  :key="item.id"
                  class="flex items-start justify-between gap-3 text-sm"
                >
                  <span class="flex min-w-0 items-start gap-1.5">
                    <span
                      class="mt-2 size-1 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400"
                      aria-hidden="true"
                    />
                    <RouterLink
                      :to="item.detailPath"
                      class="line-clamp-1 text-toned hover:text-primary-600"
                    >
                      {{ item.name }}
                    </RouterLink>
                  </span>
                  <span class="shrink-0 text-xs text-muted">{{ formatCompactDate(item.deadlineAt) }}</span>
                </li>
              </ul>
              <template #footer>
                <RouterLink
                  to="/me/follows"
                  class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400"
                >
                  更多竞赛动态
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                </RouterLink>
              </template>
            </AccountOverviewSection>

            <AccountOverviewSection
              title="我的活动"
              icon="i-lucide-calendar-check"
              to="/me/activities"
            >
              <ul
                v-if="activityPreview.length"
                class="space-y-2.5"
              >
                <li
                  v-for="item in activityPreview"
                  :key="item.id"
                  class="flex items-start justify-between gap-3"
                >
                  <RouterLink
                    :to="item.detailPath"
                    class="line-clamp-1 text-sm text-toned hover:text-primary-600"
                  >
                    {{ item.title }}
                  </RouterLink>
                  <span class="shrink-0 text-xs text-muted">{{ formatDateTimeCompact(item.startAt) }}</span>
                </li>
              </ul>
              <template #footer>
                <RouterLink
                  to="/me/activities"
                  class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400"
                >
                  更多活动
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                </RouterLink>
              </template>
            </AccountOverviewSection>
          </div>

          <!-- 我的团队 -->
          <AccountOverviewSection
            title="我的团队"
            icon="i-lucide-users"
            to="/me/teams"
            class="md:col-span-6 lg:col-span-2"
          >
            <ul
              v-if="teamPreview.length"
              class="space-y-3"
            >
              <li
                v-for="team in teamPreview"
                :key="team.id"
                class="rounded-surface border border-default p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-medium text-highlighted">{{ team.title }}</span>
                  <UBadge
                    :color="teamBadgeLabel(team) === '进行中' ? 'success' : 'primary'"
                    variant="soft"
                    size="sm"
                  >
                    {{ teamBadgeLabel(team) }}
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-muted">
                  成员 {{ team.memberCount }} 人 · {{ team.competitionName.includes('智汇') ? '算法/深度学习' : '学习交流' }}
                </p>
                <p
                  v-if="team.id === 'team-ai-explorer'"
                  class="mt-0.5 text-xs text-muted"
                >
                  队长
                </p>
              </li>
            </ul>
            <template #footer>
              <RouterLink
                to="/me/teams"
                class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400"
              >
                浏览更多团队
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </RouterLink>
            </template>
          </AccountOverviewSection>

          <!-- 最近动态：桌面端右侧 -->
          <AccountOverviewSection
            title="最近动态"
            icon="i-lucide-activity"
            to="/notifications"
            class="md:col-span-6 lg:col-span-2"
          >
            <AccountRecentTimeline :items="timelinePreview" />
            <template #footer>
              <RouterLink
                to="/notifications"
                class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400"
              >
                查看全部动态
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </RouterLink>
            </template>
          </AccountOverviewSection>
        </div>

        <!-- ========== Phone 清单（Phone 专用，md 隐藏） ========== -->
        <div class="mt-3 space-y-3 md:hidden">
          <AccountMenuList :items="menuItems" />
          <AccountOverviewSection
            title="最近动态"
            icon="i-lucide-activity"
            to="/notifications"
          >
            <AccountRecentTimeline :items="timelinePreview.slice(0,3)" />
            <template #footer>
              <RouterLink
                to="/notifications"
                class="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-600"
              >
                查看全部
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </RouterLink>
            </template>
          </AccountOverviewSection>
        </div>

        <!-- ========== 底部账户设置行（仅桌面） ========== -->
        <div class="mt-4 hidden md:block">
          <AccountSettingsRow :items="settingsRowItems" />
        </div>
      </template>
    </PageContainer>
  </section>
</template>
