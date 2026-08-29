<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { useRequireAuth } from '@/shared/composables/useRequireAuth'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate } from '@/shared/lib/date'

import TeamApplicationModal from '@/features/teams/components/TeamApplicationModal.vue'
import TeamDetailSection from '@/features/teams/components/TeamDetailSection.vue'
import {
  getTeam,
  type TeamDetailResult
} from '@/features/teams/api/teamApi'
import { teamApplicationStateLabel } from '@/features/teams/lib/teamApplication'
import {
  teamPostTypeMeta,
  teamStatusMeta
} from '@/features/teams/lib/teamLabels'
import type {
  MyTeamApplication,
  TeamApplicationDraft
} from '@/features/teams/types'

/**
 * 组队详情（FE-031 / FE-102 API 驱动）— /teams/:id
 *
 * 展示：标题、关联竞赛、状态、项目/方向、队伍人数、已有成员情况、正在招募、
 * 技能要求、预计投入、发布者公开资料、发布时间；主操作「申请加入」（§16.3）。
 * 本人发布者提供「编辑 / 查看申请 / 关闭招募」操作；申请为短表单 Modal（§27）。
 */
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { requireAuth } = useRequireAuth()

const id = computed(() => String(route.params.id ?? ''))

const detail = ref<TeamDetailResult | null>(null)
const loading = ref(true)
const error = ref(false)

/** 本人可关闭招募：本地演示状态（作者鉴权未接线）。 */
const closedByOwner = ref(false)

