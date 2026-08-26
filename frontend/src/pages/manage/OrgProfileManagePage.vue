<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'

import { managedOrganizationDetail } from '@/features/organizations/lib/orgManagement'

/** 组织资料管理（FE-080 / PageMap §组织资料管理）。 */
const route = useRoute()
const toast = useToast()

const orgId = String(route.params.organizationId ?? '')
const detail = computed(() => managedOrganizationDetail(orgId))

const intro = ref(detail.value?.descriptionMd ?? '')
const direction = ref(detail.value?.direction ?? '')
const contactEmail = ref(detail.value?.contactEmail ?? '')
const contactPhone = ref(detail.value?.contactPhone ?? '')
const contactAddress = ref(detail.value?.contactAddress ?? '')
const publicContact = ref(detail.value?.publicContact ?? '')

function markMedia() {
  toast.add({
    title: '演示环境',
    description: 'Logo / Banner 暂不支持下传。',
    color: 'neutral',
    icon: 'i-lucide-info'
  })
}

function save() {
  toast.add({
    title: '已保存',
    description: '组织资料修改已保存（mock）。',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-surface border border-default bg-default p-4 text-sm text-muted">
      <UIcon
        name="i-lucide-image"
        class="mr-1.5 size-4 align-text-bottom"
        aria-hidden="true"
      />
      Logo / Banner
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        class="ml-2"
        @click="markMedia"
      >
        更换媒体
      </UButton>
      <span class="ml-2 text-xs">（不可删除 / 类型不可编辑，V0.1）</span>
    </div>

    <form
      class="space-y-4"
      novalidate
      @submit.prevent="save"
    >
      <UFormField label="组织介绍">
        <UTextarea
          v-model="intro"
          :rows="4"
          class="w-full"
        />
      </UFormField>

      <UFormField label="主要方向">
        <UInput
          v-model="direction"
          placeholder="用 / 分隔多个方向"
          class="w-full"
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="公开邮箱">
          <UInput
            v-model="contactEmail"
            class="w-full"
          />
        </UFormField>
        <UFormField label="公开电话">
          <UInput
            v-model="contactPhone"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="公开地址">
        <UInput
          v-model="contactAddress"
          class="w-full"
        />
      </UFormField>

      <UFormField label="单行公开联系方式">
        <UInput
          v-model="publicContact"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end">
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          icon="i-lucide-save"
        >
          保存修改
        </UButton>
      </div>
    </form>
  </div>
</template>
