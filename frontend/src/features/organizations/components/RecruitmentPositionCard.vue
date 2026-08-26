<script setup lang="ts">
import type { OrganizationPosition } from '../types'

/**
 * 招新岗位（FE-042）。
 *
 * 展示岗位名称、人数、岗位说明与要求。用细分隔线与紧凑信息列表，
 * 不使用卡片套卡片。
 */
defineProps<{ position: OrganizationPosition }>()
</script>

<template>
  <article class="rounded-surface border border-default p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-base font-semibold text-highlighted">
        {{ position.name }}
      </h3>
      <span class="text-sm text-muted">
        招 {{ position.headcount }} 人
      </span>
    </div>

    <p
      v-if="position.description"
      class="mt-2 text-sm leading-6 text-toned"
    >
      {{ position.description }}
    </p>

    <p
      v-if="position.requirements"
      class="mt-2 text-sm leading-6 text-muted"
    >
      <span class="font-medium text-highlighted">要求：</span>
      {{ position.requirements }}
    </p>

    <div
      v-if="$slots.footer"
      class="mt-3 flex justify-end border-t border-default pt-3"
    >
      <slot name="footer" />
    </div>
  </article>
</template>
