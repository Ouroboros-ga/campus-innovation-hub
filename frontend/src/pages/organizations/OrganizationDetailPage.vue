<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatCompactDate } from '@/shared/lib/date'
import {
  organizationTypeIcon,
  organizationTypeLabel
} from '@/shared/lib/domain-labels'

import ActivityBrowseCard from '@/features/dynamics/components/ActivityBrowseCard.vue'
import { findActivity, mdToPlainText } from '@/features/dynamics/lib/dynamicsDetail'
import OrganizationInfoCard from '@/features/organizations/components/OrganizationInfoCard.vue'
import QqGroupJoinModal from '@/features/organizations/components/QqGroupJoinModal.vue'
import {
  getOrganization,
  getRecruitment
} from '@/features/organizations/api/organizationApi'
import {
  deriveRecruitmentPhase,
  hasQqGroup,
  organizationOnlineEnabled,
  recruitmentCanApply,
  recruitmentOnlineEnabled
} from '@/features/organizations/lib/organizationDetail'
import { recruitmentPhaseLabel } from '@/features/organizations/lib/organizationLabels'
import type {
  OrganizationDetail,
  RecruitmentDetail,
  RecruitmentPhaseState
} from '@/features/organizations/types'

/**
 * 组织主页（FE-041 / FE-103 API 驱动，A 双轨并行）。
 *
 * 双轨：二维码入群为主、在线申请为辅；组织可自主关闭在线申请。
 * 友情链接：相关竞赛展示为外链引流，不替代社团自主性。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const detail = ref<OrganizationDetail | null>(null)
const loading = ref(true)
const error = ref(false)
const recDetails = ref<Record<string, RecruitmentDetail>>({})
const now = computed(() => new Date())

const qqModalOpen = ref(false)
const selectedRecruitmentId = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = false
  detail.value = null
  recDetails.value = {}
  try {
    const org = await getOrganization(id.value)
    detail.value = org
    const ids = org.currentRecruitments.map(rec => rec.id).filter(Boolean)
    const results = await Promise.all(
      ids.map(rid => getRecruitment(rid).catch(() => null))
    )
    const map: Record<string, RecruitmentDetail> = {}
    ids.forEach((rid, index) => {
      if (rid && results[index]) map[rid] = results[index]!
    })
    recDetails.value = map
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

/** 主要方向（按「/」拆分，去除空项）。 */
const directions = computed(() =>
  (detail.value?.direction ?? '')
    .split('/')
    .map(item => item.trim())
    .filter(Boolean)
)

