<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import {
  formatCompactDate,
  getDeadlineInfo
} from '@/shared/lib/date'
import {
  organizationTypeLabel
} from '@/shared/lib/domain-labels'

import OrganizationDetailSection from '@/features/organizations/components/OrganizationDetailSection.vue'
import RecruitmentApplicationModal from '@/features/organizations/components/RecruitmentApplicationModal.vue'
import RecruitmentPositionCard from '@/features/organizations/components/RecruitmentPositionCard.vue'
import {
  getMyActiveApplication,
  submitRecruitmentApplication
} from '@/features/organizations/lib/organizationApplication'
import {
  deriveRecruitmentPhase,
  findRecruitmentDetail,
  recruitmentCanApply
} from '@/features/organizations/lib/organizationDetail'
import {
  recruitmentApplicationStateLabel,
  recruitmentPhaseLabel
} from '@/features/organizations/lib/organizationLabels'
import type {
  MyRecruitmentApplication,
  RecruitmentApplicationDraft
} from '@/features/organizations/types'

/**
 * 招新详情（FE-042）— /organizations/:id/recruitments/:recruitmentId
 *
 * 展示：组织名、招新标题、状态、截止时间、招新介绍、面向年级、其他说明、岗位列表。
 * 主操作「申请加入」（§14 / §16.3），申请为短表单 Modal（§27）。
 * 设计来源：PageMap §招新详情 / §招新申请；database-design.md §11。
 * Phone 使用 Detail Shell + Sticky 操作条（仅「招新中」阶段）。
 */
const route = useRoute()
const toast = useToast()

const organizationId = computed(() => String(route.params.id ?? ''))
const recruitmentId = computed(() =>
  String(route.params.recruitmentId ?? '')
)
const detail = computed(() =>
  findRecruitmentDetail(organizationId.value, recruitmentId.value)
)
const now = computed(() => new Date())
const phase = computed(() =>
  detail.value ? deriveRecruitmentPhase(detail.value, now.value) : null
)
const canApply = computed(() =>
  phase.value ? recruitmentCanApply(phase.value) : false
)

const modalOpen = ref(false)
const defaultPositionId = ref<string | undefined>(undefined)
const activeApplication = ref<MyRecruitmentApplication | undefined>(undefined)

onMounted(() => {
  activeApplication.value = getMyActiveApplication(recruitmentId.value)
})

const deadlineText = computed(() =>
  detail.value ? formatCompactDate(detail.value.applyEndAt) : ''
)
const deadlineInfo = computed(() =>
  detail.value ? getDeadlineInfo(detail.value.applyEndAt, now.value) : null
)
const targetGradeText = computed(() => {
  const { targetGradeMin, targetGradeMax } = detail.value ?? {}
  if (targetGradeMin == null && targetGradeMax == null) return ''
  if (targetGradeMin != null && targetGradeMax != null && targetGradeMin === targetGradeMax) {
    return `面向 ${targetGradeMin} 年级`
  }
  if (targetGradeMin != null && targetGradeMax != null) {
    return `面向 ${targetGradeMin}–${targetGradeMax} 年级`
  }
  if (targetGradeMin != null) return `${targetGradeMin} 年级及以上`
  return `${targetGradeMax} 年级及以下`
})

function phaseColor(
  state: NonNullable<typeof phase.value>
): 'success' | 'warning' | 'neutral' {
  if (state === 'OPEN') return 'success'
  if (state === 'UPCOMING') return 'warning'
  return 'neutral'
}

/** 打开申请弹窗（可选预选岗位）。 */
function openApply(positionId?: string) {
  defaultPositionId.value = positionId
  modalOpen.value = true
}

