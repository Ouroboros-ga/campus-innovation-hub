<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'
import { formatDateTimeCompact } from '@/shared/lib/date'
import {
  organizationTypeIcon,
  organizationTypeLabel
} from '@/shared/lib/domain-labels'

import OrganizationDetailSection from '@/features/organizations/components/OrganizationDetailSection.vue'
import { findOrganizationDetail } from '@/features/organizations/lib/organizationDetail'
import {
  deriveRecruitmentStateFromRecruitment
} from '@/features/organizations/lib/organizationFilters'
import {
  orgRecruitmentStateDotClass,
  orgRecruitmentStateLabel,
  orgRecruitmentStateTextClass
} from '@/features/organizations/lib/organizationLabels'

/**
 * 组织主页（FE-041）— /organizations/:id
 *
 * 展示：组织的 Identity（Logo / 名称 / 类型 / 简介）、完整介绍、主要方向、
 * 负责人信息、近期活动、当前招新。
 * 设计来源：PageMap §组织主页 / FrontendDesign §23、§34.6。
 * Phone 使用 Detail Shell（移动端隐藏全局底栏，返回头部由壳层渲染）。
 */
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const detail = computed(() => findOrganizationDetail(id.value))
const now = computed(() => new Date())
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer>
      <div v-if="!detail">
        <p class="text-base text-muted">
          未找到该组织。
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
          to="/organizations"
          class="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-primary-600"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
            aria-hidden="true"
          />
          返回社团与组织
        </RouterLink>

        <!-- Identity -->
        <div class="mt-4 flex items-start gap-4">
          <span
            class="flex size-16 shrink-0 items-center justify-center rounded-surface bg-primary-50 dark:bg-primary-950/40"
            aria-hidden="true"
          >
            <UIcon
              :name="organizationTypeIcon[detail.type]"
              class="size-8 text-primary-600 dark:text-primary-400"
            />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold leading-tight text-highlighted">
                {{ detail.name }}
              </h1>
              <UBadge
                size="sm"
                variant="outline"
                color="neutral"
              >
                {{ organizationTypeLabel[detail.type] }}
              </UBadge>
            </div>
            <p
              v-if="detail.description"
              class="mt-2 max-w-2xl text-sm leading-6 text-muted"
            >
              {{ detail.description }}
            </p>
          </div>
        </div>

        <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div class="min-w-0 space-y-8">
            <OrganizationDetailSection title="组织简介">
              <p class="whitespace-pre-line text-sm leading-7 text-toned">
                {{ detail.descriptionMd }}
              </p>
            </OrganizationDetailSection>

            <OrganizationDetailSection title="主要方向">
              <p class="text-sm leading-7 text-toned">
                {{ detail.direction }}
              </p>
            </OrganizationDetailSection>

            <OrganizationDetailSection title="负责人信息">
              <dl class="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-muted">
                    负责人
                  </dt>
                  <dd class="mt-0.5 font-medium text-highlighted">
                    {{ detail.leaderName }}（{{ detail.leaderTitle }}）
                  </dd>
                </div>
                <div v-if="detail.advisorName">
                  <dt class="text-muted">
                    指导老师
                  </dt>
                  <dd class="mt-0.5 font-medium text-highlighted">
                    {{ detail.advisorName }}
                  </dd>
                </div>
                <div v-if="detail.publicContact">
                  <dt class="text-muted">
                    公开联系方式
                  </dt>
                  <dd class="mt-0.5 font-medium text-highlighted">
                    {{ detail.publicContact }}
                  </dd>
                </div>
              </dl>
            </OrganizationDetailSection>

            <OrganizationDetailSection title="近期活动">
              <ul
                v-if="detail.recentActivities.length"
                class="divide-y divide-default"
              >
                <li
                  v-for="activity in detail.recentActivities"
                  :key="activity.id"
                >
                  <RouterLink
                    :to="activity.detailPath"
                    class="group flex items-center justify-between gap-3 py-3"
                  >
                    <span
                      class="line-clamp-2 text-sm text-highlighted transition-colors group-hover:text-primary-600"
                    >
                      {{ activity.title }}
                    </span>
                    <span class="shrink-0 text-xs tabular-nums text-muted">
                      {{ formatDateTimeCompact(activity.startAt) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted"
              >
                暂无活动记录。
              </p>
            </OrganizationDetailSection>
          </div>

          <aside class="min-w-0">
            <OrganizationDetailSection title="当前招新">
              <ul
                v-if="detail.currentRecruitments.length"
                class="space-y-4"
              >
                <li
                  v-for="recruitment in detail.currentRecruitments"
                  :key="recruitment.id"
                  class="rounded-surface border border-default p-4"
                >
                  <h3 class="text-sm font-semibold text-highlighted">
                    {{ recruitment.title }}
                  </h3>
                  <p class="mt-2 flex items-center gap-1.5 text-xs">
                    <span
                      class="inline-block size-2 rounded-full"
                      :class="orgRecruitmentStateDotClass(deriveRecruitmentStateFromRecruitment(recruitment, now))"
                      aria-hidden="true"
                    />
                    <span
                      class="font-medium"
                      :class="orgRecruitmentStateTextClass(deriveRecruitmentStateFromRecruitment(recruitment, now))"
                    >
                      {{ orgRecruitmentStateLabel[deriveRecruitmentStateFromRecruitment(recruitment, now)] }}
                    </span>
                  </p>
                  <UButton
                    v-if="detail.recruitmentPath"
                    :to="detail.recruitmentPath"
                    color="primary"
                    variant="solid"
                    size="sm"
                    class="mt-3"
                  >
                    查看招新
                  </UButton>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-muted"
              >
                当前没有招新。
              </p>
            </OrganizationDetailSection>
          </aside>
        </div>
      </template>
    </PageContainer>
  </section>
</template>
