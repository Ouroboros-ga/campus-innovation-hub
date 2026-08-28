<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import QqGroupJoinModal from '@/features/organizations/components/QqGroupJoinModal.vue'
import RecruitmentApplicationModal from '@/features/organizations/components/RecruitmentApplicationModal.vue'
import RecruitmentPositionCard from '@/features/organizations/components/RecruitmentPositionCard.vue'
import { getRecruitment } from '@/features/organizations/api/organizationApi'
import {
  getMyActiveApplication,
  submitRecruitmentApplication
} from '@/features/organizations/lib/organizationApplication'
import {
  deriveRecruitmentPhase,
  recruitmentOnlineEnabled
} from '@/features/organizations/lib/organizationDetail'
import {
  recruitmentApplicationStateLabel,
  recruitmentPhaseLabel
} from '@/features/organizations/lib/organizationLabels'
import type {
  MyRecruitmentApplication,
  RecruitmentApplicationDraft,
  RecruitmentDetail
} from '@/features/organizations/types'

/**
 * 招新详情（FE-042 · A 双轨并行）。
 * 主操作：查看入群方式（二维码/群号/链接）；
 * 次操作：在线申请（仅当组织与本轮均启用时展示，科创部自用）。
 */
const route = useRoute()
const toast = useToast()

const recruitmentId = computed(() =>
  String(route.params.recruitmentId ?? '')
)
const detail = ref<RecruitmentDetail | null>(null)
const loading = ref(true)
const error = ref(false)
const now = computed(() => new Date())

const modalOpen = ref(false)
const qqModalOpen = ref(false)
const defaultPositionId = ref<string | undefined>(undefined)
const activeApplication = ref<MyRecruitmentApplication | undefined>(undefined)

async function load() {
  loading.value = true
  error.value = false
  detail.value = null
  try {
    const result = await getRecruitment(recruitmentId.value)
    detail.value = result
    activeApplication.value = getMyActiveApplication(recruitmentId.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(recruitmentId, load, { immediate: true })

const phase = computed(() =>
  detail.value ? deriveRecruitmentPhase(detail.value, now.value) : null
)
const isOpen = computed(() => phase.value === 'OPEN')
const onlineEnabled = computed(() =>
  detail.value ? recruitmentOnlineEnabled(detail.value) : false
)
const canApplyOnline = computed(() => isOpen.value && onlineEnabled.value && !activeApplication.value)

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

function openQq() {
  qqModalOpen.value = true
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
    :class="{ 'pb-28 md:pb-14': detail && isOpen }"
  >
    <PageContainer class="max-w-3xl">
      <template v-if="loading">
        <div class="space-y-5">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-40 w-full rounded-card" />
          <USkeleton class="h-28 w-full rounded-card" />
        </div>
      </template>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该招新，或加载失败。
        </p>
        <RouterLink
          to="/organizations"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回社团与组织
        </RouterLink>
      </div>

      <template v-else-if="detail">
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
          <UBadge v-if="!onlineEnabled" size="sm" variant="soft" color="neutral">
            仅 QQ 群引流
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
          v-else-if="detail && !isOpen"
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

        <!-- 双轨主操作：入群为主 -->
        <div class="mt-6 flex flex-wrap items-center gap-2">
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-qr-code"
            @click="openQq"
          >
            查看入群方式
          </UButton>
          <UButton
            v-if="canApplyOnline"
            color="neutral"
            variant="soft"
            icon="i-lucide-file-text"
            @click="openApply()"
          >
            在线申请（试点）
          </UButton>
          <UButton
            v-if="activeApplication"
            color="neutral"
            variant="soft"
            icon="i-lucide-check"
            disabled
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
        <p v-if="isOpen && !onlineEnabled" class="mt-2 text-xs text-muted">
          该轮招新未启用在线申请，请通过 QQ 群入群咨询与报名；科创部等组织可保持在线申请开启。
        </p>
        <p v-else-if="isOpen && onlineEnabled" class="mt-2 text-xs text-muted">
          优先加入 QQ 群获取最新安排；也可通过「在线申请（试点）」提交表单。
        </p>

        <!-- 入群方式卡片（常驻） -->
        <div class="mt-6 rounded-card border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-highlighted">
            <UIcon name="i-lucide-message-circle" class="size-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            招新 QQ 群
          </h3>
          <div class="mt-3 flex items-start gap-4">
            <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-default bg-default">
              <img
                v-if="detail.qqGroupQr?.src"
                :src="detail.qqGroupQr.src"
                :alt="detail.qqGroupQr.alt"
                class="size-full object-contain"
              />
              <UIcon v-else name="i-lucide-qr-code" class="size-8 text-muted" aria-hidden="true" />
            </div>
            <div class="min-w-0 flex-1">
              <p v-if="detail.qqGroupNumber" class="font-mono text-sm font-semibold text-highlighted">群号 {{ detail.qqGroupNumber }}</p>
              <p v-else class="text-sm text-muted">群号由社团提供，见二维码</p>
              <p class="mt-1 text-xs leading-5 text-toned">
                扫码入群或点击「查看入群方式」复制群号、打开入群链接。平台仅作引流，不替代社团自主审核。
              </p>
              <UButton color="primary" variant="soft" size="xs" class="mt-2" icon="i-lucide-qr-code" @click="openQq">
                查看二维码
              </UButton>
            </div>
          </div>
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
                    <div class="flex gap-2">
                      <UButton
                        color="primary"
                        variant="soft"
                        size="sm"
                        @click="openQq"
                      >
                        入群咨询
                      </UButton>
                      <UButton
                        v-if="canApplyOnline"
                        color="neutral"
                        variant="outline"
                        size="sm"
                        @click="openApply(position.id)"
                      >
                        申请此岗位
                      </UButton>
                    </div>
                  </template>
                </RecruitmentPositionCard>
              </li>
            </ul>
          </OrganizationDetailSection>
        </div>
      </template>
    </PageContainer>

    <!-- Phone Sticky：入群为主 -->
    <div
      v-if="detail && isOpen"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <p class="min-w-0 flex-1 text-sm text-muted">
          <span v-if="onlineEnabled">优先入群 · 可在线申请</span>
          <span v-else>请加入 QQ 群报名</span>
        </p>
        <UButton
          color="primary"
          variant="solid"
          class="shrink-0"
          icon="i-lucide-qr-code"
          @click="openQq"
        >
          入群方式
        </UButton>
        <UButton
          v-if="canApplyOnline"
          color="neutral"
          variant="soft"
          class="shrink-0 hidden sm:inline-flex"
          @click="openApply()"
        >
          在线申请
        </UButton>
      </div>
    </div>

    <QqGroupJoinModal
      v-if="detail"
      :open="qqModalOpen"
      :organization-name="detail.organization.name"
      :title="detail.title"
      :qq-group-number="detail.qqGroupNumber"
      :qq-group-qr="detail.qqGroupQr"
      :qq-group-join-url="detail.qqGroupJoinUrl"
      @update:open="qqModalOpen = $event"
    />

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
