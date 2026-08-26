<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  organizationTypeIcon,
  organizationTypeLabel
} from '@/shared/lib/domain-labels'

import type { MyOrganization } from '../types'

/**
 * 我的组织（FE-040 / PageMap §组织列表）。
 *
 * - 仅当存在有效组织身份时渲染；无身份时整个区块不渲染、不显示空态；
 * - 至多 4 项紧凑展示，超出原位「查看全部 / 收起」；
 * - MEMBER 只能进入组织主页；LEADER 额外获得「进入管理」（携带 organizationId）。
 */
const props = defineProps<{ items: MyOrganization[] }>()

const COLLAPSED_LIMIT = 4

const collapsed = ref(true)
const canToggle = computed(() => props.items.length > COLLAPSED_LIMIT)
const visibleItems = computed(() =>
  collapsed.value ? props.items.slice(0, COLLAPSED_LIMIT) : props.items
)

function toggle() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <section
    data-test="my-organizations"
    aria-labelledby="my-organizations-title"
  >
    <div class="flex items-center gap-2">
      <UIcon
        name="i-lucide-users"
        class="size-5 text-highlighted"
        aria-hidden="true"
      />
      <h2
        id="my-organizations-title"
        class="text-lg font-semibold text-highlighted"
      >
        我的组织
      </h2>
    </div>

    <div class="mt-3 grid gap-4 sm:grid-cols-2">
      <article
        v-for="item in visibleItems"
        :key="item.organization.id"
        class="flex gap-3 rounded-card border border-default bg-default p-4"
      >
        <span
          class="flex size-12 shrink-0 items-center justify-center rounded-surface bg-primary-50 dark:bg-primary-950/40"
          aria-hidden="true"
        >
          <UIcon
            :name="organizationTypeIcon[item.organization.type]"
            class="size-6 text-primary-600 dark:text-primary-400"
          />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ item.organization.name }}
            </h3>
            <UBadge
              size="sm"
              variant="outline"
              color="neutral"
            >
              {{ organizationTypeLabel[item.organization.type] }}
            </UBadge>
          </div>
          <p class="mt-1 text-xs text-muted">
            我的角色：{{ item.roleLabel }}
          </p>
          <p class="mt-1 line-clamp-1 text-xs text-muted">
            {{ item.organization.description }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <UButton
              :to="item.organization.detailPath"
              color="neutral"
              variant="soft"
              size="sm"
            >
              查看组织
            </UButton>
            <UButton
              v-if="item.membership === 'LEADER'"
              :to="`/manage/organizations/${item.organization.id}`"
              color="primary"
              variant="solid"
              size="sm"
            >
              进入管理
            </UButton>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="canToggle"
      class="mt-3 flex justify-center"
    >
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-expanded="!collapsed"
        :icon="collapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
        @click="toggle"
      >
        {{ collapsed ? '查看全部' : '收起' }}
      </UButton>
    </div>
  </section>
</template>
