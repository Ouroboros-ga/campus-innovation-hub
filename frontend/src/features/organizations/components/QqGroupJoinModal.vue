<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@nuxt/ui/composables'

import type { HomepageImage } from '@/shared/types/homepage'

const props = defineProps<{
  open: boolean
  organizationName: string
  title?: string
  qqGroupNumber: string | null
  qqGroupQr: HomepageImage | null
  qqGroupJoinUrl: string | null
}>()

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const toast = useToast()

const hasQr = computed(() => Boolean(props.qqGroupQr?.src))
const hasNumber = computed(() => Boolean(props.qqGroupNumber))
const hasJoinUrl = computed(() => Boolean(props.qqGroupJoinUrl))

async function copyGroupNumber() {
  if (!props.qqGroupNumber) return
  try {
    await window.navigator.clipboard.writeText(props.qqGroupNumber)
    toast.add({ title: '已复制群号', description: props.qqGroupNumber, color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: '复制失败', description: '请手动复制群号', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="props.open" :title="props.title ?? '加入招新 QQ 群'" @update:open="emit('update:open', $event)">
    <template #body>
      <div class="space-y-5">
        <p class="text-sm leading-6 text-toned">
          加入 <span class="font-medium text-highlighted">{{ props.organizationName }}</span> 的招新群，获取最新招新安排与答疑。这是当前最直接的入群方式；平台仅作信息引流，不替代社团的自主审核。
        </p>

        <!-- 二维码 -->
        <div class="flex flex-col items-center gap-3 rounded-card border border-default bg-muted/30 p-5">
          <div
            class="grid size-48 place-items-center overflow-hidden rounded-lg border border-default bg-default"
          >
            <img
              v-if="hasQr"
              :src="props.qqGroupQr!.src!"
              :alt="props.qqGroupQr!.alt"
              class="size-full object-contain"
            />
            <div v-else class="flex flex-col items-center gap-2 p-4 text-center">
              <UIcon name="i-lucide-qr-code" class="size-10 text-muted" aria-hidden="true" />
              <p class="text-xs text-muted">二维码由社团提供，当前为占位</p>
              <p v-if="props.qqGroupQr?.alt" class="text-xs text-toned">{{ props.qqGroupQr.alt }}</p>
            </div>
          </div>
          <p class="text-xs text-muted">长按或右键保存二维码 · 扫码入群</p>
        </div>

        <!-- 群号与操作 -->
        <div class="space-y-3">
          <div v-if="hasNumber" class="flex items-center justify-between gap-3 rounded-lg border border-default bg-default p-3">
            <div class="min-w-0">
              <p class="text-xs text-muted">QQ 群号</p>
              <p class="mt-0.5 font-mono text-sm font-semibold text-highlighted">{{ props.qqGroupNumber }}</p>
            </div>
            <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-copy" @click="copyGroupNumber">
              复制群号
            </UButton>
          </div>

          <div v-if="hasJoinUrl" class="flex">
            <UButton
              :to="props.qqGroupJoinUrl!"
              target="_blank"
              external
              color="primary"
              variant="soft"
              icon="i-lucide-external-link"
              block
            >
              打开入群链接
            </UButton>
          </div>

          <p v-if="!hasNumber && !hasQr && !hasJoinUrl" class="rounded-lg bg-warning-50 p-3 text-sm text-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
            该组织暂未提供 QQ 群信息，请通过组织主页的公开联系方式联系负责人。
          </p>
        </div>

        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          title="温馨提示"
          description="入群后请遵守群公告与招新安排；平台“在线申请”为试点功能，是否启用由社团自主决定。"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="ghost" @click="emit('update:open', false)">关闭</UButton>
      </div>
    </template>
  </UModal>
</template>