/** 成立时间展示「2018年9月」。 */
function formatFoundedMonth(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

/** 近期活动（关联真实活动详情，以富化封面/地点/名额等）。 */
const recentActivities = computed(() =>
  (detail.value?.recentActivities ?? []).map(preview => ({
    preview,
    activity: findActivity(preview.id)
  }))
)

/** 当前招新（含岗位/截止，取自招新详情）。 */
const currentRecruitments = computed(() =>
  (detail.value?.currentRecruitments ?? []).map(recruitment => {
    const recDetail = recDetails.value[recruitment.id]
    const phase = recDetail ? deriveRecruitmentPhase(recDetail, now.value) : null
    const onlineEnabled = recDetail ? recruitmentOnlineEnabled(recDetail) : false
    const canApplyOnline = recDetail ? (phase === 'OPEN' && onlineEnabled) : false
    const hasQq = recDetail ? hasQqGroup(recDetail) : hasQqGroup(detail.value as OrganizationDetail)
    return { recruitment, recDetail, phase, onlineEnabled, canApplyOnline, hasQq }
  })
)

/** 是否有招新开放（用于 Sticky） */
const hasOpenRecruitment = computed(() =>
  currentRecruitments.value.some(item => item.phase === 'OPEN')
)

/** 组织级入群信息（回退展示） */
const orgQq = computed(() => detail.value ? { number: detail.value.qqGroupNumber, qr: detail.value.qqGroupQr, url: detail.value.qqGroupJoinUrl } : null)
const orgHasQq = computed(() => detail.value ? hasQqGroup(detail.value) : false)
const orgAllowsOnline = computed(() => detail.value ? organizationOnlineEnabled(detail.value) : false)

/** 当前弹窗要展示的招新（若未选则用组织级） */
const modalRecruitment = computed<RecruitmentDetail | null>(() => {
  if (selectedRecruitmentId.value) return recDetails.value[selectedRecruitmentId.value] ?? null
  return null
})
const modalTitle = computed(() => modalRecruitment.value ? modalRecruitment.value.title : detail.value?.name ? `${detail.value.name} · 招新入群` : '加入招新 QQ 群')
const modalQqNumber = computed(() => modalRecruitment.value?.qqGroupNumber ?? detail.value?.qqGroupNumber ?? null)
const modalQqQr = computed(() => modalRecruitment.value?.qqGroupQr ?? detail.value?.qqGroupQr ?? null)
const modalQqUrl = computed(() => modalRecruitment.value?.qqGroupJoinUrl ?? detail.value?.qqGroupJoinUrl ?? null)

function openQqModal(recruitmentId?: string) {
  selectedRecruitmentId.value = recruitmentId ?? null
  qqModalOpen.value = true
}

/** 某条招新的申请路径。 */
function recruitmentApplyPath(recruitmentId: string): string {
  return `/organizations/${id.value}/recruitments/${recruitmentId}`
}

/** 方向标签图标（展示用，非虚构统计）。 */
function directionIcon(label: string): string {
  if (label.includes('机器学习')) return 'i-lucide-brain'
  if (label.includes('视觉')) return 'i-lucide-eye'
  if (label.includes('语言')) return 'i-lucide-message-square-text'
  if (label.includes('数据')) return 'i-lucide-database'
  if (label.includes('智能系统') || label.includes('系统')) return 'i-lucide-cpu'
  if (label.includes('机器') || label.includes('ROS') || label.includes('嵌入')) return 'i-lucide-bot'
  if (label.includes('产品') || label.includes('设计') || label.includes('摄影')) return 'i-lucide-pen-tool'
  if (label.includes('创业') || label.includes('孵化')) return 'i-lucide-lightbulb'
  return 'i-lucide-sparkles'
}

function phaseColor(
  phase: RecruitmentPhaseState
): 'success' | 'warning' | 'neutral' {
  if (phase === 'OPEN') return 'success'
  if (phase === 'UPCOMING') return 'warning'
  return 'neutral'
}
</script>

<template>
  <section
    class="pt-4 pb-10 sm:pt-6 sm:pb-14"
    :class="{ 'pb-28 md:pb-14': hasOpenRecruitment }"
  >
    <PageContainer>
      <template v-if="loading">
        <div class="space-y-5">
          <USkeleton class="h-32 w-full rounded-card" />
          <USkeleton class="h-28 w-full rounded-card" />
          <USkeleton class="h-56 w-full rounded-card" />
        </div>
      </template>

      <div v-else-if="error">
        <p class="text-base text-muted">
          未找到该组织，或加载失败。
        </p>
        <RouterLink
          to="/organizations"
          class="mt-4 inline-flex min-h-9 items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          返回社团与组织
        </RouterLink>
      </div>

      <template v-else-if="detail">
        <!-- 桌面/平板面包屑：手机端由居中返回头承担返回（§16.5） -->
        <nav
          class="mb-5 hidden items-center gap-1.5 text-sm text-muted md:flex"
          aria-label="面包屑"
        >
          <RouterLink
            to="/"
            class="transition-colors hover:text-primary-600"
          >
            首页
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <RouterLink
            to="/organizations"
            class="transition-colors hover:text-primary-600"
          >
            社团组织
          </RouterLink>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3.5"
            aria-hidden="true"
          />
          <span class="text-highlighted">
            {{ detail.name }}
          </span>
        </nav>

        <!-- Identity 蓝色横幅 -->
        <div class="overflow-hidden rounded-card bg-primary-900 text-white">
          <div class="p-5 sm:p-7">
            <div class="flex items-start gap-4">
                <span
                  class="grid size-16 shrink-0 place-items-center rounded-card bg-white/10"
                  aria-hidden="true"
                >
                <UIcon
                  :name="organizationTypeIcon[detail.type]"
                  class="size-8"
                />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl font-bold leading-tight sm:text-3xl">
                    {{ detail.name }}
                  </h1>
                  <UBadge
                    size="sm"
                    variant="soft"
                    color="neutral"
                  >
                    {{ organizationTypeLabel[detail.type] }}
                  </UBadge>
                  <UBadge v-if="!orgAllowsOnline" size="sm" variant="soft" color="neutral">
                    仅引流
                  </UBadge>
                </div>
                <p
                  v-if="detail.description"
                  class="mt-2 max-w-2xl text-sm leading-6 text-white/80"
                >
                  {{ detail.description }}
                </p>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              <span
                v-if="detail.foundedAt"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-calendar-days"
                  class="size-4"
                  aria-hidden="true"
                />
                成立时间 {{ formatFoundedMonth(detail.foundedAt) }}
              </span>
              <span
                v-if="detail.memberCount != null"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-users"
                  class="size-4"
                  aria-hidden="true"
                />
                成员规模 {{ detail.memberCount }} 人
              </span>
              <span
                v-if="detail.college"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-school"
                  class="size-4"
                  aria-hidden="true"
                />
                所属学院 {{ detail.college }}
              </span>
            </div>
          </div>
        </div>

        <!-- 四个信息卡 -->
        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OrganizationInfoCard title="主要方向">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="direction in directions"
                :key="direction"
                class="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs text-highlighted dark:bg-neutral-800"
              >
                <UIcon
                  :name="directionIcon(direction)"
                  class="size-3.5 text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
                {{ direction }}
              </span>
              <span
                v-if="!directions.length"
                class="text-sm text-muted"
              >
                暂无
              </span>
            </div>
          </OrganizationInfoCard>

          <OrganizationInfoCard title="指导老师">
            <template v-if="detail.advisors.length">
              <ul class="space-y-3">
                <li
                  v-for="advisor in detail.advisors"
                  :key="advisor.membershipId || advisor.userId"
                  class="flex gap-3"
                >
                  <span
                    class="grid size-9 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30"
                    aria-hidden="true"
                  >
                    <UIcon
                      name="i-lucide-graduation-cap"
                      class="size-4"
                    />
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-highlighted">
                      {{ advisor.displayName ?? advisor.publicName ?? '—' }}
                      <span
                        v-if="advisor.academicTitle"
                        class="ml-1 font-normal text-muted"
                      >{{ advisor.academicTitle }}</span>
                    </p>
                    <p
                      v-if="advisor.department"
                      class="text-xs text-muted"
                    >
                      {{ advisor.department }}
                    </p>
                    <p
                      v-if="advisor.publicEmail"
                      class="text-xs text-toned"
                    >
                      {{ advisor.publicEmail }}
                    </p>
                    <p
                      v-if="advisor.officeLocation"
                      class="text-xs text-toned"
                    >
                      {{ advisor.officeLocation }}
                    </p>
                    <p
                      v-if="advisor.researchInterests.length"
                      class="mt-1 text-xs text-toned"
                    >
                      研究方向：{{ advisor.researchInterests.join('、') }}
                    </p>
                  </div>
                </li>
              </ul>
            </template>
            <p
              v-else
              class="text-muted"
            >
              暂无
            </p>
          </OrganizationInfoCard>

          <OrganizationInfoCard title="负责人">
            <p class="font-medium text-highlighted">
              {{ detail.leaderName }}
              <span class="ml-1 font-normal text-muted">{{ detail.leaderTitle }}</span>
            </p>
            <p
              v-if="detail.leaderGrade"
              class="mt-1 text-muted"
            >
              {{ detail.leaderGrade }}
            </p>
            <div
              v-if="detail.contactEmail || detail.contactPhone"
              class="mt-2 flex items-center gap-3 text-muted"
            >
              <UIcon
                v-if="detail.contactEmail"
                name="i-lucide-mail"
                class="size-4"
                aria-hidden="true"
              />
              <UIcon
                v-if="detail.contactPhone"
                name="i-lucide-phone"
                class="size-4"
                aria-hidden="true"
              />
            </div>
          </OrganizationInfoCard>

          <OrganizationInfoCard title="联系与入群">
            <div class="space-y-3">
              <!-- QQ 群主入口 -->
              <div v-if="orgHasQq" class="rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
                <p class="flex items-center gap-1.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                  <UIcon name="i-lucide-message-circle" class="size-3.5" aria-hidden="true" />
                  招新 QQ 群
                </p>
                <p v-if="orgQq?.number" class="mt-1 font-mono text-sm font-semibold text-highlighted">{{ orgQq.number }}</p>
                <UButton
                  color="primary"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-qr-code"
                  class="mt-2 w-full"
                  @click="openQqModal()"
                >
                  查看二维码入群
                </UButton>
                <p class="mt-1.5 text-[11px] leading-4 text-muted">扫码或复制群号入群，获取最新招新安排</p>
              </div>
              <div v-else class="rounded-lg border border-dashed border-default bg-muted/30 p-3">
                <p class="text-xs text-muted">该组织暂未公开 QQ 群，请通过下方方式联系</p>
              </div>

              <ul class="space-y-1.5 text-xs text-toned">
                <li
                  v-if="detail.contactEmail"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    name="i-lucide-mail"
                    class="size-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span class="truncate">{{ detail.contactEmail }}</span>
                </li>
                <li
                  v-if="detail.contactPhone"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="size-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span>{{ detail.contactPhone }}</span>
                </li>
                <li
                  v-if="detail.contactAddress"
                  class="flex items-center gap-1.5"
                >
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span>{{ detail.contactAddress }}</span>
                </li>
                <li
                  v-if="detail.wechatName"
                  class="flex items-start gap-1.5"
                >
                  <UIcon
                    name="i-lucide-qr-code"
                    class="size-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span>{{ detail.wechatName }}</span>
                </li>
                <li
                  v-if="!detail.contactEmail && !detail.contactPhone && !detail.contactAddress && !detail.wechatName && !orgHasQq"
                  class="text-muted"
                >
                  暂无
                </li>
              </ul>
              <p v-if="!orgAllowsOnline" class="text-[11px] leading-4 text-muted">
                该组织当前仅通过 QQ 群引流，未启用平台在线申请。
              </p>
            </div>
          </OrganizationInfoCard>
        </div>

        <!-- 内容：左近期活动 + 右当前招新 -->
        <div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div class="min-w-0 space-y-8">
            <section>
              <div class="flex items-center justify-between gap-4">
                <h2 class="text-lg font-semibold text-highlighted">
                  近期活动
                </h2>
                <RouterLink
                  to="/activities?tab=activities"
                  class="inline-flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-primary-600"
                >
                  查看全部
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4"
                    aria-hidden="true"
                  />
                </RouterLink>
              </div>

              <ul
                v-if="recentActivities.length"
                class="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <li
                  v-for="item in recentActivities"
                  :key="item.preview.id"
                >
                  <ActivityBrowseCard
                    v-if="item.activity"
                    :activity="item.activity"
                  />
                  <RouterLink
                    v-else
                    :to="item.preview.detailPath"
                    class="group flex items-center justify-between rounded-card border border-default bg-default p-4"
                  >
                    <span class="text-sm text-highlighted group-hover:text-primary-600">
                      {{ item.preview.title }}
                    </span>
                    <span class="shrink-0 text-xs tabular-nums text-muted">
                      {{ formatCompactDate(item.preview.startAt) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <p
                v-else
                class="mt-4 text-sm text-muted"
              >
                暂无活动记录。
              </p>
            </section>

            <section>
              <h2 class="text-lg font-semibold text-highlighted">
                组织介绍
              </h2>
              <p class="mt-3 whitespace-pre-line text-sm leading-7 text-toned">
                {{ detail.descriptionMd }}
              </p>
            </section>

            <!-- 友情链接：相关竞赛 -->
            <section v-if="detail.relatedLinks.length">
              <h2 class="flex items-center gap-2 text-lg font-semibold text-highlighted">
                <UIcon name="i-lucide-link-2" class="size-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                相关竞赛
              </h2>
              <p class="mt-1 text-xs text-muted">该组织关注或参与的竞赛，点击查看详情（友情链接 · 平台仅作引流）</p>
              <ul class="mt-3 grid gap-2">
                <li v-for="link in detail.relatedLinks" :key="link.url">
                  <RouterLink
                    :to="link.url"
                    class="group flex items-center justify-between rounded-card border border-default bg-default px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50 dark:hover:border-primary-800 dark:hover:bg-primary-900/20"
                  >
                    <span class="flex items-center gap-2 text-sm text-highlighted group-hover:text-primary-600">
                      <UIcon
                        :name="link.type === 'competition' ? 'i-lucide-trophy' : link.type === 'activity' ? 'i-lucide-calendar-days' : 'i-lucide-external-link'"
                        class="size-4 shrink-0 text-muted group-hover:text-primary-600"
                        aria-hidden="true"
                      />
                      {{ link.label }}
                    </span>
                    <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted group-hover:text-primary-600" aria-hidden="true" />
                  </RouterLink>
                </li>
              </ul>
            </section>
          </div>

          <aside class="min-w-0 space-y-6">
            <section>
              <div class="flex items-center justify-between gap-4">
                <h2 class="text-lg font-semibold text-highlighted">
                  当前招新
                </h2>
              </div>

              <ul
                v-if="currentRecruitments.length"
                class="mt-4 space-y-4"
              >
                <li
                  v-for="item in currentRecruitments"
                  :key="item.recruitment.id"
                  class="rounded-card border border-default bg-default p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <h3 class="text-base font-semibold text-highlighted">
                      {{ item.recruitment.title }}
                    </h3>
                    <UBadge
                      v-if="item.phase"
                      size="sm"
                      variant="soft"
                      :color="phaseColor(item.phase)"
                    >
                      {{ recruitmentPhaseLabel[item.phase] }}
                    </UBadge>
                  </div>

                  <p
                    v-if="item.recDetail?.applyEndAt"
                    class="mt-2 text-xs text-muted"
                  >
                    报名截止
                    <span class="tabular-nums font-medium text-highlighted">
                      {{ formatCompactDate(item.recDetail.applyEndAt) }}
                    </span>
                  </p>
                  <p
                    v-if="item.recDetail?.introMd"
                    class="mt-2 line-clamp-2 text-xs leading-5 text-toned"
                  >
                    {{ mdToPlainText(item.recDetail.introMd) }}
                  </p>

                  <div
                    v-if="item.recDetail?.positions.length"
                    class="mt-4 space-y-3"
                  >
                    <div
                      v-for="position in item.recDetail.positions"
                      :key="position.id"
                      class="rounded-md bg-muted/40 p-3"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-semibold text-highlighted">
                          {{ position.name }}
                        </span>
                        <span class="text-xs tabular-nums text-muted">
                          {{ position.headcount }} 人
                        </span>
                      </div>
                      <p
                        v-if="position.description"
                        class="mt-1 text-xs leading-5 text-toned"
                      >
                        {{ position.description }}
                      </p>
                      <p
                        v-if="position.requirements"
                        class="mt-1 flex items-start gap-1 text-xs text-muted"
                      >
                        <UIcon
                          name="i-lucide-check"
                          class="mt-0.5 size-3.5 shrink-0 text-success-600"
                          aria-hidden="true"
                        />
                        <span>{{ position.requirements }}</span>
                      </p>
                    </div>
                  </div>

                  <!-- 双轨按钮：二维码为主、在线申请为辅 -->
                  <div class="mt-4 flex flex-col gap-2">
                    <UButton
                      color="primary"
                      variant="solid"
                      icon="i-lucide-qr-code"
                      block
                      @click="openQqModal(item.recruitment.id)"
                    >
                      查看入群方式
                    </UButton>
                    <UButton
                      v-if="item.canApplyOnline"
                      :to="recruitmentApplyPath(item.recruitment.id)"
                      color="neutral"
                      variant="soft"
                      icon="i-lucide-file-text"
                      block
                    >
                      在线申请（试点）
                    </UButton>
                    <p v-else-if="item.phase === 'OPEN' && !item.onlineEnabled" class="text-center text-[11px] text-muted">
                      该轮招新未启用在线申请，请通过 QQ 群入群
                    </p>
                    <UButton
                      v-else-if="item.phase && !recruitmentCanApply(item.phase)"
                      :to="recruitmentApplyPath(item.recruitment.id)"
                      color="neutral"
                      variant="ghost"
                      block
                    >
                      查看招新详情
                    </UButton>
                  </div>
                </li>
              </ul>
              <p
                v-else
                class="mt-4 text-sm text-muted"
              >
                当前没有招新。
              </p>
            </section>
          </aside>
        </div>
      </template>
    </PageContainer>

    <!-- 手机 Sticky：入群为主 -->
    <div
      v-if="detail && hasOpenRecruitment"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <p class="min-w-0 flex-1 text-sm text-muted">
          <span class="font-medium text-highlighted">正在招新</span>
          <span class="ml-1 hidden sm:inline">· 优先加入 QQ 群</span>
        </p>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-qr-code"
          class="shrink-0"
          @click="openQqModal(currentRecruitments.find(i => i.phase === 'OPEN')?.recruitment.id)"
        >
          入群方式
        </UButton>
      </div>
    </div>

    <QqGroupJoinModal
      v-if="detail"
      :open="qqModalOpen"
      :organization-name="detail.name"
      :title="modalTitle"
      :qq-group-number="modalQqNumber"
      :qq-group-qr="modalQqQr"
      :qq-group-join-url="modalQqUrl"
      @update:open="qqModalOpen = $event"
    />
  </section>
</template>