/** 提交申请。 */
function handleSubmit(draft: RecruitmentApplicationDraft) {
  const positionName =
    detail.value?.positions.find(position => position.id === draft.positionId)
      ?.name ?? draft.positionId
  activeApplication.value = submitRecruitmentApplication(draft, positionName)
  modalOpen.value = false
  toast.add({
    title: '申请已提交',
    description: `已申请「${positionName}」，可在「我的」中查看进度。`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <section
    class="py-10 sm:py-14"
    :class="{ 'pb-28 md:pb-14': detail && canApply }"
  >
    <PageContainer class="max-w-3xl">
      <div v-if="!detail">
        <p class="text-base text-muted">
          未找到该招新。
        </p>
        <RouterLink
          to="/organizations"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回社团与组织
        </RouterLink>
      </div>

      <template v-else>
        <RouterLink
          :to="detail.organization.detailPath"
          class="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary-600"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
            aria-hidden="true"
          />
          {{ detail.organization.name }}
        </RouterLink>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ organizationTypeLabel[detail.organization.type] }}
          </UBadge>
          <UBadge
            v-if="phase"
            size="sm"
            variant="soft"
            :color="phaseColor(phase)"
          >
            {{ recruitmentPhaseLabel[phase] }}
          </UBadge>
        </div>

        <h1 class="mt-3 text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
          {{ detail.title }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          由
          <RouterLink
            :to="detail.organization.detailPath"
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ detail.organization.name }}
          </RouterLink>
          发布
        </p>

        <div class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p class="text-muted">
            报名截止
            <span class="font-medium text-highlighted">{{ deadlineText }}</span>
            <span
              v-if="deadlineInfo?.label"
              class="ml-2"
              :class="phase === 'OPEN' ? 'text-warning-600 dark:text-warning-400' : 'text-muted'"
            >
              {{ deadlineInfo.label }}
            </span>
          </p>
          <p
            v-if="targetGradeText"
            class="text-muted"
          >
            面向群体
            <span class="font-medium text-highlighted">{{ targetGradeText }}</span>
          </p>
        </div>

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
            已申请「{{ activeApplication.positionName }}」，当前状态
            <span class="font-medium text-highlighted">
              {{ recruitmentApplicationStateLabel[activeApplication.status] }}
            </span>。
          </p>
        </div>

        <!-- 未开放 / 未开放的原因提示 -->
        <div
          v-else-if="detail && !canApply"
          class="mt-5 rounded-surface border border-default bg-default p-3 text-sm text-toned"
        >
          <template v-if="phase === 'UPCOMING'">
            该招新尚未开放，将于
            <span class="font-medium text-highlighted">{{ formatCompactDate(detail.applyStartAt) }}</span>
            开始报名。
          </template>
          <template v-else>
            该招新当前不可申请（{{ phase ? recruitmentPhaseLabel[phase] : '' }}）。
          </template>
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <UButton
            v-if="canApply && !activeApplication"
            color="primary"
            variant="solid"
            icon="i-lucide-user-plus"
            @click="openApply()"
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
          <UButton
            :to="detail.organization.detailPath"
            color="neutral"
            variant="ghost"
            icon="i-lucide-building-2"
          >
            查看组织主页
          </UButton>
        </div>

        <div class="mt-8 space-y-8">
          <OrganizationDetailSection title="招新介绍">
            <p class="whitespace-pre-line text-sm leading-7 text-toned">
              {{ detail.introMd }}
            </p>
          </OrganizationDetailSection>

          <OrganizationDetailSection
            v-if="detail.notesMd"
            title="其他说明"
          >
            <p class="whitespace-pre-line text-sm leading-7 text-toned">
              {{ detail.notesMd }}
            </p>
          </OrganizationDetailSection>

          <OrganizationDetailSection title="招聘岗位">
            <ul class="space-y-3">
              <li
                v-for="position in detail.positions"
                :key="position.id"
              >
                <RecruitmentPositionCard :position="position">
                  <template #footer>
                    <UButton
                      v-if="canApply && !activeApplication"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      @click="openApply(position.id)"
                    >
                      申请此岗位
                    </UButton>
                  </template>
                </RecruitmentPositionCard>
              </li>
            </ul>
          </OrganizationDetailSection>
        </div>
      </template>
    </PageContainer>

    <!-- Phone Sticky 申请操作条（仅「招新中」且未申请时） -->
    <div
      v-if="detail && canApply && !activeApplication"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <p class="min-w-0 flex-1 text-sm text-muted">
          报名已开放
        </p>
        <UButton
          color="primary"
          variant="solid"
          class="shrink-0"
          @click="openApply()"
        >
          申请加入
        </UButton>
      </div>
    </div>

    <RecruitmentApplicationModal
      v-if="detail"
      :open="modalOpen"
      :recruitment-id="recruitmentId"
      :positions="detail.positions"
      :default-position-id="defaultPositionId"
      @update:open="modalOpen = $event"
      @submit="handleSubmit"
    />
  </section>
</template>