async function load() {
  loading.value = true
  error.value = false
  detail.value = null
  try {
    detail.value = await getTeam(id.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

const status = computed(
  () => (closedByOwner.value ? 'CLOSED' : (detail.value?.status ?? 'CLOSED'))
)
const canApply = computed(() => status.value === 'RECRUITING')

const typeMeta = computed(() =>
  detail.value ? teamPostTypeMeta[detail.value.postType] : null
)
const statusMeta = computed(() => teamStatusMeta[status.value])
const publishedText = computed(() =>
  detail.value ? formatCompactDate(detail.value.publishedAt) : ''
)

const modalOpen = ref(false)
const activeApplication = ref<MyTeamApplication | undefined>(undefined)

function openApply() {
  if (!requireAuth()) return
  modalOpen.value = true
}

async function handleSubmit(draft: TeamApplicationDraft) {
  if (!requireAuth()) return
  // 申请为 LOGIN 写操作；认证冻结前保持本地提交（与 FE-101 follow 相同惯例）。
  activeApplication.value = {
    teamId: id.value,
    selfIntro: draft.selfIntro,
    skills: draft.skills,
    experience: draft.experience,
    motivation: draft.motivation,
    weeklyCommitment: draft.weeklyCommitment,
    contact: draft.contact,
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  }
  modalOpen.value = false
  toast.add({
    title: '申请已提交',
    description: '已提交申请，可在「我的」中查看处理进度。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}

function closeRecruitment() {
  closedByOwner.value = true
  toast.add({
    title: '已关闭招募',
    description: '该队伍已停止招募。',
    color: 'neutral',
    icon: 'i-lucide-lock'
  })
}

function onEdit() {
  void router.push('/teams/create')
}

function statusColor(s: 'RECRUITING' | 'FULL' | 'CLOSED') {
  if (s === 'RECRUITING') return 'success'
  if (s === 'FULL') return 'warning'
  return 'neutral'
}
</script>

<template>
  <section
    class="py-10 sm:py-14"
    :class="{ 'pb-28 md:pb-14': detail && canApply && !activeApplication }"
  >
    <PageContainer class="max-w-3xl">
      <!-- 加载态 -->
      <div
        v-if="loading"
        class="space-y-5"
        aria-busy="true"
      >
        <div class="flex items-center gap-2">
          <USkeleton class="h-5 w-20" />
          <USkeleton class="h-5 w-16" />
        </div>
        <USkeleton class="h-8 w-3/4" />
        <USkeleton class="h-4 w-1/2" />
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-16"
          />
        </div>
        <USkeleton class="h-40" />
      </div>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该组队信息，或加载失败。
        </p>
        <RouterLink
          to="/teams"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回组队广场
        </RouterLink>
      </div>

      <template v-else-if="detail">
        <RouterLink
          to="/teams"
          class="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary-600"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
            aria-hidden="true"
          />
          返回组队广场
        </RouterLink>

        <div class="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              v-if="typeMeta"
              size="sm"
              variant="soft"
              :color="typeMeta.color"
            >
              {{ typeMeta.label }}
            </UBadge>
            <UBadge
              size="sm"
              variant="soft"
              :color="statusColor(status)"
            >
              {{ statusMeta.label }}
            </UBadge>
            <UBadge
              v-if="detail.isOwned"
              size="sm"
              variant="soft"
              color="success"
              icon="i-lucide-clock"
            >
              我发布的
            </UBadge>
          </div>
        </div>

        <h1 class="mt-3 text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
          {{ detail.title }}
        </h1>

        <p class="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <UIcon
            name="i-lucide-trophy"
            class="size-4 shrink-0 text-primary-600 dark:text-primary-400"
            aria-hidden="true"
          />
          {{ detail.competitionName }}
          <span class="mx-1 text-border">·</span>
          发布于 {{ publishedText }}
        </p>

        <!-- 详情信息 -->
        <dl class="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted">
              项目 / 方向
            </dt>
            <dd class="mt-1 text-sm text-highlighted">
              {{ detail.direction }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted">
              队伍人数
            </dt>
            <dd class="mt-1 text-sm text-highlighted">
              {{ detail.baseMemberCount }} / {{ detail.targetMemberCount }} 人
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted">
              预计投入
            </dt>
            <dd class="mt-1 text-sm text-highlighted">
              {{ detail.expectedEffort }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted">
              信息类型
            </dt>
            <dd class="mt-1 text-sm text-highlighted">
              {{ detail.postType === 'TEAM_RECRUITING' ? '队伍找人' : '个人找队' }}
            </dd>
          </div>
        </dl>

        <!-- 已提交申请状态提示 -->
        <div
          v-if="activeApplication"
          class="mt-5 flex items-center gap-2 rounded-surface border border-default bg-default p-3 text-sm"
        >
          <UIcon
            name="i-lucide-file-check"
            class="size-4 shrink-0 text-success-600 dark:text-success-400"
            aria-hidden="true"
          />
          <p class="text-toned">
            已提交申请，当前状态
            <span class="font-medium text-highlighted">
              {{ teamApplicationStateLabel[activeApplication.status] }}
            </span>。
          </p>
        </div>

        <!-- 不可申请提示 -->
        <div
          v-else-if="!canApply"
          class="mt-5 rounded-surface border border-default bg-default p-3 text-sm text-toned"
        >
          <template v-if="status === 'FULL'">
            该队伍已满员，暂不可申请。
          </template>
          <template v-else>
            该队伍已关闭招募。
          </template>
        </div>

        <!-- 主操作 -->
        <div class="mt-6 flex flex-wrap items-center gap-2">
          <template v-if="detail.isOwned">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-pencil"
              @click="onEdit"
            >
              编辑
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-users"
              to="/me"
            >
              查看申请
            </UButton>
            <UButton
              v-if="status === 'RECRUITING'"
              color="neutral"
              variant="ghost"
              icon="i-lucide-lock"
              @click="closeRecruitment"
            >
              关闭招募
            </UButton>
            <UButton
              v-else
              color="neutral"
              variant="soft"
              icon="i-lucide-lock"
              disabled
            >
              已关闭
            </UButton>
          </template>

          <template v-else>
            <UButton
              v-if="canApply && !activeApplication"
              color="primary"
              variant="solid"
              icon="i-lucide-user-plus"
              @click="openApply"
            >
              申请加入
            </UButton>
            <UButton
              v-if="canApply && activeApplication"
              color="neutral"
              variant="soft"
              icon="i-lucide-check"
            >
              已申请
            </UButton>
          </template>
        </div>

        <div class="mt-8 space-y-8">
          <TeamDetailSection title="队伍目标">
            <p class="whitespace-pre-line text-sm leading-7 text-toned">
              {{ detail.intro }}
            </p>
          </TeamDetailSection>

          <TeamDetailSection title="已有成员情况">
            <p class="text-sm leading-7 text-toned">
              {{ detail.currentMembers }}
            </p>
          </TeamDetailSection>

          <TeamDetailSection title="正在招募">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="role in detail.roles"
                :key="role"
                size="sm"
                variant="soft"
                color="neutral"
              >
                {{ role }}
              </UBadge>
            </div>
          </TeamDetailSection>

          <TeamDetailSection title="技能要求">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="skill in detail.skills"
                :key="skill"
                size="sm"
                variant="soft"
                color="primary"
              >
                {{ skill }}
              </UBadge>
            </div>
          </TeamDetailSection>

          <TeamDetailSection title="发布者公开资料">
            <div class="flex items-center gap-3">
              <span
                class="grid size-12 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                aria-hidden="true"
              >
                <UIcon
                  name="i-lucide-user"
                  class="size-6"
                />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-highlighted">
                  {{ detail.creatorName }}
                </p>
                <p class="text-xs text-muted">
                  {{ detail.creatorGrade }} | {{ detail.creatorMajor }}
                </p>
                <p
                  v-if="detail.creatorBio"
                  class="mt-1 text-xs leading-5 text-toned"
                >
                  {{ detail.creatorBio }}
                </p>
              </div>
            </div>
          </TeamDetailSection>
        </div>
      </template>
    </PageContainer>

    <!-- Phone Sticky 申请操作条（仅「招募中」、非本人发布且未申请时） -->
    <div
      v-if="detail && !detail.isOwned && canApply && !activeApplication"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <p class="min-w-0 flex-1 text-sm text-muted">
          招募中
        </p>
        <UButton
          color="primary"
          variant="solid"
          class="shrink-0"
          @click="openApply"
        >
          申请加入
        </UButton>
      </div>
    </div>

    <TeamApplicationModal
      v-if="detail"
      :open="modalOpen"
      :team-id="id"
      @update:open="modalOpen = $event"
      @submit="handleSubmit"
    />
  </section>
</template>
