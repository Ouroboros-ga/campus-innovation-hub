<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import RecruitmentEditorModal from '@/features/organizations/components/RecruitmentEditorModal.vue'
import {
  managedApplications,
  managedRecruitments,
  setRecruitmentState
} from '@/features/organizations/lib/orgManagement'
import type { RecruitmentDetail, RecruitmentPublicationState } from '@/features/organizations/types'
import { formatCompactDate } from '@/shared/lib/date'

/** 招新管理（FE-080 / PageMap §招新管理）。 */
const route = useRoute()
const router = useRouter()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')

const statusMeta: Record<RecruitmentPublicationState, { label: string; color: 'neutral' | 'info' | 'warning' }> = {
  DRAFT: { label: '草稿', color: 'neutral' },
  PUBLISHED: { label: '已发布', color: 'info' },
  CANCELLED: { label: '已取消', color: 'warning' },
  ARCHIVED: { label: '已归档', color: 'neutral' }
}

const rows = computed(() =>
  managedRecruitments(orgId).map(recruitment => ({
    recruitment,
    applicantCount: managedApplications(orgId).filter(
      application => application.recruitmentId === recruitment.id
    ).length
  }))
)

const editorOpen = ref(false)
const editing = ref<RecruitmentDetail | null>(null)

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(recruitment: RecruitmentDetail) {
  editing.value = recruitment
  editorOpen.value = true
}

function publish(recruitment: RecruitmentDetail) {
  setRecruitmentState(orgId, recruitment.id, 'PUBLISHED')
  toast.add({
    title: '已发布',
    description: '该招新已发布。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}

function closeRecruitment(recruitment: RecruitmentDetail) {
  setRecruitmentState(orgId, recruitment.id, 'CANCELLED')
  toast.add({
    title: '已结束',
    description: '该招新已停止。',
    color: 'neutral',
    icon: 'i-lucide-lock'
  })
}

function viewApplications() {
  void router.push({ name: 'org-manage-applications', params: { organizationId: orgId } })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-highlighted">
        招新管理
      </h2>
      <UButton
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        新建招新
      </UButton>
    </div>

    <ul
      v-if="rows.length"
      class="space-y-3"
    >
      <li
        v-for="row in rows"
        :key="row.recruitment.id"
        class="rounded-surface border border-default bg-default p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-highlighted">
              {{ row.recruitment.title }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ formatCompactDate(row.recruitment.applyStartAt) }} 开始 ·
              {{ formatCompactDate(row.recruitment.applyEndAt) }} 截止
            </p>
          </div>
          <UBadge
            size="sm"
            variant="soft"
            :color="statusMeta[row.recruitment.publicationState].color"
          >
            {{ statusMeta[row.recruitment.publicationState].label }}
          </UBadge>
        </div>

        <div class="mt-2 text-xs text-muted">
          申请人数：{{ row.applicantCount }}
          <span class="mx-1 text-border">·</span>
          岗位数：{{ row.recruitment.positions.length }}
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-pencil"
            @click="openEdit(row.recruitment)"
          >
            编辑
          </UButton>
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-file-text"
            @click="viewApplications"
          >
            查看申请
          </UButton>
          <UButton
            v-if="row.recruitment.publicationState !== 'PUBLISHED'"
            size="sm"
            color="primary"
            variant="outline"
            icon="i-lucide-megaphone"
            @click="publish(row.recruitment)"
          >
            发布
          </UButton>
          <UButton
            v-if="row.recruitment.publicationState === 'PUBLISHED'"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-check"
            @click="closeRecruitment(row.recruitment)"
          >
            结束
          </UButton>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="text-sm text-muted"
    >
      暂无招新，点击「新建招新」创建。
    </p>

    <RecruitmentEditorModal
      :open="editorOpen"
      :org-id="orgId"
      :recruitment="editing"
      @update:open="editorOpen = $event"
    />
  </div>
</template>
