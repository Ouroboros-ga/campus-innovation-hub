<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PageContainer from '@/shared/components/layout/PageContainer.vue'

import OrgManageNav from './OrgManageNav.vue'
import { managedMembership } from '../lib/orgManagement'

/**
 * 组织管理外壳（FE-080）— /manage/organizations/:organizationId
 *
 * 权限 UX（仅 mock）：负责人（LEADER）可见管理；成员 / 学生不可见。
 * 入口仅来自 `/organizations` 的 LEADER 组织项；`mobileShell: 'manage'`,
 * Phone 不显示全局 Bottom Navigation（PublicLayout 已处理）。
 */
const route = useRoute()
const orgId = computed(() => String(route.params.organizationId ?? ''))
const membership = computed(() => managedMembership(orgId.value))
</script>

<template>
  <section class="py-10 sm:py-14">
    <PageContainer class="max-w-4xl">
      <div v-if="!membership">
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          无权访问
        </h1>
        <p class="mt-2 text-base text-muted">
          仅组织负责人可访问管理后台。
        </p>
        <UButton
          to="/organizations"
          color="primary"
          variant="solid"
          class="mt-6"
        >
          返回组织列表
        </UButton>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold leading-tight text-highlighted sm:text-3xl">
                {{ membership.organization.name }}
              </h1>
              <UBadge
                size="sm"
                variant="soft"
                color="success"
                icon="i-lucide-shield-check"
              >
                组织管理
              </UBadge>
            </div>
            <p class="mt-1.5 text-sm text-muted">
              当前身份：{{ membership.roleLabel }}
            </p>
          </div>
          <UButton
            :to="membership.organization.detailPath"
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
          >
            返回组织主页
          </UButton>
        </div>

        <OrgManageNav class="mt-6" />

        <div class="mt-6">
          <RouterView />
        </div>
      </template>
    </PageContainer>
  </section>
</template>
